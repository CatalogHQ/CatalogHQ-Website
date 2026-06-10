import { apiClient } from "@/lib/api-client";
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
}

export const apiReviewRepository = new ApiReviewRepository();
