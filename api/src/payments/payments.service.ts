import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentStatus, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_CREATED_EVENT } from '../orders/events/order.events';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { LowStockAlertService } from '../notifications/low-stock-alert.service';
import { flutterwaveAmountMatchesNaira } from './flutterwave-amount.util';
import { buildFlutterwaveReference } from './flutterwave-reference.util';
import { buildCheckoutSplitPayload } from './flutterwave-split.util';
import { buildFlutterwaveCheckoutEmail } from './flutterwave-payment-methods';
import { FlutterwaveService } from './flutterwave.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flutterwave: FlutterwaveService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly lowStockAlertService: LowStockAlertService,
  ) {}

  async markWebhookProcessed(txRef: string): Promise<boolean> {
    try {
      await this.prisma.processedWebhook.create({
        data: { txRef },
      });
      return false;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return true;
      }
      throw error;
    }
  }

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
      !flutterwaveAmountMatchesNaira(order.totalPaid, webhookHint.amount)
    ) {
      this.logger.warn(
        `Payment amount mismatch for ${gatewayReference}: expected ${order.totalPaid} NGN, got ${webhookHint.amount}`,
      );
      return;
    }

    if (
      webhookHint?.currency !== undefined &&
      webhookHint.currency !== 'NGN'
    ) {
      this.logger.warn(
        `Payment currency mismatch for ${gatewayReference}: ${webhookHint.currency}`,
      );
      return;
    }

    const verified = await this.flutterwave.verifyTransaction(
      gatewayReference,
      order.totalPaid,
    );
    if (!verified) {
      this.logger.warn(
        `Flutterwave verify failed for ${gatewayReference} (order ${order.paymentRef})`,
      );
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
    const result = await tx.product.updateMany({
      where: {
        id: productId,
        storeId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
      },
    });

    if (result.count === 0) {
      const product = await tx.product.findFirst({
        where: { id: productId, storeId },
      });
      throw new ConflictException(
        `"${product?.name ?? productId}" is out of stock or has insufficient quantity`,
      );
    }

    const product = await tx.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) return;

    await this.lowStockAlertService.notifyIfNeeded(
      storeId,
      {
        name: product.name,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      },
      product.stock + quantity,
    );
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
          order.vendorNet,
        )
      : [];
    const init = await this.flutterwave.initializeTransaction({
      email: buildFlutterwaveCheckoutEmail(order.customerPhone),
      phone: order.customerPhone,
      name: order.customerName,
      amountNaira: order.totalPaid,
      reference,
      callbackPath: `/s/${order.store.slug}/order/${order.paymentRef}?paid=1`,
      paymentMethod: 'bank_transfer',
      metadata: { paymentRef: order.paymentRef, orderId: order.id },
      subaccounts,
    });

    if (init.paymentInstruction || init.virtualAccount) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { gatewayReference: init.reference },
      });
      const callbackBase = this.configService.get<string>(
        'FLUTTERWAVE_CALLBACK_BASE_URL',
        'http://localhost:3000',
      );
      return `${callbackBase.replace(/\/$/, '')}/s/${order.store.slug}/order/${order.paymentRef}`;
    }

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
