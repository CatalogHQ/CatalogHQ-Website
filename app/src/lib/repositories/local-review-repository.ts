import { readJson, writeJson } from "@/lib/local-storage";
import type { Store } from "@/types/domain";
import type { StoreRatingSummary, StoreReview } from "@/types/reviews";

const REVIEWS_KEY = "cataloghq:reviews";

function generateId(): string {
  return crypto.randomUUID();
}

function seedReviewsForStore(store: Store): StoreReview[] {
  const now = Date.now();
  return [
    {
      id: generateId(),
      storeId: store.vendorId,
      buyerName: "Chioma A.",
      rating: 5,
      comment:
        "Ordered a gown and it arrived exactly as pictured. Delivery was fast and the seller kept me updated on WhatsApp.",
      productName: "Ankara set",
      verified: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
    },
    {
      id: generateId(),
      storeId: store.vendorId,
      buyerName: "Tunde O.",
      rating: 5,
      comment:
        "Very professional store. Payment was smooth and the item quality matched the photos on the storefront.",
      verified: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 11).toISOString(),
    },
    {
      id: generateId(),
      storeId: store.vendorId,
      buyerName: "Blessing E.",
      rating: 4,
      comment:
        "Great experience overall. Sizing was accurate and the seller responded quickly when I had a question.",
      productName: "Office wear",
      verified: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 18).toISOString(),
    },
    {
      id: generateId(),
      storeId: store.vendorId,
      buyerName: "Amina K.",
      rating: 5,
      comment:
        "I feel confident buying from this store. Everything felt legit and the order process was simple.",
      verified: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 26).toISOString(),
    },
  ];
}

export class LocalReviewRepository {
  private getReviews(): StoreReview[] {
    return readJson<StoreReview[]>(REVIEWS_KEY, []);
  }

  private saveReviews(reviews: StoreReview[]): void {
    writeJson(REVIEWS_KEY, reviews);
  }

  private ensureReviews(store: Store): StoreReview[] {
    const existing = this.getReviews().filter(
      (review) => review.storeId === store.vendorId,
    );
    if (existing.length > 0) return existing;

    const seeded = seedReviewsForStore(store);
    this.saveReviews([...this.getReviews(), ...seeded]);
    return seeded;
  }

  async listByStore(store: Store): Promise<StoreReview[]> {
    const reviews = this.ensureReviews(store);
    return reviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getSummary(store: Store): Promise<StoreRatingSummary> {
    const reviews = this.ensureReviews(store);
    const verified = reviews.filter((review) => review.verified);
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      verifiedCount: verified.length,
    };
  }
}

export const reviewRepository = new LocalReviewRepository();
