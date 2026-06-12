import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type FlutterwaveInitResponse = {
  status: string;
  message: string;
  data?: {
    link: string;
  };
};

type FlutterwaveVerifyResponse = {
  status: string;
  message: string;
  data?: {
    status: string;
    tx_ref: string;
    amount: number;
  };
};

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly secretKey: string | undefined;
  private readonly publicKey: string | undefined;
  private readonly webhookSecret: string | undefined;
  private readonly callbackBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    this.publicKey = this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY');
    this.webhookSecret = this.configService.get<string>(
      'FLUTTERWAVE_WEBHOOK_SECRET',
    );
    this.callbackBaseUrl = this.configService.get<string>(
      'FLUTTERWAVE_CALLBACK_BASE_URL',
      'http://localhost:3000',
    );
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  getPublicKey(): string | undefined {
    return this.publicKey;
  }

  async initializeTransaction(params: {
    email: string;
    phone: string;
    name: string;
    amountNaira: number;
    reference: string;
    callbackPath: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ authorizationUrl: string; reference: string }> {
    if (!this.secretKey) {
      return {
        authorizationUrl: '',
        reference: params.reference,
      };
    }

    const redirectUrl = `${this.callbackBaseUrl.replace(/\/$/, '')}${params.callbackPath}`;

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: params.reference,
        amount: String(params.amountNaira),
        currency: 'NGN',
        redirect_url: redirectUrl,
        customer: {
          email: params.email,
          phonenumber: params.phone,
          name: params.name,
        },
        customizations: {
          title: 'CatalogHQ',
          description: 'Order payment',
        },
        meta: params.metadata,
      }),
    });

    const payload = (await response.json()) as FlutterwaveInitResponse;
    if (!response.ok || !payload.data?.link) {
      this.logger.error(`Flutterwave init failed: ${payload.message}`);
      throw new InternalServerErrorException('Could not start payment.');
    }

    return {
      authorizationUrl: payload.data.link,
      reference: params.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<boolean> {
    if (!this.secretKey) {
      return true;
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      },
    );

    const payload = (await response.json()) as FlutterwaveVerifyResponse;
    return (
      response.ok &&
      payload.status === 'success' &&
      payload.data?.status === 'successful'
    );
  }

  verifyWebhookHash(hash: string): boolean {
    if (!this.webhookSecret) return false;
    return hash === this.webhookSecret;
  }
}
