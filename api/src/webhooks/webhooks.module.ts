import { Module } from '@nestjs/common';
import { SendChampWebhookController } from './sendchamp-webhook.controller';
import { SendChampWebhookService } from './sendchamp-webhook.service';

@Module({
  controllers: [SendChampWebhookController],
  providers: [SendChampWebhookService],
})
export class WebhooksModule {}
