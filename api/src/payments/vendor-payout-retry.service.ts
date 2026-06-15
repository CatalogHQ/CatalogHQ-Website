import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentStatus, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { MIN_VENDOR_PAYOUT_NAIRA } from './vendor-payout.constants';

const MAX_RETRY_ORDERS = 25;

@Injectable()
export class VendorPayoutRetryService {
  private readonly logger = new Logger(VendorPayoutRetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryPendingPayouts(): Promise<void> {
    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.paid,
        vendorNet: { gte: MIN_VENDOR_PAYOUT_NAIRA },
        flutterwaveTransferId: null,
        payoutStatus: { in: [PayoutStatus.pending, PayoutStatus.failed] },
        store: {
          payoutSetupComplete: true,
          flutterwaveTransferRecipientId: { not: null },
        },
      },
      select: { id: true, paymentRef: true },
      orderBy: { createdAt: 'asc' },
      take: MAX_RETRY_ORDERS,
    });

    if (orders.length === 0) {
      return;
    }

    this.logger.log(`Retrying vendor payout for ${orders.length} order(s).`);

    for (const order of orders) {
      try {
        await this.paymentsService.attemptVendorPayout(order.id);
      } catch (error) {
        this.logger.error(
          `Payout retry failed for order ${order.paymentRef}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
  }
}
