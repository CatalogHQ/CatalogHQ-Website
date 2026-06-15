import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentStatus, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_CREATED_EVENT } from '../orders/events/order.events';
import { OrderCreatedEvent } from '../orders/events/order-created.event';
import { PAYOUT_SETTLED_EVENT } from './events/payout.events';
import { PayoutSettledEvent } from './events/payout-settled.event';
import { LowStockAlertService } from '../notifications/low-stock-alert.service';
import { flutterwaveAmountMatchesNaira } from './flutterwave-amount.util';
import { buildFlutterwaveReference } from './flutterwave-reference.util';
import { resolveFlutterwavePayoutReference } from './flutterwave-payout-reference.util';
import { buildFlutterwaveCheckoutEmail } from './flutterwave-payment-methods';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveTransferService } from './flutterwave-transfer.service';
import {
  isVendorPayoutAmountEligible,
  MIN_VENDOR_PAYOUT_NAIRA,
} from './vendor-payout.constants';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flutterwave: FlutterwaveService,
    private readonly transferService: FlutterwaveTransferService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly lowStockAlertService: LowStockAlertService,
  ) {}

  async claimWebhook(dedupeKey: string): Promise<boolean> {
    try {
      await this.prisma.processedWebhook.create({
        data: { txRef: dedupeKey },
      });
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async releaseWebhook(dedupeKey: string): Promise<void> {
    await this.prisma.processedWebhook.deleteMany({
      where: { txRef: dedupeKey },
    });
  }

  async isWebhookProcessed(dedupeKey: string): Promise<boolean> {
    const existing = await this.prisma.processedWebhook.findUnique({
      where: { txRef: dedupeKey },
    });
    return Boolean(existing);
  }

  async markWebhookProcessed(dedupeKey: string): Promise<void> {
    try {
      await this.prisma.processedWebhook.create({
        data: { txRef: dedupeKey },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  async confirmPayment(
    gatewayReference: string,
    webhookHint?: {
      amount?: number;
      currency?: string;
      paymentRef?: string;
      orderId?: string;
      chargeId?: string;
      fromWebhook?: boolean;
    },
  ): Promise<void> {
    const order = await this.findOrderForPaymentNotification(
      gatewayReference,
      webhookHint,
    );

    if (!order || order.paymentStatus === PaymentStatus.paid) {
      if (!order) {
        this.logger.warn(
          `No order found for Flutterwave payment reference ${gatewayReference}`,
        );
      }
      return;
    }

    const verifyReference =
      order.gatewayReference ?? buildFlutterwaveReference(order.paymentRef);

    if (
      webhookHint?.amount !== undefined &&
      !flutterwaveAmountMatchesNaira(order.totalPaid, webhookHint.amount)
    ) {
      this.logger.warn(
        `Payment amount mismatch for ${verifyReference}: expected ${order.totalPaid} NGN, got ${webhookHint.amount}`,
      );
      return;
    }

    if (
      webhookHint?.currency !== undefined &&
      webhookHint.currency !== 'NGN'
    ) {
      this.logger.warn(
        `Payment currency mismatch for ${verifyReference}: ${webhookHint.currency}`,
      );
      return;
    }

    const verified = await this.flutterwave.verifyTransaction(
      verifyReference,
      order.totalPaid,
      {
        chargeId: webhookHint?.chargeId,
        alternateReferences: [
          order.paymentRef,
          buildFlutterwaveReference(order.paymentRef),
          gatewayReference,
        ],
      },
    );

    if (!verified) {
      if (webhookHint?.fromWebhook) {
        this.logger.warn(
          `Flutterwave API verify inconclusive for ${verifyReference} (order ${order.paymentRef}); confirming from signed charge.completed webhook.`,
        );
      } else {
        this.logger.warn(
          `Flutterwave verify failed for ${verifyReference} (order ${order.paymentRef})`,
        );
        return;
      }
    }

    const confirmed = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: {
            in: [PaymentStatus.pending, PaymentStatus.failed],
          },
        },
        data: {
          paymentStatus: PaymentStatus.paid,
          status: OrderStatus.paid,
          reservedUntil: null,
        },
      });

      if (updated.count === 0) {
        return false;
      }

      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (!current?.stockHeldAt) {
        await this.decrementStock(
          tx,
          order.storeId,
          order.productId,
          order.quantity,
        );
        await tx.order.update({
          where: { id: order.id },
          data: { stockHeldAt: new Date() },
        });
      }

      return true;
    });

    if (!confirmed) {
      return;
    }

    await this.attemptVendorPayout(order.id);

    this.eventEmitter.emit(
      ORDER_CREATED_EVENT,
      new OrderCreatedEvent(order.id),
    );
  }

  private async findOrderForPaymentNotification(
    webhookReference: string,
    hints?: { paymentRef?: string; orderId?: string },
  ) {
    const ref = webhookReference.trim();

    const include = { store: { include: { vendor: true } } } as const;

    const byGateway = await this.prisma.order.findUnique({
      where: { gatewayReference: ref },
      include: include,
    });
    if (byGateway) {
      return byGateway;
    }

    if (ref.startsWith('SHP-')) {
      const byPaymentRef = await this.prisma.order.findUnique({
        where: { paymentRef: ref },
        include: include,
      });
      if (byPaymentRef) {
        return byPaymentRef;
      }
    }

    if (ref.startsWith('flw-')) {
      const paymentRef = ref.slice(4);
      const byFlwPaymentRef = await this.prisma.order.findFirst({
        where: {
          OR: [{ gatewayReference: ref }, { paymentRef }],
        },
        include: include,
      });
      if (byFlwPaymentRef) {
        return byFlwPaymentRef;
      }
    }

    const paymentRefHint = hints?.paymentRef?.trim();
    if (paymentRefHint) {
      const byHint = await this.prisma.order.findFirst({
        where: {
          OR: [
            { paymentRef: paymentRefHint },
            { gatewayReference: buildFlutterwaveReference(paymentRefHint) },
          ],
        },
        include: include,
      });
      if (byHint) {
        return byHint;
      }
    }

    const orderIdHint = hints?.orderId?.trim();
    if (orderIdHint) {
      return this.prisma.order.findUnique({
        where: { id: orderIdHint },
        include: include,
      });
    }

    return null;
  }

  async attemptVendorPayout(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order || order.paymentStatus !== PaymentStatus.paid) {
      return;
    }

    if (
      order.flutterwaveTransferId ||
      order.payoutStatus === PayoutStatus.processing ||
      order.payoutStatus === PayoutStatus.settled
    ) {
      return;
    }

    if (order.vendorNet <= 0) {
      return;
    }

    if (!isVendorPayoutAmountEligible(order.vendorNet)) {
      this.logger.warn(
        `Skipping vendor payout for order ${order.paymentRef}: amount ${order.vendorNet} NGN is below the ${MIN_VENDOR_PAYOUT_NAIRA} NGN minimum.`,
      );
      return;
    }

    const recipientId = order.store.flutterwaveTransferRecipientId;
    if (!order.store.payoutSetupComplete || !recipientId) {
      this.logger.warn(
        `Skipping vendor payout for order ${order.paymentRef}: payout bank not configured.`,
      );
      return;
    }

    if (this.transferService.isConfigured() && isMockTransferRecipient(recipientId)) {
      this.logger.warn(
        `Skipping vendor payout for order ${order.paymentRef}: vendor must re-link payout bank to create a live Flutterwave recipient.`,
      );
      return;
    }

    const payoutReference = resolveFlutterwavePayoutReference(order);

    try {
      const transfer = await this.transferService.initiateInstantTransfer({
        recipientId,
        amountNaira: order.vendorNet,
        reference: payoutReference,
        narration: `CatalogHQ order ${order.paymentRef}`,
        meta: {
          orderId: order.id,
          paymentRef: order.paymentRef,
          vendorId: order.storeId,
        },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          payoutStatus: PayoutStatus.processing,
          flutterwaveTransferId: transfer.transferId,
          flutterwavePayoutReference: transfer.reference,
        },
      });

      this.logger.log(
        `Vendor payout initiated for order ${order.paymentRef}: ${transfer.transferId}`,
      );
    } catch (error) {
      this.logger.error(
        `Vendor payout failed for order ${order.paymentRef}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          payoutStatus: PayoutStatus.failed,
          flutterwavePayoutReference: payoutReference,
        },
      });
    }
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

  async markPayoutSettled(payoutReference: string): Promise<void> {
    const order =
      (await this.prisma.order.findUnique({
        where: { flutterwavePayoutReference: payoutReference },
      })) ??
      (await this.prisma.order.findUnique({
        where: { gatewayReference: payoutReference },
      }));

    if (!order || order.payoutStatus === PayoutStatus.settled) {
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        payoutStatus: PayoutStatus.settled,
        payoutSettledAt: new Date(),
      },
    });

    this.eventEmitter.emit(
      PAYOUT_SETTLED_EVENT,
      new PayoutSettledEvent(order.id),
    );
  }

  async markPayoutFailed(payoutReference: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { flutterwavePayoutReference: payoutReference },
    });

    if (!order || order.payoutStatus === PayoutStatus.settled) {
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { payoutStatus: PayoutStatus.failed },
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
    const init = await this.flutterwave.initializeTransaction({
      email: buildFlutterwaveCheckoutEmail(order.customerPhone),
      phone: order.customerPhone,
      name: order.customerName,
      amountNaira: order.totalPaid,
      reference,
      callbackPath: `/s/${order.store.slug}/order/${order.paymentRef}?paid=1`,
      paymentMethod: 'bank_transfer',
      metadata: { paymentRef: order.paymentRef, orderId: order.id },
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

function isMockTransferRecipient(recipientId: string): boolean {
  return recipientId.startsWith('rcb_MOCK_');
}
