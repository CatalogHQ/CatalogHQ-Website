import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { VendorSubscriptionService } from '../subscriptions/vendor-subscription.service';
import { FlutterwaveWebhookDto } from './dto/flutterwave-webhook.dto';
import { FlutterwaveService } from './flutterwave.service';
import {
  buildWebhookDedupeKey,
  isChargeCompletedEvent,
  isChargeFailedEvent,
  isFailedTransferStatus,
  isSuccessfulPaymentStatus,
  isSuccessfulTransferStatus,
  isTransferDisburseEvent,
  normalizeFlutterwaveWebhook,
} from './flutterwave-webhook.util';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly vendorSubscriptionService: VendorSubscriptionService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('flutterwave/webhook')
  async flutterwaveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('flutterwave-signature') signature: string,
    @Body() body: FlutterwaveWebhookDto,
  ) {
    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : JSON.stringify(body);

    this.flutterwaveService.verifyWebhookSignature(rawBody, signature);

    const normalized = normalizeFlutterwaveWebhook(body);
    if (!normalized) {
      throw new BadRequestException('Missing transaction reference');
    }

    const { eventType, reference, status, amount, currency } = normalized;
    const dedupeKey = buildWebhookDedupeKey(normalized);

    const alreadyProcessed =
      await this.paymentsService.markWebhookProcessed(dedupeKey);
    if (alreadyProcessed) {
      return { received: true, note: 'Already processed' };
    }

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

    return { received: true };
  }
}
