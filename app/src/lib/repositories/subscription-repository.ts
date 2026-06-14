import type {
  SubscriptionCheckoutInput,
  SubscriptionCheckoutResult,
  SubscriptionPayment,
  VendorSubscription,
} from "@/types/subscription";

export type SubscriptionRepository = {
  getSubscription(): Promise<VendorSubscription>;
  listPayments(): Promise<SubscriptionPayment[]>;
  checkout(input: SubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult>;
  cancel(): Promise<VendorSubscription>;
  changePlan(input: SubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult>;
};
