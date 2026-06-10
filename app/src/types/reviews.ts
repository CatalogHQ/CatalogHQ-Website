export type StoreReview = {
  id: string;
  storeId: string;
  buyerName: string;
  rating: number;
  comment: string;
  productName?: string;
  verified: boolean;
  createdAt: string;
};

export type StoreRatingSummary = {
  averageRating: number;
  totalReviews: number;
  verifiedCount: number;
};
