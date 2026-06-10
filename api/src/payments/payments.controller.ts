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
import { PaystackWebhookDto } from './dto/paystack-webhook.dto';
import { PaystackService } from './paystack.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('paystack/webhook')
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: PaystackWebhookDto,
  ) {
    const rawBody =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : JSON.stringify(body);

    if (this.paystackService.isConfigured()) {
      if (!signature || !this.paystackService.verifyWebhookSignature(rawBody, signature)) {
        throw new UnauthorizedException('Invalid Paystack webhook signature.');
      }
    }

    if (body.event === 'charge.success' && body.data?.reference) {
      await this.paymentsService.confirmPayment(body.data.reference);
    }

    return { received: true };
  }
}
