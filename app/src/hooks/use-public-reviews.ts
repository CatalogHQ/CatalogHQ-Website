import { useEffect, useState } from "react";
import { reviewRepository } from "@/lib/repositories";
import type { Store } from "@/types/domain";
import type { StoreRatingSummary, StoreReview } from "@/types/reviews";

export function usePublicReviews(store: Store | null) {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [summary, setSummary] = useState<StoreRatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    verifiedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!store) {
        setReviews([]);
        setSummary({ averageRating: 0, totalReviews: 0, verifiedCount: 0 });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [nextReviews, nextSummary] = await Promise.all([
          reviewRepository.listByStore(store),
          reviewRepository.getSummary(store),
        ]);
        if (!cancelled) {
          setReviews(nextReviews);
          setSummary(nextSummary);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
          setSummary({ averageRating: 0, totalReviews: 0, verifiedCount: 0 });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  return { reviews, summary, isLoading };
}
