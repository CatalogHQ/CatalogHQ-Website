import { useState } from "react";
import { Link } from "react-router";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  MapPin,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/storefront/StarRating";
import StoreContactLinks from "@/components/storefront/StoreContactLinks";
import { usePublicReviews } from "@/hooks/use-public-reviews";
import { hasFeature } from "@/data/plans";
import { buildStoreShareMessage, shareToWhatsAppStatus } from "@/lib/whatsapp-share";
import { cn } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";
import type { PublicStoreView } from "@/types/domain";

type StorefrontHeaderProps = {
  store: PublicStoreView;
};

export default function StorefrontHeader({ store }: StorefrontHeaderProps) {
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const locationLabel = [store.city, store.state].filter(Boolean).join(", ");
  const { summary } = usePublicReviews(store);
  const reviewsUrl = `/s/${store.slug}/reviews`;
  const isVerified = store.verificationStatus === "verified";

  const handleShareStore = () => {
    const storeUrl = `${window.location.origin}/s/${store.slug}`;
    shareToWhatsAppStatus(
      buildStoreShareMessage({
        storeName: store.businessName,
        storeUrl,
        bio: store.bio,
      }),
    );
  };

  return (
    <header className="border-b bg-gradient-to-br from-white via-white to-whatsapp-green/5">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {/* Store identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-whatsapp-green to-whatsapp-dark text-xl font-bold text-white shadow-md sm:h-16 sm:w-16 sm:rounded-2xl sm:text-2xl">
                    {store.businessName.charAt(0).toUpperCase()}
                  </div>
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
                      <BadgeCheck className="h-4 w-4 text-whatsapp-green sm:h-5 sm:w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <h1 className="text-lg font-bold leading-tight text-gray-900 sm:text-2xl">
                          {store.businessName}
                        </h1>
                        {isVerified && (
                          <Badge className="bg-whatsapp-green/10 text-[11px] text-whatsapp-dark hover:bg-whatsapp-green/10 sm:text-xs">
                            Verified vendor
                          </Badge>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
                      onClick={() => setMobileInfoOpen((open) => !open)}
                      aria-expanded={mobileInfoOpen}
                      aria-label={
                        mobileInfoOpen ? "Hide store info" : "Show store info"
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 transition-transform duration-200",
                          mobileInfoOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "mt-3 space-y-2 md:mt-2 md:block",
                  mobileInfoOpen ? "block" : "hidden md:block",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {store.category && (
                    <Badge variant="outline" className="text-[11px] sm:text-xs">
                      {store.category}
                    </Badge>
                  )}
                  {locationLabel && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 sm:text-xs">
                      <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                      {locationLabel}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-gray-600">
                  {sanitizeText(store.bio)}
                </p>

                <StoreContactLinks
                  whatsapp={store.whatsapp}
                  businessName={store.businessName}
                  instagramHandle={store.instagramHandle}
                  tiktokHandle={store.tiktokHandle}
                  facebookHandle={store.facebookHandle}
                  xHandle={store.xHandle}
                />
              </div>
            </div>

            {/* Ratings — collapsible on mobile, side panel on desktop */}
            <div
              className={cn(
                "w-full shrink-0 rounded-xl border border-gray-100 bg-gray-50/90 p-3 sm:p-4 lg:w-56 lg:block xl:w-64",
                mobileInfoOpen ? "block" : "hidden md:block",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                Customer rating
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StarRating rating={summary.averageRating} showValue size="sm" />
                <span className="text-xs text-gray-500 sm:text-sm">
                  · {summary.totalReviews} verified review
                  {summary.totalReviews === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <Link
                  to={reviewsUrl}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-whatsapp-dark transition-colors hover:border-whatsapp-green/40 hover:bg-whatsapp-green/5 hover:text-whatsapp-green sm:text-sm"
                >
                  View verified reviews
                  <ChevronRight className="h-4 w-4" />
                </Link>
                {hasFeature(store.planTier, "whatsapp-share") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleShareStore}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share store on WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
