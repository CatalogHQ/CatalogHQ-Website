import {
  BadRequestException,
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
  FLUTTERWAVE_V3_BASE_URL,
} from './flutterwave.config';
import {
  buildFlutterwaveCheckoutEmail,
  FlutterwavePaymentMethod,
} from './flutterwave-payment-methods';
import {
  extractV3BankTransferAuthorization,
  formatFlutterwaveV3PhoneNumber,
} from './flutterwave-bank-transfer.util';
import { flutterwaveAmountMatchesNaira } from './flutterwave-amount.util';
import { isDevPaymentMocksEnabled, isProductionEnv } from '../common/env.util';

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

type V3ApiResponse<T> = {
  status: string;
  message?: string;
  data?: T;
};

type V3VerifiedTransaction = {
  status?: string;
  amount?: number;
  currency?: string;
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

export type FlutterwaveCheckoutSplit = {
  subaccountId: string;
  platformCommissionNaira: number;
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

function toFlutterwaveClientError(detail: string): string {
  const lower = detail.toLowerCase();

  if (
    lower.includes('merchant not found')
  ) {
    return 'Payment could not be started. Contact support if this continues.';
  }

  if (detail.length > 180) {
    return 'Payment could not be started. Try another payment method or contact support.';
  }

  return detail;
}

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl: string;
  private readonly webhookSecret: string | undefined;
  private readonly callbackBaseUrl: string;
  private readonly scenarioKey: string | undefined;
  private readonly env: string | undefined;
  private readonly secretKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly auth: FlutterwaveAuthService,
  ) {
    this.env = this.configService.get<string>('FLUTTERWAVE_ENV', 'sandbox');
    this.baseUrl = resolveFlutterwaveBaseUrl(this.env);
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
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
    return this.auth.isConfigured() && Boolean(this.secretKey?.trim());
  }

  async initializeTransaction(params: {
    email: string;
    phone: string;
    name: string;
    amountNaira: number;
    reference: string;
    callbackPath: string;
    paymentMethod: FlutterwavePaymentMethod;
    metadata?: Record<string, unknown>;
    split?: FlutterwaveCheckoutSplit;
  }): Promise<FlutterwaveInitResult> {
    if (!this.auth.isConfigured()) {
      return { authorizationUrl: null, reference: params.reference };
    }

    if (params.paymentMethod !== 'bank_transfer') {
      throw new BadRequestException('Only bank transfer checkout is supported.');
    }

    return this.initializeBankTransfer(params);
  }

  private async initializeBankTransfer(params: {
    email: string;
    phone: string;
    name: string;
    amountNaira: number;
    reference: string;
    metadata?: Record<string, unknown>;
    split?: FlutterwaveCheckoutSplit;
  }): Promise<FlutterwaveInitResult> {
    if (!this.secretKey?.trim()) {
      throw new InternalServerErrorException('Could not start payment.');
    }

    const body: Record<string, unknown> = {
      tx_ref: params.reference,
      amount: params.amountNaira,
      currency: 'NGN',
      email: params.email || buildFlutterwaveCheckoutEmail(params.phone),
      fullname: params.name,
      phone_number: formatFlutterwaveV3PhoneNumber(params.phone),
      bank_transfer_options: { expires: 3600 },
      ...(params.metadata ? { meta: params.metadata } : {}),
    };

    if (params.split?.subaccountId) {
      body.subaccounts = [
        {
          id: params.split.subaccountId,
          transaction_charge_type: 'flat',
          transaction_charge: Math.max(0, Math.round(params.split.platformCommissionNaira)),
        },
      ];
    }

    const response = await this.requestV3BankTransferCharge(body);
    const authorization = extractV3BankTransferAuthorization(response);

    if (!authorization?.transfer_account || !authorization.transfer_bank) {
      throw new InternalServerErrorException('Could not start payment.');
    }

    const expiresAt =
      authorization.account_expiration &&
      authorization.account_expiration !== 'N/A'
        ? authorization.account_expiration
        : undefined;

    return {
      authorizationUrl: null,
      reference: params.reference,
      paymentInstruction:
        authorization.transfer_note &&
        authorization.transfer_note !== 'N/A'
          ? authorization.transfer_note
          : `Transfer exactly ₦${params.amountNaira.toLocaleString('en-NG')} to ${authorization.transfer_bank} account ${authorization.transfer_account}.`,
      virtualAccount: {
        accountNumber: authorization.transfer_account,
        bankName: authorization.transfer_bank,
        expiresAt,
      },
    };
  }

  async verifyTransaction(
    reference: string,
    expectedAmount?: number,
    options?: {
      chargeId?: string;
      alternateReferences?: string[];
      retryDelaysMs?: number[];
    },
  ): Promise<boolean> {
    if (!this.auth.isConfigured()) {
      if (isProductionEnv(this.configService)) {
        this.logger.error(
          'Flutterwave auth is not configured; refusing to verify payment in production.',
        );
        return false;
      }

      return isDevPaymentMocksEnabled(this.configService);
    }

    const references = [
      reference,
      ...(options?.alternateReferences ?? []).filter(
        (candidate) => candidate && candidate !== reference,
      ),
    ];
    const retryDelaysMs = options?.retryDelaysMs ?? [0, 1_500, 3_000, 5_000];

    for (const delayMs of retryDelaysMs) {
      if (delayMs > 0) {
        await sleep(delayMs);
      }

      if (options?.chargeId) {
        const byChargeId = await this.verifyV4ChargeById(
          options.chargeId,
          expectedAmount,
        );
        if (byChargeId) {
          return true;
        }
      }

      for (const candidate of references) {
        const v4Verified = await this.verifyV4Charge(candidate, expectedAmount);
        if (v4Verified) {
          return true;
        }

        const v3Verified = await this.verifyV3Transaction(
          candidate,
          expectedAmount,
        );
        if (v3Verified) {
          return true;
        }
      }
    }

    return false;
  }

  private chargeMatchesExpectedAmount(
    charge: ChargeData,
    reference: string,
    expectedAmount?: number,
  ): boolean {
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
      if (!flutterwaveAmountMatchesNaira(expectedAmount, charge.amount)) {
        this.logger.warn(
          `Flutterwave charge amount mismatch for ${reference}: expected ${expectedAmount}, got ${charge.amount}`,
        );
        return false;
      }
      if (charge.currency && charge.currency !== 'NGN') {
        return false;
      }
    }

    return true;
  }

  private async verifyV4ChargeById(
    chargeId: string,
    expectedAmount?: number,
  ): Promise<boolean> {
    try {
      const charge = await this.request<ChargeData>(
        `/charges/${encodeURIComponent(chargeId)}`,
        { method: 'GET' },
      );

      if (!charge?.reference) {
        return this.chargeMatchesExpectedAmount(charge, chargeId, expectedAmount);
      }

      return this.chargeMatchesExpectedAmount(
        charge,
        charge.reference,
        expectedAmount,
      );
    } catch {
      return false;
    }
  }

  private async verifyV4Charge(
    reference: string,
    expectedAmount?: number,
  ): Promise<boolean> {
    try {
      const payload = await this.request<ChargeData[]>(
        `/charges?reference=${encodeURIComponent(reference)}`,
        { method: 'GET' },
      );

      const charge = Array.isArray(payload) ? payload[0] : undefined;
      if (!charge) {
        return false;
      }

      return this.chargeMatchesExpectedAmount(charge, reference, expectedAmount);
    } catch {
      return false;
    }
  }

  private async verifyV3Transaction(
    reference: string,
    expectedAmount?: number,
  ): Promise<boolean> {
    if (!this.secretKey?.trim()) {
      return false;
    }

    try {
      const payload = await this.requestV3<V3VerifiedTransaction>(
        `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        { method: 'GET' },
      );

      if (payload.status !== 'successful') {
        return false;
      }

      if (expectedAmount !== undefined) {
        if (!flutterwaveAmountMatchesNaira(expectedAmount, payload.amount)) {
          this.logger.warn(
            `Flutterwave v3 amount mismatch for ${reference}: expected ${expectedAmount}, got ${payload.amount}`,
          );
          return false;
        }
        if (payload.currency && payload.currency !== 'NGN') {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  private async requestV3BankTransferCharge(
    body: Record<string, unknown>,
  ): Promise<V3ApiResponse<Record<string, unknown>> & { meta?: { authorization?: Record<string, unknown> } }> {
    if (!this.secretKey?.trim()) {
      throw new InternalServerErrorException('Could not start payment.');
    }

    let response: Response;
    try {
      response = await fetch(
        `${FLUTTERWAVE_V3_BASE_URL}/charges?type=bank_transfer`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    } catch (error) {
      this.logger.error(
        `Flutterwave v3 bank transfer network error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new InternalServerErrorException('Could not start payment.');
    }

    let json: V3ApiResponse<Record<string, unknown>> & {
      meta?: { authorization?: Record<string, unknown> };
    };
    try {
      json = (await response.json()) as typeof json;
    } catch {
      throw new InternalServerErrorException('Could not start payment.');
    }

    if (!response.ok || json.status !== 'success') {
      const detail = json.message ?? `HTTP ${response.status}`;
      this.logger.error(`Flutterwave v3 bank transfer failed: ${detail}`);
      throw new BadRequestException(toFlutterwaveClientError(detail));
    }

    return json;
  }

  private async requestV3<T>(
    path: string,
    options: {
      method: string;
      body?: Record<string, unknown>;
    },
  ): Promise<T> {
    if (!this.secretKey?.trim()) {
      throw new InternalServerErrorException('Could not verify payment.');
    }

    const response = await fetch(`${FLUTTERWAVE_V3_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let json: V3ApiResponse<T>;
    try {
      json = (await response.json()) as V3ApiResponse<T>;
    } catch {
      throw new InternalServerErrorException('Could not verify payment.');
    }

    if (!response.ok || json.status !== 'success') {
      throw new BadRequestException(json.message ?? 'Could not verify payment.');
    }

    return json.data as T;
  }

  verifyWebhookSignature(
    rawBody: string,
    headers: {
      flutterwaveSignature?: string;
      verifHash?: string;
    },
  ): void {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException(
        'Webhook secret is not configured. All webhook requests are being rejected for security.',
      );
    }

    const flutterwaveSignature = headers.flutterwaveSignature?.trim();
    const verifHash = headers.verifHash?.trim();
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (flutterwaveSignature) {
      const expectedHash = createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('base64');

      const expectedBuffer = Buffer.from(expectedHash);
      const signatureBuffer = Buffer.from(flutterwaveSignature);

      if (
        expectedBuffer.length === signatureBuffer.length &&
        timingSafeEqual(expectedBuffer, signatureBuffer)
      ) {
        return;
      }
    }

    if (!isProduction && verifHash) {
      const secretBuffer = Buffer.from(this.webhookSecret);
      const verifBuffer = Buffer.from(verifHash);

      if (
        secretBuffer.length === verifBuffer.length &&
        timingSafeEqual(secretBuffer, verifBuffer)
      ) {
        return;
      }
    }

    throw new UnauthorizedException('Invalid webhook signature');
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
      if (json.error?.validation_errors?.length) {
        this.logger.error(
          `Flutterwave validation errors: ${json.error.validation_errors
            .map((entry) => `${entry.field_name}: ${entry.message}`)
            .join('; ')}`,
        );
      }
      if (json.error?.code) {
        this.logger.debug(
          `Flutterwave error code=${json.error.code} type=${json.error.type}`,
        );
      }

      if (response.status >= 500) {
        throw new FlutterwaveRetryableError(detail);
      }

      throw new BadRequestException(toFlutterwaveClientError(detail));
    }

    return json.data as T;
  }
}
