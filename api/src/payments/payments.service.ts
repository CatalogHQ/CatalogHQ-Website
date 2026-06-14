import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentStatus, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_CREATED_EVENT, LOW_STOCK_EVENT } from '../orders/events/order.events';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { LowStockEvent } from '../orders/events/low-stock.event';
import { buildFlutterwaveReference } from './flutterwave-reference.util';
import { buildCheckoutSplitPayload } from './flutterwave-split.util';
import { FlutterwaveService } from './flutterwave.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flutterwave: FlutterwaveService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async confirmPayment(
    gatewayReference: string,
    webhookHint?: { amount?: number; currency?: string },
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { gatewayReference },
      include: { store: { include: { vendor: true } } },
    });

    if (!order || order.paymentStatus === PaymentStatus.paid) {
      return;
    }

    if (
      webhookHint?.amount !== undefined &&
      webhookHint.amount !== order.totalPaid
    ) {
      return;
    }

    if (
      webhookHint?.currency !== undefined &&
      webhookHint.currency !== 'NGN'
    ) {
      return;
    }

    const verified = await this.flutterwave.verifyTransaction(
      gatewayReference,
      order.totalPaid,
    );
    if (!verified) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.failed },
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.paid,
          status: OrderStatus.paid,
          reservedUntil: null,
          payoutStatus:
            order.store.payoutSetupComplete && order.vendorNet > 0
              ? PayoutStatus.split
              : order.payoutStatus,
        },
      });

      await this.decrementStock(tx, order.storeId, order.productId, order.quantity);
    });

    this.eventEmitter.emit(
      ORDER_CREATED_EVENT,
      new OrderCreatedEvent(order.id),
    );
  }

  private async decrementStock(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    storeId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const product = await tx.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) return;

    const newStock = Math.max(0, product.stock - quantity);
    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    if (newStock <= product.lowStockThreshold) {
      const store = await tx.store.findUnique({
        where: { vendorId: storeId },
      });
      if (store?.whatsapp) {
        this.eventEmitter.emit(
          LOW_STOCK_EVENT,
          new LowStockEvent(store.whatsapp, product.name, newStock),
        );
      }
    }
  }

  async markPayoutSettled(gatewayReference: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { gatewayReference },
    });

    if (!order || order.payoutStatus === PayoutStatus.settled) {
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { payoutStatus: PayoutStatus.settled },
    });
  }

  async getPaymentLink(orderId: string, vendorId: string): Promise<string> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: vendorId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const reference =
      order.gatewayReference ?? buildFlutterwaveReference(order.paymentRef);
    const subaccounts = order.store.flutterwaveSubaccountId
      ? buildCheckoutSplitPayload(
          order.store.flutterwaveSubaccountId,
          order.platformFee,
        )
      : [];
    const init = await this.flutterwave.initializeTransaction({
      email: `${order.customerPhone}@cataloghq.ng`,
      phone: order.customerPhone,
      name: order.customerName,
      amountNaira: order.totalPaid,
      reference,
      callbackPath: `/s/${order.store.slug}/order/${order.paymentRef}?paid=1`,
      paymentMethod: 'opay',
      metadata: { paymentRef: order.paymentRef, orderId: order.id },
      subaccounts,
    });

    if (init.authorizationUrl) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { gatewayReference: init.reference },
      });
      return init.authorizationUrl;
    }

    const callbackBase = this.configService.get<string>(
      'FLUTTERWAVE_CALLBACK_BASE_URL',
      'http://localhost:3000',
    );
    return `${callbackBase.replace(/\/$/, '')}/s/${order.store.slug}/order/${order.paymentRef}`;
  }

  async getPaymentLinkResponse(orderId: string, vendorId: string) {
    const authorizationUrl = await this.getPaymentLink(orderId, vendorId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: vendorId },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return {
      authorizationUrl,
      reference:
        order.gatewayReference ?? buildFlutterwaveReference(order.paymentRef),
    };
  }
}
