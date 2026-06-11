import { Injectable, Logger } from '@nestjs/common';
import { SendChampWebhookDto } from './dto/sendchamp-webhook.dto';

@Injectable()
export class SendChampWebhookService {
  private readonly logger = new Logger(SendChampWebhookService.name);

  handleDeliveryEvent(payload: SendChampWebhookDto): void {
    const service = payload.service ?? 'unknown';
    const status = payload.status ?? 'unknown';
    const recipient = payload.email ?? payload.phone_number ?? 'unknown';
    const reference =
      payload.reference ?? payload.email_uid ?? payload.sms_uid ?? 'n/a';

    const summary = `SendChamp ${service} ${status} → ${recipient} (ref: ${reference})`;

    if (this.isFailureStatus(status)) {
      this.logger.warn(summary);
      if (payload.message) {
        this.logger.warn(`SendChamp detail: ${payload.message}`);
      }
      return;
    }

    this.logger.log(summary);
  }

  private isFailureStatus(status: string): boolean {
    const normalized = status.toLowerCase();
    return (
      normalized.includes('fail') ||
      normalized.includes('bounce') ||
      normalized.includes('reject') ||
      normalized === 'undelivered'
    );
  }
}
