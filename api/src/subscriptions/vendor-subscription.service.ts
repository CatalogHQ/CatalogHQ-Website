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
import { normalizeFlutterwaveAmountToNaira } from '../payments/flutterwave-amount.util';
import { SecurityAuditService } from '../security/security-audit.service';
import { FlutterwaveSubscriptionService } from './flutterwave-subscription.service';
import { SubscriptionCheckoutDto } from './dto/subscription-checkout.dto';
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
    private readonly flutterwaveSubscriptionService: FlutterwaveSubscriptionService,
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
      await this.flutterwaveSubscriptionService.createSubscriptionCheckout({
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
        flutterwaveSubscriptionId: checkout.flutterwaveSubscriptionId,
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

    if (user.subscription.flutterwaveSubscriptionId) {
      await this.flutterwaveSubscriptionService.cancelSubscription(
        user.subscription.flutterwaveSubscriptionId,
      );
    }

    const updated = await this.prisma.vendorSubscription.update({
      where: { vendorId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
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
      await this.flutterwaveSubscriptionService.verifySubscriptionPayment(
        reference,
      );

    if (!verification.successful) {
      throw new BadRequestException(
        'Payment not confirmed yet. Wait a moment and refresh, or try again.',
      );
    }

    const expectedNaira = payment.amountKobo / 100;
    const verifiedAmountNaira = normalizeFlutterwaveAmountToNaira(
      verification.amountNaira,
      expectedNaira,
    );

    if (verifiedAmountNaira === undefined) {
      throw new BadRequestException(
        'Could not verify subscription payment amount.',
      );
    }

    await this.activateFromPayment(reference, {
      currency: verification.currency ?? 'NGN',
      amountKobo: Math.round(verifiedAmountNaira * 100),
    });

    return this.getSubscription(vendorId);
  }

  private subscriptionAmountMatches(
    expectedAmountKobo: number,
    received?: number,
  ): boolean {
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
      include: { vendor: { include: { subscription: true } } },
    });

    if (!payment) {
      return;
    }

    await this.prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: SubscriptionPaymentStatus.failed },
    });

    const graceEndsAt = new Date();
    graceEndsAt.setDate(graceEndsAt.getDate() + this.graceDays);

    await this.prisma.vendorSubscription.update({
      where: { vendorId: payment.vendorId },
      data: {
        status: SubscriptionStatus.grace,
        graceEndsAt,
      },
    });

    const user = payment.vendor;
    if (user.email) {
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
