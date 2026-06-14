import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  PlanTier,
  SubscriptionStatus,
  User,
  VendorSubscription,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hasPlanFeature } from './plan-features';

export type VendorAccessState = {
  user: User;
  subscription: VendorSubscription | null;
  subscriptionExempt: boolean;
  effectiveTier: PlanTier | null;
  hasActiveAccess: boolean;
  isHardBlocked: boolean;
};

@Injectable()
export class PlanEntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccessState(vendorId: string): Promise<VendorAccessState> {
    const user = await this.prisma.user.findUnique({
      where: { id: vendorId },
      include: { subscription: true },
    });

    if (!user) {
      throw new ForbiddenException('Account not found.');
    }

    const subscription = user.subscription;
    const subscriptionExempt = user.subscriptionExempt;
    const hasActiveAccess = this.hasActiveAccess(subscription, subscriptionExempt);
    const isHardBlocked = this.isHardBlocked(subscription, subscriptionExempt);
    const effectiveTier =
      hasActiveAccess || subscriptionExempt ? user.planTier : null;

    return {
      user,
      subscription,
      subscriptionExempt,
      effectiveTier,
      hasActiveAccess: hasActiveAccess || subscriptionExempt,
      isHardBlocked: isHardBlocked && !subscriptionExempt,
    };
  }

  hasActiveAccess(
    subscription: VendorSubscription | null,
    subscriptionExempt: boolean,
  ): boolean {
    if (subscriptionExempt) {
      return true;
    }

    if (!subscription) {
      return false;
    }

    return (
      subscription.status === SubscriptionStatus.active ||
      subscription.status === SubscriptionStatus.grace ||
      subscription.status === SubscriptionStatus.past_due
    );
  }

  isHardBlocked(
    subscription: VendorSubscription | null,
    subscriptionExempt: boolean,
  ): boolean {
    if (subscriptionExempt) {
      return false;
    }

    if (!subscription) {
      return true;
    }

    if (subscription.status === SubscriptionStatus.expired) {
      return true;
    }

    if (
      subscription.status === SubscriptionStatus.grace ||
      subscription.status === SubscriptionStatus.past_due
    ) {
      if (subscription.graceEndsAt && subscription.graceEndsAt < new Date()) {
        return true;
      }
    }

    if (subscription.status === SubscriptionStatus.pending) {
      return true;
    }

    if (
      subscription.status === SubscriptionStatus.canceled &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd < new Date()
    ) {
      return true;
    }

    return false;
  }

  async getEffectiveTier(vendorId: string): Promise<PlanTier | null> {
    const state = await this.getAccessState(vendorId);
    return state.effectiveTier;
  }

  async hasFeature(vendorId: string, featureId: string): Promise<boolean> {
    const state = await this.getAccessState(vendorId);
    if (!state.hasActiveAccess || !state.effectiveTier) {
      return false;
    }
    return hasPlanFeature(state.effectiveTier, featureId);
  }

  async assertFeature(vendorId: string, featureId: string): Promise<void> {
    await this.assertActiveSubscription(vendorId);

    const allowed = await this.hasFeature(vendorId, featureId);
    if (!allowed) {
      throw new ForbiddenException(
        'This feature is not included in your current plan. Upgrade to unlock it.',
      );
    }
  }

  async assertActiveSubscription(vendorId: string): Promise<void> {
    const state = await this.getAccessState(vendorId);

    if (state.isHardBlocked) {
      throw new HttpException(
        {
          message:
            'Your subscription has expired. Renew your plan to continue using CatalogHQ.',
          code: 'SUBSCRIPTION_EXPIRED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (!state.hasActiveAccess) {
      throw new HttpException(
        {
          message: 'Subscribe to a plan to access this feature.',
          code: 'SUBSCRIPTION_REQUIRED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async isStorePubliclyAvailable(vendorId: string): Promise<boolean> {
    const state = await this.getAccessState(vendorId);
    return state.hasActiveAccess && !state.isHardBlocked;
  }
}
