import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseAshlabNinVerificationData } from './ashlab-nin-response.parser';
import {
  describeAshlabAuthMode,
  isNinVerifyDebugEnabled,
  maskNin,
  sanitizeAshlabResponseBody,
} from './nin-verify-debug.util';

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

type AshlabErrorResponse = {
  success?: false;
  message?: string;
  error?: string;
};

export const ASHLAB_VERIFY_DEFAULT_BASE_URL =
  'https://verify.ashlabtech.ng/api/v1';
export const ASHLAB_VERIFY_DEFAULT_PATH = '/verify/nin';

const ASHLAB_ROUTE_NOT_FOUND_MESSAGE =
  'NIN verification endpoint is misconfigured. Check ASHLAB_VERIFY_BASE_URL and ASHLAB_VERIFY_PATH.';

function isAshlabRouteNotFoundMessage(message: string): boolean {
  return /route .+ could not be found/i.test(message);
}

@Injectable()
export class AshlabNinVerificationService {
  private readonly logger = new Logger(AshlabNinVerificationService.name);
  private readonly apiKey: string | undefined;
  private readonly verifyUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.resolveBearerCredential();

    const baseUrl = (
      this.configService.get<string>('ASHLAB_VERIFY_BASE_URL') ??
      ASHLAB_VERIFY_DEFAULT_BASE_URL
    ).replace(/\/$/, '');
    const path =
      this.configService.get<string>('ASHLAB_VERIFY_PATH') ??
      ASHLAB_VERIFY_DEFAULT_PATH;
    this.verifyUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private resolveBearerCredential(): string | undefined {
    const bearerToken = this.configService.get<string>(
      'ASHLAB_VERIFY_BEARER_TOKEN',
    );
    if (bearerToken?.trim()) {
      return bearerToken.trim();
    }

    const apiKey = this.configService.get<string>('ASHLAB_VERIFY_API_KEY');
    const apiSecret = this.configService.get<string>('ASHLAB_VERIFY_API_SECRET');

    if (apiKey?.trim() && apiSecret?.trim()) {
      return `${apiKey.trim()}:${apiSecret.trim()}`;
    }

    if (apiKey?.trim()) {
      return apiKey.trim();
    }

    return undefined;
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

    const requestBody = { nin: normalized, consent: true };

    if (isNinVerifyDebugEnabled(this.configService)) {
      this.logger.log(
        `[NIN debug] Request → POST ${this.verifyUrl} | auth=${describeAshlabAuthMode(this.configService)} | nin=${maskNin(normalized)} | body=${JSON.stringify(requestBody)}`,
      );
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const body = (await response.json().catch(() => ({}))) as
        | Record<string, unknown>
        | AshlabErrorResponse;

      if (isNinVerifyDebugEnabled(this.configService)) {
        this.logger.log(
          `[NIN debug] Response ← HTTP ${response.status} ${response.statusText} | body=${JSON.stringify(sanitizeAshlabResponseBody(body))}`,
        );
      }

      const verifiedData = parseAshlabNinVerificationData(body, normalized);

      if (response.ok && verifiedData) {
        if (isNinVerifyDebugEnabled(this.configService)) {
          this.logger.log(
            `[NIN debug] Ashlab success | first_name="${verifiedData.first_name}" last_name="${verifiedData.last_name}"`,
          );
        }
        return { status: 'verified', data: verifiedData };
      }

      if (
        response.ok &&
        typeof body === 'object' &&
        body !== null &&
        body.success === true
      ) {
        this.logger.error(
          'Ashlab returned success but the NIN identity payload could not be parsed.',
        );
        return {
          status: 'unavailable',
          message: 'NIN verification is temporarily unavailable.',
        };
      }

      const message =
        (typeof body === 'object' &&
          body !== null &&
          'message' in body &&
          typeof body.message === 'string' &&
          body.message) ||
        (typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof body.error === 'string' &&
          body.error) ||
        'NIN could not be verified.';

      if (isNinVerifyDebugEnabled(this.configService)) {
        this.logger.warn(
          `[NIN debug] Ashlab non-success | http=${response.status} | mappedMessage="${message}"`,
        );
      }

      switch (response.status) {
        case 400:
          return { status: 'invalid', message };
        case 404:
          if (isAshlabRouteNotFoundMessage(message)) {
            this.logger.error(
              `Ashlab NIN route not found at ${this.verifyUrl}: ${message}`,
            );
            return {
              status: 'unavailable',
              message: ASHLAB_ROUTE_NOT_FOUND_MESSAGE,
            };
          }

          return {
            status: 'not_found',
            message:
              message || 'No identity record was found for this NIN.',
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
