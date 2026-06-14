import { apiClient } from "@/lib/api-client";
import type { CreateReviewInput, OrderReviewStatus } from "@/lib/order-review";
import type { Store } from "@/types/domain";
import type { StoreRatingSummary, StoreReview } from "@/types/reviews";

export class ApiReviewRepository {
  async listByStore(store: Store): Promise<StoreReview[]> {
    return apiClient<StoreReview[]>(
      `/stores/public/${encodeURIComponent(store.slug)}/reviews`,
    );
  }

  async getSummary(store: Store): Promise<StoreRatingSummary> {
    return apiClient<StoreRatingSummary>(
      `/stores/public/${encodeURIComponent(store.slug)}/reviews/summary`,
    );
  }

  async getOrderReviewStatus(paymentRef: string): Promise<OrderReviewStatus> {
    return apiClient<OrderReviewStatus>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/reviews`,
    );
  }

  async submitOrderReview(
    paymentRef: string,
    input: CreateReviewInput,
  ): Promise<StoreReview> {
    return apiClient<StoreReview>(
      `/orders/ref/${encodeURIComponent(paymentRef)}/reviews`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  }
}

export const apiReviewRepository = new ApiReviewRepository();
