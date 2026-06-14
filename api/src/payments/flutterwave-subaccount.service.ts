import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Store } from '@prisma/client';

export type FlutterwaveBank = {
  code: string;
  name: string;
};

export type ResolvedBankAccount = {
  accountNumber: string;
  accountName: string;
};

type V3Response<T> = {
  status: string;
  message?: string;
  data?: T;
};

type V3Bank = {
  code: string;
  name: string;
};

type V3ResolveAccount = {
  account_number: string;
  account_name: string;
};

type V3Subaccount = {
  id: number;
  subaccount_id: string;
  account_number: string;
  account_bank: string;
  split_type: string;
  split_value: number;
};

const FLUTTERWAVE_V3_BASE_URL = 'https://api.flutterwave.com/v3';

@Injectable()
export class FlutterwaveSubaccountService {
  private readonly logger = new Logger(FlutterwaveSubaccountService.name);
  private readonly secretKey: string | undefined;
  private banksCache: FlutterwaveBank[] | null = null;
  private banksCacheExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey?.trim());
  }

  async listBanks(): Promise<FlutterwaveBank[]> {
    if (!this.isConfigured()) {
      return this.getFallbackBanks();
    }

    const now = Date.now();
    if (this.banksCache && now < this.banksCacheExpiresAt) {
      return this.banksCache;
    }

    const payload = await this.request<V3Bank[]>('/banks/NG', { method: 'GET' });
    const banks = (payload ?? [])
      .filter((bank) => bank.code && bank.name)
      .map((bank) => ({ code: bank.code, name: bank.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.banksCache = banks.length > 0 ? banks : this.getFallbackBanks();
    this.banksCacheExpiresAt = now + 24 * 60 * 60 * 1000;
    return this.banksCache;
  }

  async resolveAccount(
    bankCode: string,
    accountNumber: string,
  ): Promise<ResolvedBankAccount> {
    if (!this.isConfigured()) {
      return {
        accountNumber,
        accountName: 'Demo Account Name',
      };
    }

    const payload = await this.request<V3ResolveAccount>('/accounts/resolve', {
      method: 'POST',
      body: {
        account_number: accountNumber,
        account_bank: bankCode,
      },
    });

    if (!payload?.account_name) {
      throw new InternalServerErrorException('Could not verify bank account.');
    }

    return {
      accountNumber: payload.account_number ?? accountNumber,
      accountName: payload.account_name,
    };
  }

  async createOrUpdateSubaccount(store: Store): Promise<string> {
    if (
      !store.payoutBankCode ||
      !store.payoutAccountNumber ||
      !store.businessName ||
      !store.whatsapp
    ) {
      throw new InternalServerErrorException('Payout bank details are incomplete.');
    }

    if (!this.isConfigured()) {
      const mockId = store.flutterwaveSubaccountId ?? `RS_MOCK_${store.vendorId.slice(0, 8)}`;
      return mockId;
    }

    const body = {
      account_bank: store.payoutBankCode,
      account_number: store.payoutAccountNumber,
      business_name: store.businessName.slice(0, 100),
      business_email: `${store.vendorId}@cataloghq.ng`,
      business_mobile: store.whatsapp.replace(/\D/g, '').slice(-11),
      business_contact: store.businessName.slice(0, 100),
      business_contact_mobile: store.whatsapp.replace(/\D/g, '').slice(-11),
      country: 'NG',
      split_type: 'flat',
      split_value: 0,
    };

    if (store.flutterwaveSubaccountId) {
      await this.request<V3Subaccount>(
        `/subaccounts/${encodeURIComponent(store.flutterwaveSubaccountId)}`,
        {
          method: 'PUT',
          body,
        },
      );
      return store.flutterwaveSubaccountId;
    }

    const created = await this.request<V3Subaccount>('/subaccounts', {
      method: 'POST',
      body,
    });

    const subaccountId = created?.subaccount_id;
    if (!subaccountId) {
      throw new InternalServerErrorException('Could not create payout account.');
    }

    return subaccountId;
  }

  private getFallbackBanks(): FlutterwaveBank[] {
    return [
      { code: '044', name: 'Access Bank' },
      { code: '058', name: 'GTBank' },
      { code: '033', name: 'UBA' },
      { code: '057', name: 'Zenith Bank' },
      { code: '011', name: 'First Bank' },
    ];
  }

  private async request<T>(
    path: string,
    options: {
      method: string;
      body?: Record<string, unknown>;
    },
  ): Promise<T> {
    if (!this.secretKey) {
      throw new ServiceUnavailableException(
        'Payout setup is not configured. Set FLUTTERWAVE_SECRET_KEY.',
      );
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

    let json: V3Response<T>;
    try {
      json = (await response.json()) as V3Response<T>;
    } catch {
      throw new InternalServerErrorException('Could not complete payout request.');
    }

    if (!response.ok || json.status !== 'success') {
      this.logger.error(
        `Flutterwave v3 ${options.method} ${path} failed: ${json.message ?? response.status}`,
      );
      throw new InternalServerErrorException(
        json.message ?? 'Could not complete payout request.',
      );
    }

    return json.data as T;
  }
}
