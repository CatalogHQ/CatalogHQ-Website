import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type NinVerificationData = {
  nin: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
};

export type NinVerificationResult =
  | { status: 'verified'; data: NinVerificationData }
  | { status: 'not_found'; message: string }
  | { status: 'invalid'; message: string }
  | { status: 'rate_limited'; message: string }
  | { status: 'payment_required'; message: string }
  | { status: 'unavailable'; message: string };

type AshlabSuccessResponse = {
  success: true;
  data: NinVerificationData & { photo?: string };
};

type AshlabErrorResponse = {
  success?: false;
  message?: string;
  error?: string;
};

@Injectable()
export class AshlabNinVerificationService {
  private readonly logger = new Logger(AshlabNinVerificationService.name);
  private readonly apiKey: string | undefined;
  private readonly verifyUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('ASHLAB_VERIFY_API_KEY') ??
      this.configService.get<string>('ASHLAB_VERIFY_BEARER_TOKEN');

    const baseUrl = (
      this.configService.get<string>('ASHLAB_VERIFY_BASE_URL') ??
      'https://verify.ashlabtech.ng/v1'
    ).replace(/\/$/, '');
    const path =
      this.configService.get<string>('ASHLAB_VERIFY_PATH') ?? '/nin/verify';
    this.verifyUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async verify(nin: string): Promise<NinVerificationResult> {
    if (!this.apiKey) {
      this.logger.warn('Ashlab NIN verification not configured; skipping.');
      return {
        status: 'unavailable',
        message: 'NIN verification is not configured.',
      };
    }

    const normalized = nin.replace(/\D/g, '');
    if (!/^\d{11}$/.test(normalized)) {
      return {
        status: 'invalid',
        message: 'NIN must be exactly 11 digits.',
      };
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          nin: normalized,
          consent: true,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as
        | AshlabSuccessResponse
        | AshlabErrorResponse;

      if (response.ok && 'success' in body && body.success === true) {
        const { photo: _photo, ...data } = body.data;
        return { status: 'verified', data };
      }

      const message =
        ('message' in body && body.message) ||
        ('error' in body && body.error) ||
        'NIN could not be verified.';

      switch (response.status) {
        case 400:
          return { status: 'invalid', message };
        case 404:
          return {
            status: 'not_found',
            message: 'No identity record was found for this NIN.',
          };
        case 402:
          return {
            status: 'payment_required',
            message: 'NIN verification is temporarily unavailable.',
          };
        case 429:
          return {
            status: 'rate_limited',
            message: 'Too many verification attempts. Try again later.',
          };
        default:
          this.logger.error(
            `Ashlab NIN verification failed (${response.status}): ${message}`,
          );
          return {
            status: 'unavailable',
            message: 'NIN verification is temporarily unavailable.',
          };
      }
    } catch (error) {
      this.logger.error('Ashlab NIN verification request failed.', error);
      return {
        status: 'unavailable',
        message: 'NIN verification is temporarily unavailable.',
      };
    }
  }
}
