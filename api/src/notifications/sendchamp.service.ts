import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendChampResponse = {
  status?: string;
  message?: string;
  data?: unknown;
};

@Injectable()
export class SendChampService {
  private readonly logger = new Logger(SendChampService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly smsSender: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDCHAMP_API_KEY');
    const mode = this.configService.get<string>('SENDCHAMP_MODE', 'test');
    this.baseUrl =
      mode === 'live'
        ? 'https://api.sendchamp.com/api/v1'
        : 'https://sandbox-api.sendchamp.com/api/v1';
    this.smsSender = this.configService.get<string>(
      'SENDCHAMP_SMS_SENDER',
      'CatalogHQ',
    );
    this.fromEmail = this.configService.get<string>(
      'SENDCHAMP_FROM_EMAIL',
      'support@cataloghq.store',
    );
    this.fromName = this.configService.get<string>(
      'SENDCHAMP_FROM_NAME',
      'CatalogHQ',
    );
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('SendChamp not configured; skipping SMS.');
      return;
    }

    const response = await fetch(`${this.baseUrl}/sms/send`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        to: [to],
        message,
        route: 'non_dnd',
        sender_name: this.smsSender,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`SendChamp SMS failed (${response.status}): ${body}`);
      return;
    }

    const payload = (await response.json()) as SendChampResponse;
    this.logger.log(`SMS sent via SendChamp: ${payload.message ?? 'ok'}`);
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    recipientName?: string,
  ): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('SendChamp not configured; skipping email.');
      return;
    }

    const response = await fetch(`${this.baseUrl}/email/send`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        subject,
        to: [{ email: to, name: recipientName ?? to }],
        from: { email: this.fromEmail, name: this.fromName },
        message_body: { type: 'text/html', value: htmlBody },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`SendChamp email failed (${response.status}): ${body}`);
      return;
    }

    const payload = (await response.json()) as SendChampResponse;
    this.logger.log(`Email sent via SendChamp: ${payload.message ?? 'ok'}`);
  }
}
