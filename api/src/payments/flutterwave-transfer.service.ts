import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlutterwaveAuthService } from './flutterwave-auth.service';
import {
  newFlutterwaveTraceId,
  resolveFlutterwaveBaseUrl,
} from './flutterwave.config';
import { normalizeNigerianBankCode } from './flutterwave-bank.util';

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

type TransferRecipientData = {
  id: string;
  type?: string;
  currency?: string;
};

type TransferData = {
  id: string;
  reference?: string;
  status?: string;
};

export type FlutterwaveRecipientResult = {
  recipientId: string;
};

export type FlutterwaveTransferResult = {
  transferId: string;
  reference: string;
  status: string;
};

export type FlutterwaveTransferStatus = {
  transferId: string;
  reference?: string;
  status: string;
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
export class FlutterwaveTransferService {
  private readonly logger = new Logger(FlutterwaveTransferService.name);
  private readonly baseUrl: string;
  private readonly env: string | undefined;
  private readonly scenarioKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly auth: FlutterwaveAuthService,
  ) {
    this.env = this.configService.get<string>('FLUTTERWAVE_ENV', 'sandbox');
    this.baseUrl = resolveFlutterwaveBaseUrl(this.env);
    this.scenarioKey = this.configService.get<string>('FLUTTERWAVE_SCENARIO_KEY');
  }

  isConfigured(): boolean {
    return this.auth.isConfigured();
  }

  async createNgnBankRecipient(
    bankCode: string,
    accountNumber: string,
    existingRecipientId?: string | null,
  ): Promise<FlutterwaveRecipientResult> {
    const code = normalizeNigerianBankCode(bankCode);
    const normalizedAccount = accountNumber.replace(/\D/g, '');

    if (!this.isConfigured()) {
      const mockId =
        existingRecipientId ?? `rcb_MOCK_${code}_${normalizedAccount.slice(-4)}`;
      return { recipientId: mockId };
    }

    const data = await this.request<TransferRecipientData>(
      '/transfers/recipients',
      {
        method: 'POST',
        body: {
          type: 'bank_ngn',
          bank: {
            code,
            account_number: normalizedAccount,
          },
        },
        idempotencyKey: `recipient-${code}-${normalizedAccount}`,
      },
    );

    if (!data.id) {
      throw new InternalServerErrorException('Could not create payout recipient.');
    }

    return { recipientId: data.id };
  }

  async initiateInstantTransfer(params: {
    recipientId: string;
    amountNaira: number;
    reference: string;
    narration: string;
    meta?: Record<string, string>;
  }): Promise<FlutterwaveTransferResult> {
    if (params.amountNaira <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero.');
    }

    if (!this.isConfigured()) {
      return {
        transferId: `trf_MOCK_${params.reference}`,
        reference: params.reference,
        status: 'NEW',
      };
    }

    const data = await this.request<TransferData>('/transfers', {
      method: 'POST',
      body: {
        action: 'instant',
        reference: params.reference,
        narration: params.narration,
        meta: params.meta ?? {},
        payment_instruction: {
          source_currency: 'NGN',
          amount: {
            applies_to: 'source_currency',
            value: params.amountNaira,
          },
          recipient_id: params.recipientId,
        },
      },
      idempotencyKey: params.reference,
    });

    if (!data.id) {
      throw new InternalServerErrorException('Could not initiate vendor payout.');
    }

    return {
      transferId: data.id,
      reference: data.reference ?? params.reference,
      status: data.status ?? 'NEW',
    };
  }

  async getTransfer(transferId: string): Promise<FlutterwaveTransferStatus> {
    if (!this.isConfigured()) {
      return {
        transferId,
        status: 'SUCCESSFUL',
      };
    }

    const data = await this.request<TransferData>(
      `/transfers/${encodeURIComponent(transferId)}`,
      { method: 'GET' },
    );

    return {
      transferId: data.id,
      reference: data.reference,
      status: data.status ?? 'UNKNOWN',
    };
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
        });
      } catch (error) {
        const retryable = error instanceof FlutterwaveRetryableError;
        if (!retryable || attempt === maxAttempts) {
          if (retryable) {
            throw new InternalServerErrorException('Could not complete payout request.');
          }
          throw error;
        }

        const delayMs = FLUTTERWAVE_RETRY_BASE_MS * attempt;
        this.logger.warn(
          `Flutterwave transfer ${options.method} ${path} retry ${attempt}/${maxAttempts} in ${delayMs}ms`,
        );
        await sleep(delayMs);
      }
    }

    throw new InternalServerErrorException('Could not complete payout request.');
  }

  private async executeRequest<T>(
    path: string,
    method: string,
    body: Record<string, unknown> | undefined,
    context: { idempotencyKey?: string },
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    if (!token) {
      throw new InternalServerErrorException('Could not authenticate payout.');
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
        `Flutterwave transfer network error ${method} ${path}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new FlutterwaveRetryableError('network');
    }

    let json: FlutterwaveApiResponse<T>;
    try {
      json = (await response.json()) as FlutterwaveApiResponse<T>;
    } catch {
      if (response.status >= 500) {
        throw new FlutterwaveRetryableError(`HTTP ${response.status}`);
      }
      throw new InternalServerErrorException('Could not complete payout request.');
    }

    if (response.status >= 500) {
      const detail =
        json.error?.message ?? json.message ?? `HTTP ${response.status}`;
      this.logger.error(
        `Flutterwave transfer API ${method} ${path} server error: ${detail}`,
      );
      throw new FlutterwaveRetryableError(detail);
    }

    if (!response.ok || json.status !== 'success') {
      const detail =
        json.error?.message ??
        json.message ??
        json.error?.validation_errors
          ?.map((entry) => `${entry.field_name}: ${entry.message}`)
          .join('; ') ??
        `HTTP ${response.status}`;
      this.logger.error(
        `Flutterwave transfer API ${method} ${path} failed: ${detail}`,
      );
      throw new BadRequestException(detail);
    }

    return json.data as T;
  }
}
