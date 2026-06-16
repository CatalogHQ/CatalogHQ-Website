import { BadRequestException, Body, Controller, Headers, HttpCode, Logger, Post, RawBodyRequest, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { VendorSubscriptionService } from '../subscriptions/vendor-subscription.service';
import { FlutterwaveWebhookDto } from './dto/flutterwave-webhook.dto';
import { FlutterwaveService } from './flutterwave.service';
import { getFlutterwaveWebhookRawBody } from './flutterwave-webhook-raw-body.util';
import {
  buildWebhookDedupeKey,
  isChargeCompletedEvent,
  isChargeFailedEvent,
  isFailedTransferStatus,
  isSuccessfulPaymentStatus,
  isSuccessfulTransferStatus,
  isTransferDisburseEvent,
  normalizeFlutterwaveWebhook,
  NormalizedFlutterwaveWebhook,
} from './flutterwave-webhook.util';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly vendorSubscriptionService: VendorSubscriptionService,
  ) {}

  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post('flutterwave/webhook')
  async flutterwaveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('flutterwave-signature') flutterwaveSignature: string | undefined,
    @Headers('verif-hash') verifHash: string | undefined,
    @Body() body: FlutterwaveWebhookDto,
  ) {
    const rawBody = getFlutterwaveWebhookRawBody(req);

    this.flutterwaveService.verifyWebhookSignature(rawBody, {
      flutterwaveSignature,
      verifHash,
    });

    const normalized = normalizeFlutterwaveWebhook(body as Parameters<typeof normalizeFlutterwaveWebhook>[0]);
    if (!normalized) {
      throw new BadRequestException('Missing transaction reference');
    }

    const dedupeKey = buildWebhookDedupeKey(normalized, body.id);

    const claimed = await this.paymentsService.claimWebhook(dedupeKey);
    if (!claimed) {
      return { received: true, note: 'Already processed' };
    }

    try {
      await this.processFlutterwaveWebhook(normalized, dedupeKey);
    } catch (error) {
      this.logger.error(
        `Flutterwave webhook processing failed for ${dedupeKey}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      await this.paymentsService.releaseWebhook(dedupeKey);
      throw error;
    }

    return { received: true };
  }

  private async processFlutterwaveWebhook(
    normalized: NormalizedFlutterwaveWebhook,
    dedupeKey: string,
  ): Promise<void> {
    const { eventType, reference, status, amount, currency } = normalized;

    if (
      isChargeCompletedEvent(eventType) &&
      isSuccessfulPaymentStatus(status)
    ) {
      if (this.vendorSubscriptionService.isSubscriptionReference(reference)) {
        await this.vendorSubscriptionService.activateFromPayment(reference, {
          amountKobo: amount,
          currency,
        });
      } else {
        await this.paymentsService.confirmPayment(reference, {
          amount,
          currency,
          paymentRef: normalized.paymentRefHint,
          orderId: normalized.orderIdHint,
          chargeId: normalized.chargeId,
          fromWebhook: true,
        });
      }
    }

    if (
      isChargeFailedEvent(eventType) &&
      this.vendorSubscriptionService.isSubscriptionReference(reference)
    ) {
      await this.vendorSubscriptionService.markPaymentFailed(reference);
    }

    if (isTransferDisburseEvent(eventType)) {
      if (isSuccessfulTransferStatus(status)) {
        await this.paymentsService.markPayoutSettled(reference);
      } else if (isFailedTransferStatus(status)) {
        await this.paymentsService.markPayoutFailed(reference);
      }
    }

    if (
      (eventType === 'transfer.completed' ||
        eventType === 'settlement.completed') &&
      reference
    ) {
      await this.paymentsService.markPayoutSettled(reference);
    }
  }
}
