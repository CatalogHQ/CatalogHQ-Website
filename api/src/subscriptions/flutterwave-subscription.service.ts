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
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { PrismaService } from '../prisma/prisma.service';

type V3Response<T> = {
  status: string;
  message?: string;
  data?: T;
};

type V3PaymentPlan = {
  id: number;
  name: string;
  amount: number;
  interval: string;
  status: string;
};

type V3PaymentInit = {
  link?: string;
};

const FLUTTERWAVE_V3_BASE_URL = 'https://api.flutterwave.com/v3';

export type SubscriptionCheckoutResult = {
  authorizationUrl: string;
  reference: string;
  flutterwaveSubscriptionId?: string;
};

@Injectable()
export class FlutterwaveSubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(FlutterwaveSubscriptionService.name);
  private readonly secretKey: string | undefined;
  private readonly callbackBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly planCatalogService: PlanCatalogService,
  ) {
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    this.callbackBaseUrl =
      this.configService.get<string>('FLUTTERWAVE_CALLBACK_BASE_URL') ??
      'http://localhost:3000';
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'FLUTTERWAVE_SECRET_KEY not set; subscription payment plans will not sync.',
      );
      return;
    }

    try {
      await this.syncPaymentPlans();
    } catch (error) {
      this.logger.error('Failed to sync Flutterwave payment plans.', error);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey?.trim());
  }

  async syncPaymentPlans(): Promise<void> {
    const catalog = await this.planCatalogService.listAdminCatalog();

    for (const plan of catalog) {
      if (!plan.active) {
        continue;
      }

      const entry = await this.prisma.planCatalogEntry.findUnique({
        where: { tier: plan.id as PlanTier },
      });

      if (!entry) {
        continue;
      }

      if (entry.flutterwavePaymentPlanId) {
        continue;
      }

      const created = await this.request<V3PaymentPlan>('/payment-plans', {
        method: 'POST',
        body: {
          amount: entry.monthlyPriceKobo / 100,
          name: `CatalogHQ ${entry.name}`,
          interval: 'monthly',
          currency: 'NGN',
        },
      });

      if (!created?.id) {
        throw new InternalServerErrorException(
          `Could not create Flutterwave payment plan for ${entry.tier}.`,
        );
      }

      await this.prisma.planCatalogEntry.update({
        where: { tier: entry.tier },
        data: { flutterwavePaymentPlanId: created.id },
      });

      this.logger.log(
        `Synced Flutterwave payment plan ${created.id} for tier ${entry.tier}.`,
      );
    }
  }

  async createSubscriptionCheckout(input: {
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
        flutterwaveSubscriptionId: `MOCK_SUB_${input.vendorId.slice(0, 8)}`,
      };
    }

    if (!entry.flutterwavePaymentPlanId) {
      await this.syncPaymentPlans();
    }

    const refreshed = await this.prisma.planCatalogEntry.findUnique({
      where: { tier: input.planTier },
    });

    if (!refreshed?.flutterwavePaymentPlanId) {
      throw new ServiceUnavailableException(
        'Subscription billing is not configured. Contact support.',
      );
    }

    const amountNaira = refreshed.monthlyPriceKobo / 100;

    const payload = await this.request<V3PaymentInit>('/payments', {
      method: 'POST',
      body: {
        tx_ref: input.reference,
        amount: amountNaira,
        currency: 'NGN',
        redirect_url: `${this.callbackBaseUrl}/dashboard/billing?status=success&reference=${encodeURIComponent(input.reference)}`,
        payment_plan: refreshed.flutterwavePaymentPlanId,
        customer: {
          email: input.email,
          name: input.email.split('@')[0] || 'CatalogHQ Vendor',
        },
      },
    });

    if (!payload?.link) {
      throw new InternalServerErrorException(
        'Could not start subscription checkout.',
      );
    }

    return {
      authorizationUrl: payload.link,
      reference: input.reference,
    };
  }

  async verifySubscriptionPayment(reference: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return reference.startsWith('sub_');
    }

    const payload = await this.request<{ status?: string }>(
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { method: 'GET' },
    );

    return payload?.status === 'successful';
  }

  async cancelSubscription(flutterwaveSubscriptionId: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    await this.request(`/subscriptions/${encodeURIComponent(flutterwaveSubscriptionId)}/cancel`, {
      method: 'PUT',
      body: {},
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
        'Subscription billing is not configured. Set FLUTTERWAVE_SECRET_KEY.',
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
      throw new InternalServerErrorException('Could not complete subscription request.');
    }

    if (!response.ok || json.status !== 'success') {
      this.logger.error(
        `Flutterwave v3 ${options.method} ${path} failed: ${json.message ?? response.status}`,
      );
      throw new BadRequestException(
        json.message ?? 'Could not complete subscription request.',
      );
    }

    return json.data as T;
  }
}
