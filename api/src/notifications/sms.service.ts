import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS delivery is disabled while SendChamp is removed. Order and ticket SMS
 * notifications are skipped until a provider (e.g. AWS SNS) is configured.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  isConfigured(): boolean {
    return false;
  }

  async sendSms(to: string, message: string): Promise<void> {
    this.logger.warn(
      `SMS not configured; skipping message to ${to}: ${message.slice(0, 80)}...`,
    );
  }
}
