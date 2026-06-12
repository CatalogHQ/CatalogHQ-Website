import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pingram } from 'pingram';

@Injectable()
export class PingramEmailService {
  private readonly logger = new Logger(PingramEmailService.name);
  private readonly client: Pingram | null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('PINGRAM_API_KEY');
    const baseUrl = this.configService.get<string>(
      'PINGRAM_BASE_URL',
      'https://api.pingram.io',
    );

    this.fromEmail = this.configService.get<string>(
      'PINGRAM_FROM_EMAIL',
      'noreply@cataloghq.store',
    );
    this.fromName = this.configService.get<string>(
      'PINGRAM_FROM_NAME',
      'CatalogHQ',
    );

    this.client = apiKey
      ? new Pingram({
          apiKey,
          baseUrl,
        })
      : null;
  }

  isConfigured(): boolean {
    return this.client !== null && Boolean(this.fromEmail);
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    _recipientName?: string,
    options?: { required?: boolean; type?: string },
  ): Promise<void> {
    const required = options?.required ?? false;
    const type = options?.type ?? 'verification_code';

    if (!this.client) {
      this.logger.warn('Pingram not configured; skipping email.');
      if (required) {
        throw new ServiceUnavailableException(
          'Email delivery is not configured. Contact support.',
        );
      }
      return;
    }

    try {
      await this.client.send({
        type,
        to: { email: to },
        email: {
          subject,
          html: htmlBody,
          senderName: this.fromName,
          senderEmail: this.fromEmail,
        },
      });

      this.logger.log(`Email sent via Pingram to ${to}`);
    } catch (error) {
      this.logger.error(`Pingram email failed for ${to}.`, error);
      if (required) {
        throw new ServiceUnavailableException(
          'Could not send verification email. Check your email address or try again later.',
        );
      }
    }
  }
}
