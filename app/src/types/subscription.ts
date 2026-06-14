import type { PlanTier } from "@/data/plans";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "grace"
  | "expired"
  | "canceled";

export type VendorSubscription = {
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

export type SubscriptionPayment = {
  id: string;
  planTier: PlanTier;
  amountKobo: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
};

export type SubscriptionCheckoutInput = {
  planTier: PlanTier;
};

export type SubscriptionCheckoutResult = {
  authorizationUrl: string;
  reference: string;
};
