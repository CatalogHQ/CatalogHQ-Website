import { Review } from '@prisma/client';

export type ReviewDto = {
  id: string;
  storeId: string;
  buyerName: string;
  rating: number;
  comment: string;
  productName?: string;
  verified: boolean;
  createdAt: string;
};

export type ReviewSummaryDto = {
  averageRating: number;
  totalReviews: number;
  verifiedCount: number;
};

export type OrderReviewStatusDto = {
  canReview: boolean;
  alreadyReviewed: boolean;
  review?: ReviewDto;
};

export function toReviewDto(review: Review): ReviewDto {
  return {
    id: review.id,
    storeId: review.storeId,
    buyerName: review.buyerName,
    rating: review.rating,
    comment: review.comment,
    productName: review.productName ?? undefined,
    verified: review.verified,
    createdAt: review.createdAt.toISOString(),
  };
}
