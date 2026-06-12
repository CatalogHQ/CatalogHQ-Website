import {
  Body,
  Controller,
  Headers,
  Post,
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
    @Headers('verif-hash') verifHash: string,
    @Body() body: FlutterwaveWebhookDto,
  ) {
    if (this.flutterwaveService.isConfigured()) {
      if (!verifHash || !this.flutterwaveService.verifyWebhookHash(verifHash)) {
        throw new UnauthorizedException('Invalid Flutterwave webhook hash.');
      }
    }

    if (
      body.event === 'charge.completed' &&
      body.data?.status === 'successful' &&
      body.data?.tx_ref
    ) {
      await this.paymentsService.confirmPayment(body.data.tx_ref);
    }

    return { received: true };
  }
}
