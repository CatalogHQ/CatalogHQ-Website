import { apiClient } from "@/lib/api-client";
import type { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import type {
  SubscriptionCheckoutInput,
  SubscriptionCheckoutResult,
  SubscriptionPayment,
  VendorSubscription,
} from "@/types/subscription";

export class ApiSubscriptionRepository implements SubscriptionRepository {
  getSubscription(): Promise<VendorSubscription> {
    return apiClient<VendorSubscription>("/subscriptions/me");
  }

  listPayments(): Promise<SubscriptionPayment[]> {
    return apiClient<SubscriptionPayment[]>("/subscriptions/payments");
  }

  checkout(input: SubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult> {
    return apiClient<SubscriptionCheckoutResult>("/subscriptions/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  confirm(reference: string): Promise<VendorSubscription> {
    return apiClient<VendorSubscription>("/subscriptions/confirm", {
      method: "POST",
      body: JSON.stringify({ reference }),
    });
  }

  cancel(): Promise<VendorSubscription> {
    return apiClient<VendorSubscription>("/subscriptions/cancel", {
      method: "POST",
    });
  }

  changePlan(
    input: SubscriptionCheckoutInput,
  ): Promise<SubscriptionCheckoutResult> {
    return apiClient<SubscriptionCheckoutResult>("/subscriptions/change-plan", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export const apiSubscriptionRepository = new ApiSubscriptionRepository();
