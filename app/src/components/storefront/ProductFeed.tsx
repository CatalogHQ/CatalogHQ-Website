import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  BadgeCheck,
  ChevronDown,
  Search,
  Share2,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/format";
import { customerUnitDisplayPrice } from "@/lib/flutterwave-fees";
import { getProductPrimaryImage } from "@/lib/product-utils";
import { searchProducts } from "@/lib/product-search";
import { usePublicReviews } from "@/hooks/use-public-reviews";
import { hasFeature } from "@/data/plans";
import {
  buildProductShareMessage,
  shareToWhatsAppStatus,
} from "@/lib/whatsapp-share";
import { getProductLowStockThreshold, type Product, type PublicStoreView } from "@/types/domain";

type ProductFeedProps = {
  products: Product[];
  store: PublicStoreView;
};

export default function ProductFeed({ products, store }: ProductFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { summary } = usePublicReviews(store);
  const isVerified = store.verificationStatus === "verified";
  const canShare = hasFeature(store.planTier, "whatsapp-share");

  const filteredProducts = useMemo(
    () => searchProducts(products, searchQuery),
    [products, searchQuery],
  );

  const updateSearchQuery = (value: string) => {
    setSearchQuery(value);
    requestAnimationFrame(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  if (products.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-gray-950 px-6 text-center text-white">
        <ShoppingBag className="h-12 w-12 text-white/40" />
        <p className="mt-4 text-lg font-semibold">No products yet</p>
        <p className="mt-1 text-sm text-white/60">
          This store is setting up its catalog. Check back soon.
        </p>
      </div>
    );
  }

  const clearSearch = () => {
    updateSearchQuery("");
    setSearchOpen(false);
  };

  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <div className="relative h-dvh w-full bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-4">
        <div className="pointer-events-auto mx-auto w-full max-w-lg space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-whatsapp-green to-whatsapp-dark text-sm font-bold text-white">
                {store.businessName.charAt(0).toUpperCase()}
                {isVerified && (
                  <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-gray-950 text-whatsapp-green" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {store.businessName}
                </p>
                <p className="text-xs text-white/70">
                  {hasActiveSearch
                    ? `${filteredProducts.length} result${filteredProducts.length === 1 ? "" : "s"}`
                    : "Swipe to browse"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!searchOpen && !hasActiveSearch && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label="Search products"
                  onClick={() => setSearchOpen(true)}
                  className="h-8 w-8 border-0 bg-white/15 text-white backdrop-blur hover:bg-white/25"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              <Button
                asChild
                size="sm"
                variant="secondary"
                className="h-8 border-0 bg-white/15 text-xs text-white backdrop-blur hover:bg-white/25"
              >
                <Link to={`/s/${store.slug}/reviews`}>
                  <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                  {summary.averageRating.toFixed(1)}
                </Link>
              </Button>
            </div>
          </div>

          {(searchOpen || hasActiveSearch) && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => updateSearchQuery(event.target.value)}
                placeholder="Search products, colors, sizes..."
                className="h-10 border-white/20 bg-black/40 pl-9 pr-10 text-base text-white placeholder:text-white/50 backdrop-blur focus-visible:border-whatsapp-green focus-visible:ring-whatsapp-green/30"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex h-dvh flex-col items-center justify-center bg-gray-950 px-6 pt-24 text-center text-white">
          <Search className="h-10 w-10 text-white/30" />
          <p className="mt-4 text-lg font-semibold">No products found</p>
          <p className="mt-1 max-w-xs text-sm text-white/60">
            Try a different search for &quot;{searchQuery.trim()}&quot;
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 bg-white/15 text-white hover:bg-white/25"
            onClick={clearSearch}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <div
            ref={feedRef}
            className="h-dvh snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {filteredProducts.map((product, index) => {
              const primaryImage = getProductPrimaryImage(product);
              const isLast = index === filteredProducts.length - 1;
              const soldOut = product.stock <= 0;
              const lowStock =
                !soldOut &&
                product.stock <= getProductLowStockThreshold(product);

              return (
                <section
                  key={product.id}
                  className="relative h-dvh w-full shrink-0 snap-start snap-always"
                >
                  <div className="relative mx-auto h-dvh w-full max-w-lg">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <ShoppingBag className="h-16 w-16 text-white/20" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />

                    {soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <Badge
                          variant="secondary"
                          className="px-4 py-1.5 text-sm font-semibold"
                        >
                          Sold out
                        </Badge>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:p-5 sm:pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
                      <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                            {index + 1} / {filteredProducts.length}
                          </p>
                          <h2 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">
                            {product.name}
                          </h2>
                          <p className="mt-2 text-2xl font-bold text-whatsapp-green sm:text-3xl">
                            {formatNaira(customerUnitDisplayPrice(product.price))}
                          </p>
                          <p className="mt-0.5 text-xs text-white/60">
                            incl. payment processing
                          </p>
                          {product.colors.length > 0 && (
                            <p className="mt-2 line-clamp-1 text-sm text-white/75">
                              {product.colors.join(" · ")}
                            </p>
                          )}
                          {!soldOut && (
                            <p className="mt-1 text-xs text-white/60">
                              {lowStock
                                ? `Only ${product.stock} left`
                                : `${product.stock} available`}
                            </p>
                          )}
                        </div>

                        {!isLast && (
                          <div className="flex shrink-0 flex-col items-center gap-1 pb-2 text-white/80">
                            <ChevronDown className="h-6 w-6 animate-bounce" />
                            <span className="text-[10px] font-medium uppercase tracking-wide">
                              Next
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          asChild
                          size="lg"
                          disabled={soldOut}
                          className="h-12 flex-1 bg-whatsapp-green text-base hover:bg-whatsapp-green/90 disabled:opacity-60"
                        >
                          <Link to={`/s/${store.slug}/p/${product.id}`}>
                            {soldOut ? "Sold out" : "Shop now"}
                          </Link>
                        </Button>
                        {canShare && !soldOut && (
                          <Button
                            type="button"
                            size="lg"
                            variant="secondary"
                            className="h-12 shrink-0 bg-white/15 text-white hover:bg-white/25"
                            onClick={() => {
                              const productUrl = `${window.location.origin}/s/${store.slug}/p/${product.id}`;
                              shareToWhatsAppStatus(
                                buildProductShareMessage({
                                  productName: product.name,
                                  price: product.price,
                                  storeName: store.businessName,
                                  productUrl,
                                }),
                              );
                            }}
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
