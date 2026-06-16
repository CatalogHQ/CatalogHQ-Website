import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentStatus, PayoutStatus, VendorPayoutMethod } from '@prisma/client';
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
import { FlutterwaveSubaccountService } from './flutterwave-subaccount.service';
import { FlutterwaveTransferService, PAYOUT_WALLET_FEE_BUFFER_NGN } from './flutterwave-transfer.service';
import {
  isVendorPayoutAmountEligible,
  MAX_VENDOR_PAYOUTS_PER_HOUR,
  MIN_VENDOR_PAYOUT_NAIRA,
} from './vendor-payout.constants';
import {
  FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV,
  isInstantVendorPayoutMode,
  parseVendorPayoutMode,
  VendorPayoutMode,
} from './vendor-payout-mode.util';
import { VendorPayoutRecordService } from './vendor-payout-record.service';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flutterwave: FlutterwaveService,
    private readonly subaccountService: FlutterwaveSubaccountService,
    private readonly transferService: FlutterwaveTransferService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly lowStockAlertService: LowStockAlertService,
    private readonly vendorPayoutRecords: VendorPayoutRecordService,
    private readonly securityAudit: SecurityAuditService,
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
      this.logger.error(
        `Payment amount mismatch for ${verifyReference}: expected ${order.totalPaid} NGN, got ${webhookHint.amount}`,
      );
      await this.securityAudit.log({
        action: SecurityAuditAction.PAYMENT_ORDER_AMOUNT_MISMATCH,
        targetType: 'order',
        targetId: order.id,
        metadata: {
          paymentRef: order.paymentRef,
          gatewayReference: verifyReference,
          expectedAmount: order.totalPaid,
          receivedAmount: webhookHint.amount,
          storeId: order.storeId,
          fromWebhook: webhookHint.fromWebhook ?? false,
        },
      });
      return;
    }

    if (
      webhookHint?.currency !== undefined &&
      webhookHint.currency !== 'NGN'
    ) {
      this.logger.error(
        `Payment currency mismatch for ${verifyReference}: ${webhookHint.currency}`,
      );
      await this.securityAudit.log({
        action: SecurityAuditAction.PAYMENT_ORDER_CURRENCY_MISMATCH,
        targetType: 'order',
        targetId: order.id,
        metadata: {
          paymentRef: order.paymentRef,
          gatewayReference: verifyReference,
          expectedCurrency: 'NGN',
          receivedCurrency: webhookHint.currency,
          storeId: order.storeId,
          fromWebhook: webhookHint.fromWebhook ?? false,
        },
      });
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

    const webhookOnlyConfirm = !verified && Boolean(webhookHint?.fromWebhook);

    if (!verified) {
      if (webhookHint?.fromWebhook) {
        if (!this.allowWebhookOnlyPaymentConfirm()) {
          this.logger.warn(
            `Flutterwave API verify failed for ${verifyReference} (order ${order.paymentRef}); deferring confirmation until API verify succeeds.`,
          );
          await this.securityAudit.log({
            action: SecurityAuditAction.PAYMENT_ORDER_VERIFY_DEFERRED,
            targetType: 'order',
            targetId: order.id,
            metadata: {
              paymentRef: order.paymentRef,
              gatewayReference: verifyReference,
              amount: order.totalPaid,
              storeId: order.storeId,
            },
          });
          throw new ServiceUnavailableException(
            'Payment verification pending Flutterwave API confirmation.',
          );
        }

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

    await this.securityAudit.log({
      action: webhookOnlyConfirm
        ? SecurityAuditAction.PAYMENT_ORDER_WEBHOOK_ONLY
        : SecurityAuditAction.PAYMENT_ORDER_CONFIRMED,
      targetType: 'order',
      targetId: order.id,
      metadata: {
        paymentRef: order.paymentRef,
        gatewayReference: verifyReference,
        amount: order.totalPaid,
        storeId: order.storeId,
        webhookOnly: webhookOnlyConfirm,
      },
    });

    const payoutMethod = this.resolvePayoutMethod(order.store.flutterwaveSubaccountId);
    await this.vendorPayoutRecords.ensureForPaidOrder(order.id, payoutMethod);

    if (
      !this.usesInstantVendorPayout() &&
      order.store.flutterwaveSubaccountId
    ) {
      await this.markSubaccountSplitPayout(order.id);
    } else {
      await this.attemptVendorPayout(order.id);
    }

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

  private resolvePayoutMethod(
    subaccountId: string | null | undefined,
  ): VendorPayoutMethod {
    if (!this.usesInstantVendorPayout() && subaccountId) {
      return VendorPayoutMethod.split;
    }
    return VendorPayoutMethod.instant_transfer;
  }

  shouldSplitVendorPayoutAtCheckout(): boolean {
    return !this.usesInstantVendorPayout();
  }

  usesInstantVendorPayout(): boolean {
    return isInstantVendorPayoutMode(this.vendorPayoutMode());
  }

  private vendorPayoutMode(): VendorPayoutMode {
    return parseVendorPayoutMode(
      this.configService.get<string>(FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV),
    );
  }

  async ensureVendorSubaccountForCheckout(storeId: string): Promise<string | null> {
    const store = await this.prisma.store.findUnique({
      where: { vendorId: storeId },
    });

    if (
      !store?.payoutSetupComplete ||
      !store.payoutBankCode ||
      !store.payoutAccountNumber
    ) {
      return null;
    }

    if (store.flutterwaveSubaccountId) {
      return store.flutterwaveSubaccountId;
    }

    const subaccountId =
      await this.subaccountService.createOrUpdateSubaccount(store);

    await this.prisma.store.update({
      where: { vendorId: storeId },
      data: { flutterwaveSubaccountId: subaccountId },
    });

    this.logger.log(
      `Created Flutterwave split subaccount for vendor ${storeId}: ${subaccountId}`,
    );

    return subaccountId;
  }

  private async markSubaccountSplitPayout(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.payoutStatus === PayoutStatus.settled) {
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        payoutStatus: PayoutStatus.split,
        payoutSettledAt: new Date(),
      },
    });

    await this.vendorPayoutRecords.recordSplitSettlement(orderId);

    this.eventEmitter.emit(
      PAYOUT_SETTLED_EVENT,
      new PayoutSettledEvent(orderId),
    );

    this.logger.log(
      `Vendor payout split recorded for order ${order.paymentRef}: Flutterwave will settle to vendor bank.`,
    );
  }

  async attemptVendorPayout(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order || order.paymentStatus !== PaymentStatus.paid) {
      return;
    }

    if (order.payoutStatus === PayoutStatus.settled) {
      return;
    }

    if (order.payoutStatus === PayoutStatus.split) {
      return;
    }

    if (
      order.store.flutterwaveSubaccountId &&
      !this.usesInstantVendorPayout()
    ) {
      return;
    }

    if (
      order.payoutStatus === PayoutStatus.processing &&
      order.flutterwaveTransferId
    ) {
      return;
    }

    if (
      order.flutterwaveTransferId &&
      order.payoutStatus !== PayoutStatus.failed
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

    const payoutReference = resolveFlutterwavePayoutReference({
      id: order.id,
      flutterwavePayoutReference: order.flutterwavePayoutReference,
      payoutStatus: order.payoutStatus,
    });

    if (this.transferService.isConfigured() && isMockTransferRecipient(recipientId)) {
      this.logger.warn(
        `Skipping vendor payout for order ${order.paymentRef}: vendor must re-link payout bank to create a live Flutterwave recipient.`,
      );
      return;
    }

    const requiredWalletBalance = order.vendorNet + PAYOUT_WALLET_FEE_BUFFER_NGN;
    const hourlyPayouts = await this.prisma.vendorPayout.count({
      where: {
        storeId: order.storeId,
        initiatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        status: { in: [PayoutStatus.processing, PayoutStatus.settled] },
      },
    });
    if (hourlyPayouts >= MAX_VENDOR_PAYOUTS_PER_HOUR) {
      this.logger.warn(
        `Deferring vendor payout for order ${order.paymentRef}: hourly payout limit reached for store ${order.storeId}.`,
      );
      await this.vendorPayoutRecords.recordTransferDeferred(
        order.id,
        `Hourly payout limit of ${MAX_VENDOR_PAYOUTS_PER_HOUR} transfers reached.`,
      );
      return;
    }

    const availableBalance = await this.transferService.getNgnAvailableBalance();
    if (
      availableBalance !== null &&
      availableBalance < requiredWalletBalance
    ) {
      this.logger.warn(
        `Deferring vendor payout for order ${order.paymentRef}: Flutterwave available balance ${availableBalance} NGN is below required ${requiredWalletBalance} NGN (payout ${order.vendorNet} + fee buffer).`,
      );
      await this.vendorPayoutRecords.recordTransferDeferred(
        order.id,
        `Insufficient Flutterwave payout balance (${availableBalance} NGN available, ${requiredWalletBalance} NGN required).`,
      );
      return;
    }

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

      await this.vendorPayoutRecords.recordTransferInitiated({
        orderId: order.id,
        transferId: transfer.transferId,
        reference: transfer.reference,
        recipientId,
      });

      this.eventEmitter.emit(
        PAYOUT_SETTLED_EVENT,
        new PayoutSettledEvent(order.id),
      );

      this.logger.log(
        `Vendor payout initiated for order ${order.paymentRef}: ${transfer.transferId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        `Vendor payout failed for order ${order.paymentRef}: ${message}`,
      );
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          payoutStatus: PayoutStatus.failed,
          flutterwaveTransferId: null,
          flutterwavePayoutReference: payoutReference,
        },
      });
      await this.vendorPayoutRecords.recordTransferFailed(
        order.id,
        payoutReference,
        message,
      );
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

    const alreadyNotified =
      order.payoutStatus === PayoutStatus.processing &&
      Boolean(order.flutterwaveTransferId);

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        payoutStatus: PayoutStatus.settled,
        payoutSettledAt: new Date(),
      },
    });

    await this.vendorPayoutRecords.recordSettledByReference(payoutReference);

    await this.securityAudit.log({
      action: SecurityAuditAction.PAYMENT_PAYOUT_SETTLED,
      targetType: 'order',
      targetId: order.id,
      metadata: { payoutReference },
    });

    if (!alreadyNotified) {
      this.eventEmitter.emit(
        PAYOUT_SETTLED_EVENT,
        new PayoutSettledEvent(order.id),
      );
    }
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
      data: {
        payoutStatus: PayoutStatus.failed,
        flutterwaveTransferId: null,
      },
    });

    await this.vendorPayoutRecords.recordFailedByReference(payoutReference);

    await this.securityAudit.log({
      action: SecurityAuditAction.PAYMENT_PAYOUT_FAILED,
      targetType: 'order',
      targetId: order.id,
      metadata: { payoutReference },
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

  private allowWebhookOnlyPaymentConfirm(): boolean {
    return (
      this.configService
        .get<string>('PAYMENT_ALLOW_WEBHOOK_ONLY_CONFIRM')
        ?.trim()
        .toLowerCase() === 'true'
    );
  }
}

function isMockTransferRecipient(recipientId: string): boolean {
  return recipientId.startsWith('rcb_MOCK_');
}
