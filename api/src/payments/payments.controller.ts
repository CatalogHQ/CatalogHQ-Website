import {
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { FlutterwaveWebhookDto } from './dto/flutterwave-webhook.dto';
import { FlutterwaveService } from './flutterwave.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly flutterwaveService: FlutterwaveService,
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

    if (this.flutterwaveService.isConfigured()) {
      if (
        !signature ||
        !this.flutterwaveService.verifyWebhookSignature(rawBody, signature)
      ) {
        throw new UnauthorizedException('Invalid Flutterwave webhook signature.');
      }
    }

    if (
      body.type === 'charge.completed' &&
      body.data?.status === 'succeeded' &&
      body.data?.reference
    ) {
      await this.paymentsService.confirmPayment(body.data.reference, {
        amount: body.data.amount,
        currency: body.data.currency,
      });
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
