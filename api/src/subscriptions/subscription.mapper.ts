import {
  PlanTier,
  SubscriptionPayment,
  SubscriptionStatus,
  User,
  VendorSubscription,
} from '@prisma/client';

export type VendorSubscriptionDto = {
  status: SubscriptionStatus;
  planTier: PlanTier;
  subscriptionExempt: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  graceEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  lastPaymentAt?: string;
  isHardBlocked: boolean;
  hasActiveAccess: boolean;
};

export type SubscriptionPaymentDto = {
  id: string;
  planTier: PlanTier;
  amountKobo: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
};

export function toVendorSubscriptionDto(
  user: User,
  subscription: VendorSubscription,
): VendorSubscriptionDto {
  const now = new Date();
  const isHardBlocked =
    !user.subscriptionExempt &&
    (subscription.status === SubscriptionStatus.expired ||
      subscription.status === SubscriptionStatus.pending ||
      ((subscription.status === SubscriptionStatus.grace ||
        subscription.status === SubscriptionStatus.past_due) &&
        subscription.graceEndsAt !== null &&
        subscription.graceEndsAt < now) ||
      (subscription.status === SubscriptionStatus.canceled &&
        subscription.currentPeriodEnd !== null &&
        subscription.currentPeriodEnd < now));

  const hasActiveAccess =
    user.subscriptionExempt ||
    subscription.status === SubscriptionStatus.active ||
    subscription.status === SubscriptionStatus.grace ||
    subscription.status === SubscriptionStatus.past_due;

  return {
    status: subscription.status,
    planTier: subscription.planTier,
    subscriptionExempt: user.subscriptionExempt,
    currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
    graceEndsAt: subscription.graceEndsAt?.toISOString(),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt?.toISOString(),
    lastPaymentAt: subscription.lastPaymentAt?.toISOString(),
    isHardBlocked,
    hasActiveAccess,
  };
}

export function toSubscriptionPaymentDto(
  payment: SubscriptionPayment,
): SubscriptionPaymentDto {
  return {
    id: payment.id,
    planTier: payment.planTier,
    amountKobo: payment.amountKobo,
    currency: payment.currency,
    status: payment.status,
    paidAt: payment.paidAt?.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}
