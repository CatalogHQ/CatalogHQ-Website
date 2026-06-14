import type { CustomerOrder } from "@/types/orders";

const REVIEWABLE_STATUSES = new Set([
  "paid",
  "confirmed",
  "shipped",
  "delivered",
]);

export function canCustomerReviewOrder(order: CustomerOrder): boolean {
  return (
    order.paymentStatus === "paid" &&
    REVIEWABLE_STATUSES.has(order.status)
  );
}

export type CreateReviewInput = {
  buyerName: string;
  customerPhone: string;
  rating: number;
  comment: string;
};

export type OrderReviewStatus = {
  canReview: boolean;
  alreadyReviewed: boolean;
  review?: {
    id: string;
    buyerName: string;
    rating: number;
    comment: string;
    productName?: string;
    verified: boolean;
    createdAt: string;
  };
};
