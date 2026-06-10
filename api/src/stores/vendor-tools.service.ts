import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { DeliveryZoneDto } from './dto/delivery-zone.dto';
import { QuickReplyDto } from './dto/quick-reply.dto';

@Injectable()
export class VendorToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuickReplies(vendorId: string) {
    const store = await this.prisma.store.findUnique({ where: { vendorId } });
    if (!store) throw new NotFoundException('Store not found.');
    return store.quickReplyTemplates;
  }

  async saveQuickReplies(vendorId: string, templates: QuickReplyDto[]) {
    await this.prisma.store.update({
      where: { vendorId },
      data: { quickReplyTemplates: templates as unknown as Prisma.InputJsonValue },
    });
    return templates;
  }

  async getDeliveryZones(vendorId: string) {
    const store = await this.prisma.store.findUnique({ where: { vendorId } });
    if (!store) throw new NotFoundException('Store not found.');
    return store.deliveryZones;
  }

  async saveDeliveryZones(vendorId: string, zones: DeliveryZoneDto[]) {
    await this.prisma.store.update({
      where: { vendorId },
      data: { deliveryZones: zones as unknown as Prisma.InputJsonValue },
    });
    return zones;
  }

  async listDiscountCodes(vendorId: string) {
    return this.prisma.discountCode.findMany({
      where: { storeId: vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDiscountCode(vendorId: string, body: CreateDiscountCodeDto) {
    return this.prisma.discountCode.create({
      data: {
        storeId: vendorId,
        code: body.code.trim().toUpperCase(),
        type: body.type,
        value: body.value,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        maxUses: body.maxUses,
        flashEndsAt: body.flashEndsAt ? new Date(body.flashEndsAt) : null,
      },
    });
  }

  async deleteDiscountCode(vendorId: string, codeId: string) {
    const code = await this.prisma.discountCode.findFirst({
      where: { id: codeId, storeId: vendorId },
    });
    if (!code) throw new NotFoundException('Discount code not found.');
    await this.prisma.discountCode.delete({ where: { id: codeId } });
    return { success: true };
  }

  async listStockLocations(vendorId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: vendorId },
      include: { stockLocations: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product.stockLocations;
  }

  async upsertStockLocation(
    vendorId: string,
    productId: string,
    locationName: string,
    stock: number,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: vendorId },
    });
    if (!product) throw new NotFoundException('Product not found.');

    return this.prisma.productStockLocation.upsert({
      where: {
        productId_locationName: { productId, locationName },
      },
      create: { productId, locationName, stock },
      update: { stock },
    });
  }

  async getAnalytics(vendorId: string) {
    const orders = await this.prisma.order.findMany({
      where: { storeId: vendorId, paymentStatus: 'paid' },
      select: {
        totalPaid: true,
        customerPhone: true,
        customerName: true,
        deliveryAddress: true,
      },
    });

    const phoneCounts = new Map<string, { name: string; count: number }>();
    const cityCounts = new Map<string, number>();

    for (const order of orders) {
      const existing = phoneCounts.get(order.customerPhone);
      phoneCounts.set(order.customerPhone, {
        name: existing?.name ?? order.customerName,
        count: (existing?.count ?? 0) + 1,
      });

      const city = this.extractCity(order.deliveryAddress);
      if (city) {
        cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
      }
    }

    const repeatCustomers = [...phoneCounts.values()].filter(
      (entry) => entry.count > 1,
    ).length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPaid, 0);
    const averageOrderValue =
      orders.length === 0 ? 0 : totalRevenue / orders.length;

    const topCustomers = [...phoneCounts.entries()]
      .map(([phone, entry]) => ({
        phone,
        name: entry.name,
        orderCount: entry.count,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    return {
      repeatCustomerRate:
        phoneCounts.size === 0 ? 0 : repeatCustomers / phoneCounts.size,
      averageOrderValue,
      ordersByCity: [...cityCounts.entries()]
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topCustomers,
    };
  }

  private extractCity(deliveryAddress?: string | null): string | null {
    if (!deliveryAddress?.trim()) return null;
    const parts = deliveryAddress.split(',').map((part) => part.trim());
    return parts.at(-1) ?? null;
  }
}
