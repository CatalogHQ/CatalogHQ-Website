import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import {
  newFlutterwaveTraceId,
  resolveFlutterwaveBaseUrl,
} from './flutterwave.config';
import { flutterwaveIdempotencyKey } from './flutterwave-idempotency.util';
import {
  buildFlutterwavePaymentMethod,
  FlutterwavePaymentMethod,
  normalizeNigerianPhoneForFlutterwave,
  splitCustomerName,
} from './flutterwave-payment-methods';
import { FlutterwaveSplitSubaccount } from './flutterwave-split.util';

const FLUTTERWAVE_POST_MAX_ATTEMPTS = 3;
const FLUTTERWAVE_RETRY_BASE_MS = 300;

type FlutterwaveApiResponse<T> = {
  status: string;
  message?: string;
  data?: T;
  error?: {
    type?: string;
    code?: string;
    message?: string;
    validation_errors?: Array<{ field_name?: string; message?: string }>;
  };
};

type NextAction = {
  type: string;
  redirect_url?: { url: string };
  payment_instruction?: { note?: string };
};

type ChargeData = {
  id?: string;
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  next_action?: NextAction;
};

type CustomerData = {
  id: string;
};

type VirtualAccountData = {
  account_number: string;
  account_bank_name: string;
  account_expiration_datetime?: string;
  note?: string;
};

export type FlutterwaveInitResult = {
  authorizationUrl: string | null;
  reference: string;
  paymentInstruction?: string;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    expiresAt?: string;
  };
};

class FlutterwaveRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlutterwaveRetryableError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl: string;
  private readonly webhookSecret: string | undefined;
  private readonly callbackBaseUrl: string;
  private readonly scenarioKey: string | undefined;
  private readonly env: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly auth: FlutterwaveAuthService,
  ) {
    this.env = this.configService.get<string>('FLUTTERWAVE_ENV', 'sandbox');
    this.baseUrl = resolveFlutterwaveBaseUrl(this.env);
    this.webhookSecret = this.configService.get<string>(
      'FLUTTERWAVE_WEBHOOK_SECRET',
    );
    this.callbackBaseUrl = this.configService.get<string>(
      'FLUTTERWAVE_CALLBACK_BASE_URL',
      'http://localhost:3000',
    );
    this.scenarioKey = this.configService.get<string>('FLUTTERWAVE_SCENARIO_KEY');
  }

  isConfigured(): boolean {
    return this.auth.isConfigured();
  }

  async initializeTransaction(params: {
    email: string;
    phone: string;
    name: string;
    amountNaira: number;
    reference: string;
    callbackPath: string;
    paymentMethod: FlutterwavePaymentMethod;
    ussdBankCode?: string;
    metadata?: Record<string, unknown>;
    subaccounts?: FlutterwaveSplitSubaccount[];
  }): Promise<FlutterwaveInitResult> {
    if (!this.auth.isConfigured()) {
      return { authorizationUrl: null, reference: params.reference };
    }

    if (params.paymentMethod === 'bank_transfer') {
      return this.initializeBankTransfer(params);
    }

    const redirectUrl = `${this.callbackBaseUrl.replace(/\/$/, '')}${params.callbackPath}`;
    const nameParts = splitCustomerName(params.name);
    const phoneNumber = normalizeNigerianPhoneForFlutterwave(params.phone);

    const payload = await this.request<ChargeData>(
      '/orchestration/direct-charges',
      {
        method: 'POST',
        idempotencyKey: flutterwaveIdempotencyKey('charge', params.reference),
        body: {
          amount: params.amountNaira,
          currency: 'NGN',
          reference: params.reference,
          redirect_url: redirectUrl,
          customer: {
            email: params.email,
            name: nameParts,
            phone: {
              country_code: '234',
              number: phoneNumber,
            },
          },
          payment_method: buildFlutterwavePaymentMethod({
            paymentMethod: params.paymentMethod,
            phone: params.phone,
            ussdBankCode: params.ussdBankCode,
          }),
          meta: params.metadata,
          ...(params.subaccounts?.length
            ? { subaccounts: params.subaccounts }
            : {}),
        },
      },
    );

    return this.parseChargeResponse(payload, params.reference);
  }

  private async initializeBankTransfer(params: {
    email: string;
    phone: string;
    name: string;
    amountNaira: number;
    reference: string;
    metadata?: Record<string, unknown>;
    subaccounts?: FlutterwaveSplitSubaccount[];
  }): Promise<FlutterwaveInitResult> {
    const nameParts = splitCustomerName(params.name);
    const phoneNumber = normalizeNigerianPhoneForFlutterwave(params.phone);

    const customer = await this.request<CustomerData>('/customers', {
      method: 'POST',
      idempotencyKey: flutterwaveIdempotencyKey('customer', params.reference),
      body: {
        email: params.email,
        name: nameParts,
        phone: {
          country_code: '234',
          number: phoneNumber,
        },
      },
    });

    if (!customer.id) {
      throw new InternalServerErrorException('Could not start payment.');
    }

    const virtualAccount = await this.request<VirtualAccountData>(
      '/virtual-accounts',
      {
        method: 'POST',
        idempotencyKey: flutterwaveIdempotencyKey(
          'virtual-account',
          params.reference,
        ),
        body: {
          reference: params.reference,
          customer_id: customer.id,
          amount: params.amountNaira,
          currency: 'NGN',
          account_type: 'dynamic',
          expiry: 3600,
          narration: params.name,
          meta: params.metadata,
          ...(params.subaccounts?.length
            ? { subaccounts: params.subaccounts }
            : {}),
        },
      },
    );

    if (!virtualAccount.account_number) {
      throw new InternalServerErrorException('Could not start payment.');
    }

    return {
      authorizationUrl: null,
      reference: params.reference,
      paymentInstruction:
        virtualAccount.note ??
        `Transfer exactly ₦${params.amountNaira.toLocaleString('en-NG')} to ${virtualAccount.account_bank_name} account ${virtualAccount.account_number}.`,
      virtualAccount: {
        accountNumber: virtualAccount.account_number,
        bankName: virtualAccount.account_bank_name,
        expiresAt: virtualAccount.account_expiration_datetime,
      },
    };
  }

  private parseChargeResponse(
    data: ChargeData,
    reference: string,
  ): FlutterwaveInitResult {
    const nextAction = data.next_action;

    if (nextAction?.type === 'redirect_url' && nextAction.redirect_url?.url) {
      return {
        authorizationUrl: nextAction.redirect_url.url,
        reference: data.reference ?? reference,
      };
    }

    if (
      nextAction?.type === 'payment_instruction' &&
      nextAction.payment_instruction?.note
    ) {
      return {
        authorizationUrl: null,
        reference: data.reference ?? reference,
        paymentInstruction: nextAction.payment_instruction.note,
      };
    }

    this.logger.error(
      `Flutterwave charge missing redirect or instruction: ${nextAction?.type ?? 'none'}`,
    );
    throw new InternalServerErrorException('Could not start payment.');
  }

  async verifyTransaction(
    reference: string,
    expectedAmount?: number,
  ): Promise<boolean> {
    if (!this.auth.isConfigured()) {
      return true;
    }

    const payload = await this.request<ChargeData[]>(
      `/charges?reference=${encodeURIComponent(reference)}`,
      { method: 'GET' },
    );

    const charge = Array.isArray(payload) ? payload[0] : undefined;
    if (!charge || charge.status !== 'succeeded') {
      return false;
    }

    if (charge.reference && charge.reference !== reference) {
      this.logger.warn(
        `Flutterwave charge reference mismatch: expected ${reference}, got ${charge.reference}`,
      );
      return false;
    }

    if (expectedAmount !== undefined) {
      if (charge.amount !== expectedAmount) {
        return false;
      }
      if (charge.currency && charge.currency !== 'NGN') {
        return false;
      }
    }

    return true;
  }

  verifyWebhookSignature(rawBody: string, signature: string): void {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException(
        'Webhook secret is not configured. All webhook requests are being rejected for security.',
      );
    }

    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expectedHash = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('base64');

    const expectedBuffer = Buffer.from(expectedHash);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  private async request<T>(
    path: string,
    options: {
      method: string;
      body?: Record<string, unknown>;
      idempotencyKey?: string;
    },
  ): Promise<T> {
    const isWrite =
      options.method === 'POST' ||
      options.method === 'PUT' ||
      options.method === 'PATCH';
    const idempotencyKey = isWrite
      ? (options.idempotencyKey ?? newFlutterwaveTraceId())
      : undefined;

    const maxAttempts = isWrite ? FLUTTERWAVE_POST_MAX_ATTEMPTS : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.executeRequest<T>(path, options.method, options.body, {
          idempotencyKey,
          attempt,
          maxAttempts,
        });
      } catch (error) {
        const retryable = error instanceof FlutterwaveRetryableError;
        if (!retryable || attempt === maxAttempts) {
          if (retryable) {
            throw new InternalServerErrorException(
              'Could not complete payment request.',
            );
          }
          throw error;
        }

        const delayMs = FLUTTERWAVE_RETRY_BASE_MS * attempt;
        this.logger.warn(
          `Flutterwave ${options.method} ${path} retry ${attempt}/${maxAttempts} in ${delayMs}ms`,
        );
        await sleep(delayMs);
      }
    }

    throw new InternalServerErrorException('Could not complete payment request.');
  }

  private async executeRequest<T>(
    path: string,
    method: string,
    body: Record<string, unknown> | undefined,
    context: {
      idempotencyKey?: string;
      attempt: number;
      maxAttempts: number;
    },
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    if (!token) {
      throw new InternalServerErrorException('Could not authenticate payment.');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Trace-Id': newFlutterwaveTraceId(),
    };

    if (context.idempotencyKey) {
      headers['X-Idempotency-Key'] = context.idempotencyKey;
    }

    if (this.env !== 'production' && this.scenarioKey) {
      headers['X-Scenario-Key'] = this.scenarioKey;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      this.logger.error(
        `Flutterwave network error ${method} ${path}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new FlutterwaveRetryableError('network');
    }

    const cacheHit = response.headers.get('x-idempotency-cache-hit');
    if (cacheHit === 'true') {
      this.logger.log(
        `Flutterwave idempotency cache hit for ${method} ${path}`,
      );
    }

    let json: FlutterwaveApiResponse<T>;
    try {
      json = (await response.json()) as FlutterwaveApiResponse<T>;
    } catch {
      if (response.status >= 500) {
        throw new FlutterwaveRetryableError(`HTTP ${response.status}`);
      }
      throw new InternalServerErrorException('Could not complete payment request.');
    }

    if (response.status >= 500) {
      const detail =
        json.error?.message ?? json.message ?? `HTTP ${response.status}`;
      this.logger.error(
        `Flutterwave API ${method} ${path} server error: ${detail}`,
      );
      throw new FlutterwaveRetryableError(detail);
    }

    if (!response.ok || json.status !== 'success') {
      const detail =
        json.error?.message ??
        json.message ??
        json.error?.validation_errors
          ?.map((e) => `${e.field_name}: ${e.message}`)
          .join('; ') ??
        `HTTP ${response.status}`;
      this.logger.error(
        `Flutterwave API ${method} ${path} failed: ${detail}`,
      );
      if (json.error?.code) {
        this.logger.debug(
          `Flutterwave error code=${json.error.code} type=${json.error.type}`,
        );
      }
      throw new InternalServerErrorException('Could not complete payment request.');
    }

    return json.data as T;
  }
}
