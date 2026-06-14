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

    const txRef = body.data?.reference;
    if (!txRef) {
      throw new BadRequestException('Missing transaction reference');
    }

    const alreadyProcessed = await this.paymentsService.markWebhookProcessed(txRef);
    if (alreadyProcessed) {
      return { received: true, note: 'Already processed' };
    }

    if (
      body.type === 'charge.completed' &&
      body.data?.status === 'succeeded' &&
      body.data?.reference
    ) {
      if (
        this.vendorSubscriptionService.isSubscriptionReference(body.data.reference)
      ) {
        await this.vendorSubscriptionService.activateFromPayment(
          body.data.reference,
          {
            amountKobo: body.data.amount,
            currency: body.data.currency,
          },
        );
      } else {
        await this.paymentsService.confirmPayment(body.data.reference, {
          amount: body.data.amount,
          currency: body.data.currency,
        });
      }
    }

    if (
      body.type === 'charge.failed' &&
      body.data?.reference &&
      this.vendorSubscriptionService.isSubscriptionReference(body.data.reference)
    ) {
      await this.vendorSubscriptionService.markPaymentFailed(body.data.reference);
    }

    if (
      (body.type === 'transfer.completed' ||
        body.type === 'settlement.completed') &&
      body.data?.reference
    ) {
      await this.paymentsService.markPayoutSettled(body.data.reference);
    }

    return { received: true };
  }
}
