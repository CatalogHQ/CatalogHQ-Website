import { Body, Controller, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { SendChampWebhookDto } from './dto/sendchamp-webhook.dto';
import { SendChampWebhookService } from './sendchamp-webhook.service';

@Controller('webhooks')
export class SendChampWebhookController {
  constructor(
    private readonly sendChampWebhookService: SendChampWebhookService,
  ) {}

  /**
   * Live URL for SendChamp dashboard (APIs & Webhooks):
   * https://api.cataloghq.store/webhooks/sendchamp
   */
  @Public()
  @SkipThrottle()
  @Post('sendchamp')
  sendchampWebhook(@Body() body: SendChampWebhookDto) {
    this.sendChampWebhookService.handleDeliveryEvent(body);
    return { received: true };
  }
}
