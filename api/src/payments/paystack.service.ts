import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
  };
};

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string | undefined;
  private readonly publicKey: string | undefined;
  private readonly callbackBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY');
    this.callbackBaseUrl = this.configService.get<string>(
      'PAYSTACK_CALLBACK_BASE_URL',
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
    amountKobo: number;
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

    const callbackUrl = `${this.callbackBaseUrl.replace(/\/$/, '')}${params.callbackPath}`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        callback_url: callbackUrl,
        metadata: params.metadata,
      }),
    });

    const payload = (await response.json()) as PaystackInitResponse;
    if (!response.ok || !payload.data?.authorization_url) {
      this.logger.error(`Paystack init failed: ${payload.message}`);
      throw new InternalServerErrorException('Could not start payment.');
    }

    return {
      authorizationUrl: payload.data.authorization_url,
      reference: payload.data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<boolean> {
    if (!this.secretKey) {
      return true;
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      },
    );

    const payload = (await response.json()) as PaystackVerifyResponse;
    return (
      response.ok &&
      payload.status === true &&
      payload.data?.status === 'success'
    );
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.secretKey) return false;
    const hash = createHmac('sha512', this.secretKey).update(payload).digest('hex');
    return hash === signature;
  }
}
