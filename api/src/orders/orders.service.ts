import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderStatus,
  PaymentStatus,
  PlanTier,
  Prisma,
} from '@prisma/client';
import { DELIVERY_TYPE_IDS } from '../common/constants/delivery-types';
import { deliveryRequiresAddress } from '../common/delivery.util';
import { normalizePhone } from '../common/phone.util';
import { PaystackService } from '../payments/paystack.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderDeliveredEvent } from './events/order-delivered.event';
import { OrderCreatedEvent } from './events/order-created.event';
import {
  ORDER_CREATED_EVENT,
  ORDER_DELIVERED_EVENT,
  ORDER_STATUS_UPDATED_EVENT,
  REVIEW_INVITE_EVENT,
} from './events/order.events';
import { OrderStatusUpdatedEvent } from './events/order-status-updated.event';
import { ReviewInviteEvent } from './events/review-invite.event';
import { OrderCheckoutBaseDto } from './dto/order-checkout-base.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto, toOrderDto } from './orders.mapper';

type DeliveryZone = { id: string; name: string; fee: number };

function generatePaymentRef(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const shortId = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `SHP-${datePart}-${shortId}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paystack: PaystackService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async checkout(dto: OrderCheckoutBaseDto, storeSlug: string) {
    const pricing = await this.resolvePricing(dto);
    const paystackReference = `ps_${generatePaymentRef()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      if (pricing.discountRecordId) {
        await this.consumeDiscountCode(tx, pricing.discountRecordId);
      }

      return tx.order.create({
        data: {
          paymentRef: generatePaymentRef(),
          storeId: dto.storeId,
          productId: dto.productId,
          productName: dto.productName,
          color: dto.color ?? null,
          size: dto.size ?? null,
          quantity: dto.quantity,
          deliveryType: dto.deliveryType,
          unitPrice: pricing.unitPrice,
          deliveryFee: pricing.deliveryFee,
          discountAmount: pricing.discountAmount,
          discountCode: pricing.discountCode,
          totalPaid: pricing.totalPaid,
          customerName: dto.customerName.trim(),
          customerPhone: normalizePhone(dto.customerPhone),
          deliveryAddress: dto.deliveryAddress?.trim() || null,
          status: OrderStatus.reserved,
          paymentStatus: PaymentStatus.pending,
          paystackReference,
        },
      });
    });

    if (this.paystack.isConfigured()) {
      const init = await this.paystack.initializeTransaction({
        email: `${order.customerPhone}@cataloghq.ng`,
        amountKobo: order.totalPaid * 100,
        reference: paystackReference,
        callbackPath: `/s/${storeSlug}/order/${order.paymentRef}?paid=1`,
        metadata: { paymentRef: order.paymentRef, orderId: order.id },
      });

      return {
        order: toOrderDto(order),
        payment: {
          mock: false,
          authorizationUrl: init.authorizationUrl,
          reference: init.reference,
          publicKey: this.paystack.getPublicKey(),
        },
      };
    }

    await this.paymentsService.confirmPayment(paystackReference);
    const paid = await this.prisma.order.findUnique({ where: { id: order.id } });

    return {
      order: toOrderDto(paid!),
      payment: { mock: true, authorizationUrl: null, reference: paystackReference },
    };
  }

  async reserve(dto: OrderCheckoutBaseDto): Promise<OrderDto> {
    const pricing = await this.resolvePricing(dto);
    const reservedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const order = await this.prisma.$transaction(async (tx) => {
      if (pricing.discountRecordId) {
        await this.consumeDiscountCode(tx, pricing.discountRecordId);
      }

      const created = await tx.order.create({
        data: {
          paymentRef: generatePaymentRef(),
          storeId: dto.storeId,
          productId: dto.productId,
          productName: dto.productName,
          color: dto.color ?? null,
          size: dto.size ?? null,
          quantity: dto.quantity,
          deliveryType: dto.deliveryType,
          unitPrice: pricing.unitPrice,
          deliveryFee: pricing.deliveryFee,
          discountAmount: pricing.discountAmount,
          discountCode: pricing.discountCode,
          totalPaid: pricing.totalPaid,
          customerName: dto.customerName.trim(),
          customerPhone: normalizePhone(dto.customerPhone),
          deliveryAddress: dto.deliveryAddress?.trim() || null,
          status: OrderStatus.reserved,
          paymentStatus: PaymentStatus.pending,
          reservedUntil,
        },
      });

      await this.holdStock(tx, dto.storeId, dto.productId, dto.quantity);
      return created;
    });

    return toOrderDto(order);
  }

  async create(dto: CreateOrderDto): Promise<OrderDto> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: dto.storeId },
    });
    const result = await this.checkout(dto, store?.slug ?? '');
    return result.order;
  }

  async verifyPayment(paymentRef: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef: { equals: paymentRef, mode: 'insensitive' } },
    });

    if (!order?.paystackReference) {
      throw new NotFoundException('Order not found.');
    }

    if (order.paymentStatus !== PaymentStatus.paid) {
      await this.paymentsService.confirmPayment(order.paystackReference);
    }

    const updated = await this.prisma.order.findUnique({
      where: { id: order.id },
    });

    if (!updated) {
      throw new NotFoundException('Order not found.');
    }

    return toOrderDto(updated);
  }

  async getReceipt(paymentRef: string) {
    const order = await this.getByPaymentRef(paymentRef);
    return {
      valid: order.paymentStatus === 'paid' || order.status !== 'reserved',
      order,
      verifyUrl: `/receipt/${order.paymentRef}`,
    };
  }

  async listByStoreId(storeId: string, query?: string): Promise<OrderDto[]> {
    const where: Prisma.OrderWhereInput = { storeId };

    if (query?.trim()) {
      const term = query.trim();
      where.OR = [
        { paymentRef: { contains: term, mode: 'insensitive' } },
        { customerPhone: { contains: term } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { productName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderDto);
  }

  async getByPaymentRef(paymentRef: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        paymentRef: { equals: paymentRef, mode: 'insensitive' },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return toOrderDto(order);
  }

  async updateStatus(
    storeId: string,
    orderId: string,
    status: OrderStatus,
    userId?: string,
  ): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { store: { select: { businessName: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (status !== OrderStatus.cancelled && order.paymentStatus !== PaymentStatus.paid) {
      throw new BadRequestException('Order must be paid before fulfilment.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (userId) {
      await this.prisma.activityLog.create({
        data: {
          storeId,
          userId,
          action: 'order.status_updated',
          metadata: { orderId, from: order.status, to: status },
        },
      });
    }

    if (status === OrderStatus.delivered) {
      this.eventEmitter.emit(
        ORDER_DELIVERED_EVENT,
        new OrderDeliveredEvent(orderId),
      );
      this.eventEmitter.emit(
        REVIEW_INVITE_EVENT,
        new ReviewInviteEvent(
          orderId,
          order.customerPhone,
          order.paymentRef,
          order.store.businessName,
        ),
      );
    }

    if (order.status !== status) {
      this.eventEmitter.emit(
        ORDER_STATUS_UPDATED_EVENT,
        new OrderStatusUpdatedEvent(
          order.customerPhone,
          order.paymentRef,
          status,
          order.store.businessName,
        ),
      );
    }

    return toOrderDto(updated);
  }

  async bulkUpdateStatus(
    storeId: string,
    orderIds: string[],
    status: OrderStatus,
    userId?: string,
  ): Promise<OrderDto[]> {
    const results: OrderDto[] = [];
    for (const orderId of orderIds) {
      results.push(await this.updateStatus(storeId, orderId, status, userId));
    }
    return results;
  }

  async markTransferReference(
    paymentRef: string,
    transferReference: string,
  ): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef: { equals: paymentRef, mode: 'insensitive' } },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { transferReference: transferReference.trim() },
    });

    return toOrderDto(updated);
  }

  async markAllSeen(storeId: string): Promise<void> {
    await this.prisma.order.updateMany({
      where: { storeId, vendorSeenAt: null },
      data: { vendorSeenAt: new Date() },
    });
  }

  async getUnreadCount(storeId: string): Promise<number> {
    return this.prisma.order.count({
      where: { storeId, vendorSeenAt: null },
    });
  }

  async getCustomerOrderCount(
    storeId: string,
    customerPhone: string,
  ): Promise<number> {
    return this.prisma.order.count({
      where: {
        storeId,
        customerPhone: normalizePhone(customerPhone),
        paymentStatus: PaymentStatus.paid,
      },
    });
  }

  private async resolvePricing(dto: OrderCheckoutBaseDto) {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: dto.storeId },
      include: { vendor: true },
    });

    if (!store?.setupComplete) {
      throw new NotFoundException('Store not found.');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        storeId: dto.storeId,
        published: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const deliveryOptions = this.normalizeDeliveryOptions(product.deliveryOptions);
    if (!deliveryOptions.includes(dto.deliveryType)) {
      throw new BadRequestException('Selected delivery option is not available.');
    }

    if (deliveryRequiresAddress(dto.deliveryType) && !dto.deliveryAddress?.trim()) {
      throw new BadRequestException('Delivery address is required.');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Not enough stock for this order.');
    }

    const deliveryFee = this.resolveDeliveryFee(store.deliveryZones, dto.deliveryZoneId);
    const unitPrice = product.price;
    let subtotal = unitPrice * dto.quantity + deliveryFee;
    let discountAmount = 0;
    let discountCode: string | null = null;

    if (dto.discountCode?.trim()) {
      const discount = await this.prisma.discountCode.findFirst({
        where: {
          storeId: dto.storeId,
          code: dto.discountCode.trim().toUpperCase(),
          active: true,
        },
      });

      if (!discount) {
        throw new BadRequestException('Invalid discount code.');
      }

      if (discount.expiresAt && discount.expiresAt < new Date()) {
        throw new BadRequestException('Discount code has expired.');
      }

      if (discount.maxUses && discount.useCount >= discount.maxUses) {
        throw new BadRequestException('Discount code has reached its limit.');
      }

      if (discount.flashEndsAt && discount.flashEndsAt < new Date()) {
        throw new BadRequestException('Flash sale has ended.');
      }

      discountAmount =
        discount.type === 'percent'
          ? Math.floor((subtotal * discount.value) / 100)
          : discount.value;
      subtotal = Math.max(0, subtotal - discountAmount);
      discountCode = discount.code;

      return {
        unitPrice,
        deliveryFee,
        discountAmount,
        discountCode,
        totalPaid: subtotal,
        discountRecordId: discount.id,
      };
    }

    return {
      unitPrice,
      deliveryFee,
      discountAmount,
      discountCode,
      totalPaid: subtotal,
      discountRecordId: undefined,
    };
  }

  private async consumeDiscountCode(
    tx: Prisma.TransactionClient,
    discountRecordId: string,
  ): Promise<void> {
    const discount = await tx.discountCode.findUnique({
      where: { id: discountRecordId },
    });

    if (!discount?.active) {
      throw new BadRequestException('Invalid discount code.');
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('Discount code has expired.');
    }

    if (discount.flashEndsAt && discount.flashEndsAt < new Date()) {
      throw new BadRequestException('Flash sale has ended.');
    }

    if (discount.maxUses && discount.useCount >= discount.maxUses) {
      throw new BadRequestException('Discount code has reached its limit.');
    }

    await tx.discountCode.update({
      where: { id: discountRecordId },
      data: { useCount: { increment: 1 } },
    });
  }

  private resolveDeliveryFee(zonesJson: Prisma.JsonValue, zoneId?: string): number {
    if (!zoneId || !Array.isArray(zonesJson)) return 0;
    const zones = zonesJson as DeliveryZone[];
    const zone = zones.find((entry) => entry.id === zoneId);
    return zone?.fee ?? 0;
  }

  private async holdStock(
    tx: Prisma.TransactionClient,
    storeId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const product = await tx.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock for this order.');
    }
    await tx.product.update({
      where: { id: productId },
      data: { stock: product.stock - quantity },
    });
  }

  private normalizeDeliveryOptions(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return ['pickup'];
    }

    const options = value
      .filter((entry): entry is string => typeof entry === 'string')
      .filter((entry) =>
        DELIVERY_TYPE_IDS.includes(entry as (typeof DELIVERY_TYPE_IDS)[number]),
      );

    return options.length > 0 ? options : ['pickup'];
  }
}
