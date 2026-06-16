import { Injectable } from '@nestjs/common';
import {
  Order,
  PaymentStatus,
  PayoutStatus,
  Store,
  VendorPayoutMethod,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OrderWithStore = Order & { store: Store };

type BankSnapshot = {
  bankCode: string | null;
  bankName: string | null;
  accountNumberLast4: string | null;
  accountName: string | null;
  flutterwaveRecipientId: string | null;
};

@Injectable()
export class VendorPayoutRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureForPaidOrder(
    orderId: string,
    method: VendorPayoutMethod,
  ): Promise<void> {
    const order = await this.loadPaidOrder(orderId);
    if (!order || order.vendorNet <= 0) {
      return;
    }

    await this.prisma.vendorPayout.upsert({
      where: { orderId: order.id },
      create: this.buildCreatePayload(order, method),
      update: {},
    });
  }

  async recordSplitSettlement(orderId: string): Promise<void> {
    const order = await this.loadPaidOrder(orderId);
    if (!order || order.vendorNet <= 0) {
      return;
    }

    const settledAt = new Date();
    const bank = bankSnapshot(order.store);

    await this.prisma.vendorPayout.upsert({
      where: { orderId: order.id },
      create: {
        ...this.buildCreatePayload(order, VendorPayoutMethod.split),
        status: PayoutStatus.split,
        settledAt,
        initiatedAt: settledAt,
        ...bank,
      },
      update: {
        method: VendorPayoutMethod.split,
        status: PayoutStatus.split,
        settledAt,
        initiatedAt: settledAt,
        failureReason: null,
        failedAt: null,
        ...bank,
      },
    });
  }

  async recordTransferDeferred(
    orderId: string,
    reason: string,
  ): Promise<void> {
    const order = await this.loadPaidOrder(orderId);
    if (!order || order.vendorNet <= 0) {
      return;
    }

    await this.prisma.vendorPayout.upsert({
      where: { orderId: order.id },
      create: {
        ...this.buildCreatePayload(order, VendorPayoutMethod.instant_transfer),
        status: PayoutStatus.pending,
        failureReason: reason,
      },
      update: {
        method: VendorPayoutMethod.instant_transfer,
        status: PayoutStatus.pending,
        failureReason: reason,
        flutterwaveTransferId: null,
        initiatedAt: null,
        failedAt: null,
      },
    });
  }

  async recordTransferInitiated(input: {
    orderId: string;
    transferId: string;
    reference: string;
    recipientId: string;
  }): Promise<void> {
    const order = await this.loadPaidOrder(input.orderId);
    if (!order || order.vendorNet <= 0) {
      return;
    }

    const initiatedAt = new Date();
    const bank = bankSnapshot(order.store);
    const attemptCount =
      ((
        await this.prisma.vendorPayout.findUnique({
          where: { orderId: order.id },
          select: { attemptCount: true },
        })
      )?.attemptCount ?? 0) + 1;

    await this.prisma.vendorPayout.upsert({
      where: { orderId: order.id },
      create: {
        ...this.buildCreatePayload(order, VendorPayoutMethod.instant_transfer),
        status: PayoutStatus.processing,
        flutterwaveTransferId: input.transferId,
        flutterwaveReference: input.reference,
        attemptCount,
        initiatedAt,
        settledAt: null,
        failedAt: null,
        failureReason: null,
        ...bank,
        flutterwaveRecipientId: input.recipientId,
      },
      update: {
        method: VendorPayoutMethod.instant_transfer,
        status: PayoutStatus.processing,
        flutterwaveTransferId: input.transferId,
        flutterwaveReference: input.reference,
        attemptCount,
        initiatedAt,
        settledAt: null,
        failedAt: null,
        failureReason: null,
        ...bank,
        flutterwaveRecipientId: input.recipientId,
      },
    });
  }

  async recordTransferFailed(
    orderId: string,
    reference: string,
    reason: string,
  ): Promise<void> {
    const order = await this.loadPaidOrder(orderId);
    if (!order || order.vendorNet <= 0) {
      return;
    }

    const failedAt = new Date();

    await this.prisma.vendorPayout.upsert({
      where: { orderId: order.id },
      create: {
        ...this.buildCreatePayload(order, VendorPayoutMethod.instant_transfer),
        status: PayoutStatus.failed,
        flutterwaveReference: reference,
        failureReason: reason,
        failedAt,
        attemptCount: 1,
      },
      update: {
        method: VendorPayoutMethod.instant_transfer,
        status: PayoutStatus.failed,
        flutterwaveReference: reference,
        flutterwaveTransferId: null,
        failureReason: reason,
        failedAt,
      },
    });
  }

  async recordSettledByReference(reference: string): Promise<void> {
    const payout = await this.findByFlutterwaveReference(reference);
    if (!payout || payout.status === PayoutStatus.settled) {
      return;
    }

    const settledAt = new Date();
    await this.prisma.vendorPayout.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.settled,
        settledAt,
        failedAt: null,
        failureReason: null,
      },
    });
  }

  async recordFailedByReference(reference: string): Promise<void> {
    const payout = await this.findByFlutterwaveReference(reference);
    if (!payout || payout.status === PayoutStatus.settled) {
      return;
    }

    await this.prisma.vendorPayout.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.failed,
        flutterwaveTransferId: null,
        failedAt: new Date(),
      },
    });
  }

  async markAllSeen(storeId: string): Promise<void> {
    await this.prisma.vendorPayout.updateMany({
      where: {
        storeId,
        status: PayoutStatus.settled,
        vendorSeenAt: null,
      },
      data: { vendorSeenAt: new Date() },
    });
  }

  async countUnreadSettled(storeId: string): Promise<number> {
    return this.prisma.vendorPayout.count({
      where: {
        storeId,
        status: PayoutStatus.settled,
        vendorSeenAt: null,
      },
    });
  }

  private async loadPaidOrder(orderId: string): Promise<OrderWithStore | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order || order.paymentStatus !== PaymentStatus.paid) {
      return null;
    }

    return order;
  }

  private async findByFlutterwaveReference(reference: string) {
    return (
      (await this.prisma.vendorPayout.findUnique({
        where: { flutterwaveReference: reference },
      })) ??
      (await this.findByOrderGatewayReference(reference))
    );
  }

  private async findByOrderGatewayReference(reference: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { flutterwavePayoutReference: reference },
          { gatewayReference: reference },
        ],
      },
      select: { id: true },
    });

    if (!order) {
      return null;
    }

    return this.prisma.vendorPayout.findUnique({
      where: { orderId: order.id },
    });
  }

  private buildCreatePayload(order: OrderWithStore, method: VendorPayoutMethod) {
    return {
      orderId: order.id,
      storeId: order.storeId,
      amountNaira: order.vendorNet,
      platformFeeNaira: order.platformFee,
      method,
      status: PayoutStatus.pending,
      ...bankSnapshot(order.store),
    };
  }
}

function bankSnapshot(store: Store): BankSnapshot {
  const accountNumber = store.payoutAccountNumber?.trim();
  return {
    bankCode: store.payoutBankCode,
    bankName: store.payoutBankName,
    accountNumberLast4: accountNumber ? accountNumber.slice(-4) : null,
    accountName: store.payoutAccountName,
    flutterwaveRecipientId: store.flutterwaveTransferRecipientId,
  };
}
