import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlanTier,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { flutterwaveAmountMatchesNaira } from '../payments/flutterwave-amount.util';
import { PlanCatalogService } from '../plans/plan-catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { PingramEmailService } from '../notifications/pingram-email.service';
import { SecurityAuditAction } from '../security/security-audit.actions';
import { SecurityAuditService } from '../security/security-audit.service';
import { SubscriptionCheckoutDto } from './dto/subscription-checkout.dto';
import { PaystackSubscriptionService } from './paystack-subscription.service';
import {
  SubscriptionPaymentDto,
  VendorSubscriptionDto,
  toSubscriptionPaymentDto,
  toVendorSubscriptionDto,
} from './subscription.mapper';

const SUBSCRIPTION_REFERENCE_PREFIX = 'sub_';

@Injectable()
export class VendorSubscriptionService {
  private readonly logger = new Logger(VendorSubscriptionService.name);
  private readonly graceDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly planCatalogService: PlanCatalogService,
    private readonly paystackSubscriptionService: PaystackSubscriptionService,
    private readonly emailService: PingramEmailService,
    private readonly configService: ConfigService,
    private readonly securityAudit: SecurityAuditService,
  ) {
    this.graceDays = Number(
      this.configService.get<string>('SUBSCRIPTION_GRACE_DAYS') ?? '2',
    );
  }

  async ensureSubscriptionRecord(vendorId: string, planTier: PlanTier = PlanTier.starter) {
    return this.prisma.vendorSubscription.upsert({
      where: { vendorId },
      create: {
        vendorId,
        planTier,
        status: SubscriptionStatus.pending,
      },
      update: {},
    });
  }

  async getSubscription(vendorId: string): Promise<VendorSubscriptionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: { subscription: true },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    const subscription =
      user.subscription ??
      (await this.ensureSubscriptionRecord(vendorId, user.planTier));

    return toVendorSubscriptionDto(user, subscription);
  }

  async listPayments(vendorId: string): Promise<SubscriptionPaymentDto[]> {
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(toSubscriptionPaymentDto);
  }

  async startCheckout(
    vendorId: string,
    email: string,
    dto: SubscriptionCheckoutDto,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const catalog = await this.planCatalogService.listPublicCatalog();
    const plan = catalog.find((entry) => entry.id === dto.planTier);
    if (!plan) {
      throw new BadRequestException('Select a valid plan.');
    }

    const reference = `${SUBSCRIPTION_REFERENCE_PREFIX}${randomUUID().replace(/-/g, '')}`;

    await this.ensureSubscriptionRecord(vendorId, dto.planTier);

    const checkout =
      await this.paystackSubscriptionService.createDirectDebitCheckout({
        vendorId,
        email,
        planTier: dto.planTier,
        reference,
      });

    await this.prisma.subscriptionPayment.create({
      data: {
        vendorId,
        planTier: dto.planTier,
        amountKobo: plan.monthlyPriceKobo,
        flutterwaveReference: reference,
        status: SubscriptionPaymentStatus.pending,
      },
    });

    await this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        planTier: dto.planTier,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    return {
      authorizationUrl: checkout.authorizationUrl,
      reference: checkout.reference,
    };
  }

  async cancelAtPeriodEnd(vendorId: string): Promise<VendorSubscriptionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: { subscription: true },
    });

    if (!user?.subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    const subscription = user.subscription;

    if (
      subscription.paystackSubscriptionCode &&
      subscription.paystackEmailToken
    ) {
      await this.paystackSubscriptionService.cancelSubscription(
        subscription.paystackSubscriptionCode,
        subscription.paystackEmailToken,
      );
    } else if (subscription.paystackSubscriptionCode) {
      const remote = await this.paystackSubscriptionService.fetchSubscription(
        subscription.paystackSubscriptionCode,
      );
      const emailToken = remote?.email_token;
      if (emailToken) {
        await this.paystackSubscriptionService.cancelSubscription(
          subscription.paystackSubscriptionCode,
          emailToken,
        );
      } else {
        this.logger.warn(
          `Paystack subscription ${subscription.paystackSubscriptionCode} missing email token; marked canceled locally only.`,
        );
      }
    }

    const updated = await this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        status:
          subscription.status === SubscriptionStatus.active
            ? subscription.status
            : SubscriptionStatus.canceled,
      },
    });

    await this.securityAudit.log({
      actorId: vendorId,
      action: SecurityAuditAction.SUBSCRIPTION_CANCELED,
      targetType: 'vendor_subscription',
      targetId: vendorId,
      metadata: {
        paystackSubscriptionCode: subscription.paystackSubscriptionCode,
        cancelAtPeriodEnd: true,
      },
    });

    return toVendorSubscriptionDto(user, updated);
  }

  async changePlan(
    vendorId: string,
    email: string,
    dto: SubscriptionCheckoutDto,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    return this.startCheckout(vendorId, email, dto);
  }

  async confirmCheckout(
    vendorId: string,
    reference: string,
  ): Promise<VendorSubscriptionDto> {
    if (!reference.startsWith(SUBSCRIPTION_REFERENCE_PREFIX)) {
      throw new BadRequestException('Invalid subscription reference.');
    }

    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { flutterwaveReference: reference },
    });

    if (!payment || payment.vendorId !== vendorId) {
      throw new NotFoundException('Subscription payment not found.');
    }

    if (payment.status === SubscriptionPaymentStatus.paid) {
      return this.getSubscription(vendorId);
    }

    const verification =
      await this.paystackSubscriptionService.verifySubscriptionPayment(
        reference,
      );

    if (!verification.successful) {
      throw new BadRequestException(
        'Payment not confirmed yet. Wait a moment and refresh, or try again.',
      );
    }

    if (
      verification.amountKobo === undefined ||
      !this.subscriptionAmountMatches(payment.amountKobo, verification.amountKobo)
    ) {
      await this.securityAudit.log({
        actorId: vendorId,
        action: SecurityAuditAction.SUBSCRIPTION_AMOUNT_MISMATCH,
        targetType: 'subscription_payment',
        targetId: payment.id,
        metadata: {
          reference,
          reason: 'confirm_amount_mismatch',
          expectedAmountKobo: payment.amountKobo,
          receivedAmountKobo: verification.amountKobo,
        },
      });
      throw new BadRequestException(
        'Could not verify subscription payment amount.',
      );
    }

    if (verification.currency !== undefined && verification.currency !== 'NGN') {
      throw new BadRequestException('Subscription currency must be NGN.');
    }

    await this.activateFromPayment(reference, {
      currency: verification.currency ?? 'NGN',
      amountKobo: verification.amountKobo,
    });

    await this.attachPaystackBillingDetails(reference, {
      customerCode: verification.customerCode,
      authorizationCode: verification.authorizationCode,
      subscriptionCode: verification.subscriptionCode,
      emailToken: verification.emailToken,
    });

    return this.getSubscription(vendorId);
  }

  async attachPaystackBillingDetails(
    reference: string,
    input: {
      customerCode?: string;
      authorizationCode?: string;
      subscriptionCode?: string;
      emailToken?: string;
    },
  ): Promise<void> {
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { flutterwaveReference: reference },
    });

    if (!payment) {
      return;
    }

    await this.prisma.vendorSubscription.update({
      where: { vendorId: payment.vendorId },
      data: {
        ...(input.customerCode
          ? { paystackCustomerCode: input.customerCode }
          : {}),
        ...(input.authorizationCode
          ? { paystackAuthorizationCode: input.authorizationCode }
          : {}),
        ...(input.subscriptionCode
          ? { paystackSubscriptionCode: input.subscriptionCode }
          : {}),
        ...(input.emailToken ? { paystackEmailToken: input.emailToken } : {}),
      },
    });
  }

  async syncPaystackSubscriptionRecord(input: {
    subscriptionCode: string;
    emailToken?: string;
    customerCode?: string;
    planCode?: string;
    authorizationCode?: string;
  }): Promise<void> {
    const subscription = await this.prisma.vendorSubscription.findFirst({
      where: {
        OR: [
          { paystackSubscriptionCode: input.subscriptionCode },
          { paystackCustomerCode: input.customerCode ?? '__none__' },
        ],
      },
    });

    if (!subscription) {
      return;
    }

    let planTier = subscription.planTier;
    if (input.planCode) {
      const catalogEntry = await this.prisma.planCatalogEntry.findFirst({
        where: { paystackPlanCode: input.planCode },
      });
      if (catalogEntry) {
        planTier = catalogEntry.tier;
      }
    }

    await this.prisma.vendorSubscription.update({
      where: { vendorId: subscription.vendorId },
      data: {
        paystackSubscriptionCode: input.subscriptionCode,
        paystackEmailToken: input.emailToken ?? subscription.paystackEmailToken,
        paystackCustomerCode:
          input.customerCode ?? subscription.paystackCustomerCode,
        paystackAuthorizationCode:
          input.authorizationCode ?? subscription.paystackAuthorizationCode,
        planTier,
      },
    });
  }

  async activateRenewalFromPaystack(input: {
    subscriptionCode: string;
    amountKobo: number;
    currency: string;
    reference: string;
    customerCode?: string;
    planCode?: string;
  }): Promise<void> {
    const subscription = await this.prisma.vendorSubscription.findFirst({
      where: {
        paystackSubscriptionCode: input.subscriptionCode,
      },
    });

    if (!subscription || subscription.cancelAtPeriodEnd) {
      return;
    }

    const catalogEntry = input.planCode
      ? await this.prisma.planCatalogEntry.findFirst({
          where: { paystackPlanCode: input.planCode },
        })
      : await this.prisma.planCatalogEntry.findUnique({
          where: { tier: subscription.planTier },
        });

    if (!catalogEntry) {
      return;
    }

    if (input.currency !== 'NGN') {
      await this.securityAudit.log({
        actorId: subscription.vendorId,
        action: SecurityAuditAction.SUBSCRIPTION_AMOUNT_MISMATCH,
        targetType: 'vendor_subscription',
        targetId: subscription.vendorId,
        metadata: {
          reference: input.reference,
          reason: 'renewal_currency_mismatch',
          currency: input.currency,
        },
      });
      return;
    }

    if (!this.subscriptionAmountMatches(catalogEntry.monthlyPriceKobo, input.amountKobo)) {
      await this.securityAudit.log({
        actorId: subscription.vendorId,
        action: SecurityAuditAction.SUBSCRIPTION_AMOUNT_MISMATCH,
        targetType: 'vendor_subscription',
        targetId: subscription.vendorId,
        metadata: {
          reference: input.reference,
          reason: 'renewal_amount_mismatch',
          expectedAmountKobo: catalogEntry.monthlyPriceKobo,
          receivedAmountKobo: input.amountKobo,
        },
      });
      return;
    }

    const existing = await this.prisma.subscriptionPayment.findUnique({
      where: { flutterwaveReference: input.reference },
    });
    if (existing?.status === SubscriptionPaymentStatus.paid) {
      return;
    }

    const now = new Date();
    const periodStart =
      subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
        ? subscription.currentPeriodEnd
        : now;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.upsert({
        where: { flutterwaveReference: input.reference },
        create: {
          vendorId: subscription.vendorId,
          planTier: catalogEntry.tier,
          amountKobo: catalogEntry.monthlyPriceKobo,
          flutterwaveReference: input.reference,
          status: SubscriptionPaymentStatus.paid,
          paidAt: now,
        },
        update: {
          status: SubscriptionPaymentStatus.paid,
          paidAt: now,
        },
      });

      await tx.vendorSubscription.update({
        where: { vendorId: subscription.vendorId },
        data: {
          status: SubscriptionStatus.active,
          planTier: catalogEntry.tier,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          graceEndsAt: null,
          lastPaymentAt: now,
          lastPaymentReference: input.reference,
          paystackCustomerCode: input.customerCode ?? subscription.paystackCustomerCode,
        },
      });

      await tx.user.update({
        where: { id: subscription.vendorId },
        data: { planTier: catalogEntry.tier },
      });
    });

    await this.securityAudit.log({
      actorId: subscription.vendorId,
      action: SecurityAuditAction.SUBSCRIPTION_ACTIVATED,
      targetType: 'vendor_subscription',
      targetId: subscription.vendorId,
      metadata: {
        reference: input.reference,
        renewal: true,
        planTier: catalogEntry.tier,
        amountKobo: input.amountKobo,
      },
    });
  }

  async markRenewalFailed(input: {
    subscriptionCode: string;
    reference: string;
  }): Promise<void> {
    const subscription = await this.prisma.vendorSubscription.findFirst({
      where: { paystackSubscriptionCode: input.subscriptionCode },
    });

    if (!subscription) {
      return;
    }

    await this.prisma.subscriptionPayment.upsert({
      where: { flutterwaveReference: input.reference },
      create: {
        vendorId: subscription.vendorId,
        planTier: subscription.planTier,
        amountKobo: 0,
        flutterwaveReference: input.reference,
        status: SubscriptionPaymentStatus.failed,
      },
      update: {
        status: SubscriptionPaymentStatus.failed,
      },
    });

    await this.markPaymentFailedForVendor(subscription.vendorId);
  }

  async markPaystackSubscriptionCanceled(subscriptionCode: string): Promise<void> {
    const subscription = await this.prisma.vendorSubscription.findFirst({
      where: { paystackSubscriptionCode: subscriptionCode },
    });

    if (!subscription) {
      return;
    }

    await this.prisma.vendorSubscription.update({
      where: { vendorId: subscription.vendorId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: subscription.canceledAt ?? new Date(),
        status: SubscriptionStatus.canceled,
      },
    });
  }

  private subscriptionAmountMatches(
    expectedAmountKobo: number,
    received?: number,
  ): boolean {
    if (received === undefined) {
      return false;
    }

    if (received === expectedAmountKobo) {
      return true;
    }

    const expectedNaira = expectedAmountKobo / 100;
    return flutterwaveAmountMatchesNaira(expectedNaira, received);
  }

  async activateFromPayment(
    reference: string,
    input: { amountKobo?: number; currency?: string },
    options?: { skipAmountVerification?: boolean },
  ): Promise<void> {
    if (!reference.startsWith(SUBSCRIPTION_REFERENCE_PREFIX)) {
      return;
    }

    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { flutterwaveReference: reference },
    });

    if (!payment) {
      return;
    }

    if (payment.status === SubscriptionPaymentStatus.paid) {
      return;
    }

    if (!options?.skipAmountVerification) {
      if (input.currency !== undefined && input.currency !== 'NGN') {
        this.logger.warn(
          `Subscription currency mismatch for ${reference}: ${input.currency}`,
        );
        await this.securityAudit.log({
          actorId: payment.vendorId,
          action: SecurityAuditAction.SUBSCRIPTION_AMOUNT_MISMATCH,
          targetType: 'subscription_payment',
          targetId: payment.id,
          metadata: {
            reference,
            reason: 'currency_mismatch',
            currency: input.currency,
          },
        });
        return;
      }

      if (
        input.amountKobo === undefined ||
        !this.subscriptionAmountMatches(payment.amountKobo, input.amountKobo)
      ) {
        this.logger.warn(
          `Subscription amount mismatch for ${reference}: expected ${payment.amountKobo} kobo, got ${input.amountKobo ?? 'missing'}`,
        );
        await this.securityAudit.log({
          actorId: payment.vendorId,
          action: SecurityAuditAction.SUBSCRIPTION_AMOUNT_MISMATCH,
          targetType: 'subscription_payment',
          targetId: payment.id,
          metadata: {
            reference,
            reason: 'amount_mismatch',
            expectedAmountKobo: payment.amountKobo,
            receivedAmount: input.amountKobo,
          },
        });
        return;
      }
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: SubscriptionPaymentStatus.paid,
          paidAt: now,
        },
      });

      await tx.vendorSubscription.upsert({
        where: { vendorId: payment.vendorId },
        create: {
          vendorId: payment.vendorId,
          status: SubscriptionStatus.active,
          planTier: payment.planTier,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          graceEndsAt: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          lastPaymentAt: now,
          lastPaymentReference: reference,
        },
        update: {
          status: SubscriptionStatus.active,
          planTier: payment.planTier,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          graceEndsAt: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          lastPaymentAt: now,
          lastPaymentReference: reference,
        },
      });

      await tx.user.update({
        where: { id: payment.vendorId },
        data: { planTier: payment.planTier },
      });
    });

    await this.securityAudit.log({
      actorId: payment.vendorId,
      action: SecurityAuditAction.SUBSCRIPTION_ACTIVATED,
      targetType: 'subscription_payment',
      targetId: payment.id,
      metadata: {
        reference,
        planTier: payment.planTier,
        amountKobo: payment.amountKobo,
      },
    });
  }

  async markPaymentFailed(reference: string): Promise<void> {
    if (!reference.startsWith(SUBSCRIPTION_REFERENCE_PREFIX)) {
      return;
    }

    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { flutterwaveReference: reference },
    });

    if (!payment) {
      return;
    }

    await this.prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: SubscriptionPaymentStatus.failed },
    });

    await this.markPaymentFailedForVendor(payment.vendorId);
  }

  private async markPaymentFailedForVendor(vendorId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: vendorId },
    });

    const graceEndsAt = new Date();
    graceEndsAt.setDate(graceEndsAt.getDate() + this.graceDays);

    await this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        status: SubscriptionStatus.grace,
        graceEndsAt,
      },
    });

    if (user?.email) {
      await this.emailService.sendEmail(
        user.email,
        'CatalogHQ subscription payment failed',
        `<p>Your CatalogHQ subscription payment failed. You have ${this.graceDays} days to renew before your store is paused.</p>`,
      );
    }
  }

  async expireGracePeriodSubscriptions(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.vendorSubscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.grace, SubscriptionStatus.past_due] },
        graceEndsAt: { lt: now },
      },
      include: { vendor: true },
    });

    for (const subscription of expired) {
      await this.prisma.vendorSubscription.update({
        where: { vendorId: subscription.vendorId },
        data: { status: SubscriptionStatus.expired },
      });

      if (subscription.vendor.email) {
        await this.emailService.sendEmail(
          subscription.vendor.email,
          'CatalogHQ store paused',
          '<p>Your CatalogHQ subscription grace period has ended. Renew your plan to reopen your store.</p>',
        );
      }
    }

    return expired.length;
  }

  async sendGraceReminders(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(23, 59, 59, 999);

    const reminders = await this.prisma.vendorSubscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.grace, SubscriptionStatus.past_due] },
        graceEndsAt: { gte: start, lte: end },
      },
      include: { vendor: true },
    });

    for (const subscription of reminders) {
      if (subscription.vendor.email) {
        await this.emailService.sendEmail(
          subscription.vendor.email,
          'CatalogHQ subscription expires tomorrow',
          '<p>Your CatalogHQ subscription grace period ends tomorrow. Renew now to avoid your store being paused.</p>',
        );
      }
    }

    return reminders.length;
  }

  isSubscriptionReference(reference: string | undefined): boolean {
    return Boolean(reference?.startsWith(SUBSCRIPTION_REFERENCE_PREFIX));
  }
}
