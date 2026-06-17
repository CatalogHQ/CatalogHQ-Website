import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTier } from '@prisma/client';
import { isDevPaymentMocksEnabled } from '../common/env.util';
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { PrismaService } from '../prisma/prisma.service';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

type PaystackResponse<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

type PaystackPlan = {
  plan_code: string;
  name: string;
  amount: number;
};

type PaystackTransactionInit = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackTransactionVerify = {
  status: string;
  amount: number;
  currency: string;
  reference: string;
  customer?: {
    customer_code?: string;
    email?: string;
  };
  authorization?: {
    authorization_code?: string;
    channel?: string;
  };
  plan?: {
    plan_code?: string;
  };
  subscription?: {
    subscription_code?: string;
    email_token?: string;
  };
};

type PaystackSubscription = {
  subscription_code: string;
  email_token?: string;
  customer?: {
    customer_code?: string;
  };
  plan?: {
    plan_code?: string;
  };
  authorization?: {
    authorization_code?: string;
  };
};

export type SubscriptionCheckoutResult = {
  authorizationUrl: string;
  reference: string;
};

export type SubscriptionPaymentVerification = {
  successful: boolean;
  amountKobo?: number;
  currency?: string;
  customerCode?: string;
  authorizationCode?: string;
  subscriptionCode?: string;
  emailToken?: string;
};

@Injectable()
export class PaystackSubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(PaystackSubscriptionService.name);
  private readonly secretKey: string | undefined;
  private readonly callbackBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly planCatalogService: PlanCatalogService,
  ) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.callbackBaseUrl =
      this.configService.get<string>('PAYSTACK_CALLBACK_BASE_URL') ??
      this.configService.get<string>('FLUTTERWAVE_CALLBACK_BASE_URL') ??
      'http://localhost:3000';
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'PAYSTACK_SECRET_KEY not set; Paystack subscription plans will not sync.',
      );
      return;
    }

    try {
      await this.syncPlans();
    } catch (error) {
      this.logger.error('Failed to sync Paystack subscription plans.', error);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey?.trim());
  }

  async syncPlans(): Promise<void> {
    const catalog = await this.planCatalogService.listAdminCatalog();

    for (const plan of catalog) {
      if (!plan.active) {
        continue;
      }

      const entry = await this.prisma.planCatalogEntry.findUnique({
        where: { tier: plan.id as PlanTier },
      });

      if (!entry || entry.paystackPlanCode) {
        continue;
      }

      const created = await this.request<PaystackPlan>('/plan', {
        method: 'POST',
        body: {
          name: `CatalogHQ ${entry.name}`,
          amount: entry.monthlyPriceKobo,
          interval: 'monthly',
          currency: 'NGN',
        },
      });

      if (!created?.plan_code) {
        throw new InternalServerErrorException(
          `Could not create Paystack plan for ${entry.tier}.`,
        );
      }

      await this.prisma.planCatalogEntry.update({
        where: { tier: entry.tier },
        data: { paystackPlanCode: created.plan_code },
      });

      this.logger.log(
        `Synced Paystack plan ${created.plan_code} for tier ${entry.tier}.`,
      );
    }
  }

  async createDirectDebitCheckout(input: {
    vendorId: string;
    email: string;
    planTier: PlanTier;
    reference: string;
  }): Promise<SubscriptionCheckoutResult> {
    const entry = await this.prisma.planCatalogEntry.findUnique({
      where: { tier: input.planTier },
    });

    if (!entry?.active) {
      throw new BadRequestException('Selected plan is not available.');
    }

    if (!this.isConfigured()) {
      return {
        authorizationUrl: `${this.callbackBaseUrl}/dashboard/billing?status=success&reference=${encodeURIComponent(input.reference)}`,
        reference: input.reference,
      };
    }

    if (!entry.paystackPlanCode) {
      await this.syncPlans();
    }

    const refreshed = await this.prisma.planCatalogEntry.findUnique({
      where: { tier: input.planTier },
    });

    if (!refreshed?.paystackPlanCode) {
      throw new ServiceUnavailableException(
        'Subscription billing is not configured. Contact support.',
      );
    }

    await this.ensureCustomer(input.email, input.vendorId);

    const callbackUrl = `${this.callbackBaseUrl}/dashboard/billing?status=success&reference=${encodeURIComponent(input.reference)}`;

    const payload = await this.request<PaystackTransactionInit>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: {
          email: input.email,
          amount: refreshed.monthlyPriceKobo,
          reference: input.reference,
          currency: 'NGN',
          plan: refreshed.paystackPlanCode,
          channels: ['bank'],
          callback_url: callbackUrl,
          metadata: {
            vendor_id: input.vendorId,
            plan_tier: input.planTier,
            subscription_reference: input.reference,
            custom_fields: [
              {
                display_name: 'CatalogHQ vendor',
                variable_name: 'vendor_id',
                value: input.vendorId,
              },
            ],
          },
        },
      },
    );

    if (!payload?.authorization_url) {
      throw new InternalServerErrorException(
        'Could not start subscription checkout.',
      );
    }

    return {
      authorizationUrl: payload.authorization_url,
      reference: input.reference,
    };
  }

  async verifySubscriptionPayment(
    reference: string,
  ): Promise<SubscriptionPaymentVerification> {
    if (!this.isConfigured()) {
      return {
        successful:
          isDevPaymentMocksEnabled(this.configService) &&
          reference.startsWith('sub_'),
        currency: 'NGN',
      };
    }

    const payload = await this.request<PaystackTransactionVerify>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: 'GET' },
    );

    return {
      successful: payload?.status === 'success',
      amountKobo:
        payload?.amount !== undefined
          ? Math.round(payload.amount)
          : undefined,
      currency: payload?.currency?.toUpperCase(),
      customerCode: payload?.customer?.customer_code,
      authorizationCode: payload?.authorization?.authorization_code,
      subscriptionCode: payload?.subscription?.subscription_code,
      emailToken: payload?.subscription?.email_token,
    };
  }

  async cancelSubscription(
    subscriptionCode: string,
    emailToken: string,
  ): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    await this.request('/subscription/disable', {
      method: 'POST',
      body: {
        code: subscriptionCode,
        token: emailToken,
      },
    });
  }

  async fetchSubscription(
    subscriptionCode: string,
  ): Promise<PaystackSubscription | null> {
    if (!this.isConfigured()) {
      return null;
    }

    return this.request<PaystackSubscription>(
      `/subscription/${encodeURIComponent(subscriptionCode)}`,
      { method: 'GET' },
    );
  }

  private async ensureCustomer(email: string, vendorId: string): Promise<void> {
    await this.request('/customer', {
      method: 'POST',
      body: {
        email,
        metadata: {
          vendor_id: vendorId,
        },
      },
    });
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
        'Subscription billing is not configured. Set PAYSTACK_SECRET_KEY.',
      );
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let json: PaystackResponse<T>;
    try {
      json = (await response.json()) as PaystackResponse<T>;
    } catch {
      throw new InternalServerErrorException(
        'Could not complete Paystack subscription request.',
      );
    }

    if (!response.ok || json.status !== true) {
      this.logger.error(
        `Paystack ${options.method} ${path} failed: ${json.message ?? response.status}`,
      );
      throw new BadRequestException(
        json.message ?? 'Could not complete Paystack subscription request.',
      );
    }

    return json.data as T;
  }
}
