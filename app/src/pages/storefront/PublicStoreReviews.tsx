import { Link, useParams } from "react-router";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import StarRating from "@/components/storefront/StarRating";
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { usePublicStore } from "@/hooks/use-public-store";
import { usePublicReviews } from "@/hooks/use-public-reviews";

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function PublicStoreReviews() {
  const { slug = "" } = useParams();
  const { store, isLoading: storeLoading } = usePublicStore(slug);
  const { reviews, summary, isLoading: reviewsLoading } = usePublicReviews(store);

  if (storeLoading || reviewsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Store not found
        </h1>
        <Button asChild className="mt-6">
          <Link to="/">Go to CatalogHQ</Link>
        </Button>
      </div>
    );
  }

  return (
    <StorefrontLayout store={store}>
      <Button
        asChild
        variant="ghost"
        className="mb-3 h-9 px-2 text-sm sm:mb-4 sm:h-10"
      >
        <Link to={`/s/${store.slug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to store
        </Link>
      </Button>

      <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
        <div className="rounded-xl border bg-white p-4 sm:rounded-2xl sm:p-6">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">
            Verified reviews
          </p>
          <h2 className="mt-1 text-lg font-bold leading-snug text-gray-900 sm:text-2xl">
            What customers say about {store.businessName}
          </h2>
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <StarRating rating={summary.averageRating} showValue size="md" />
            <span className="text-xs text-gray-600 sm:text-sm">
              {summary.verifiedCount} verified purchase
              {summary.verifiedCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 sm:mt-3 sm:text-sm">
            Only reviews from confirmed CatalogHQ orders are shown here.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{review.buyerName}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatReviewDate(review.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <StarRating rating={review.rating} size="sm" />
                  {review.verified && (
                    <Badge className="gap-1 bg-whatsapp-green/10 text-[10px] text-whatsapp-dark hover:bg-whatsapp-green/10 sm:text-xs">
                      <BadgeCheck className="h-3 w-3" />
                      Verified purchase
                    </Badge>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-gray-700 sm:mt-4">
                {review.comment}
              </p>

              {review.productName && (
                <p className="mt-2 text-xs text-gray-500 sm:mt-3">
                  Purchased: {review.productName}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </StorefrontLayout>
  );
}
