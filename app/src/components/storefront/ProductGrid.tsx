import { Link } from "react-router";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductSizeBadges } from "@/components/storefront/ProductSizeDisplay";
import { formatNaira } from "@/lib/format";
import { customerUnitDisplayPrice } from "@/lib/flutterwave-fees";
import { getProductPrimaryImage } from "@/lib/product-utils";
import type { Product } from "@/types/domain";

type ProductGridProps = {
  products: Product[];
  storeSlug: string;
};

export default function ProductGrid({ products, storeSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-8 text-center sm:rounded-2xl sm:p-10">
        <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-4 text-base font-medium text-gray-900 sm:text-lg">
          No products yet
        </p>
        <p className="mt-1 text-sm text-gray-500">
          This store is setting up its catalog. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {products.map((product) => {
        const primaryImage = getProductPrimaryImage(product);

        return (
          <Card
            key={product.id}
            className="overflow-hidden border-gray-200 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="aspect-[4/5] bg-gray-100 sm:aspect-square">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <ShoppingBag className="h-10 w-10" />
                </div>
              )}
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                  {product.name}
                </h3>
                {product.stock <= 0 && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                    Sold out
                  </Badge>
                )}
              </div>
              {product.colors?.length > 0 && (
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                  {product.colors.join(" · ")}
                </p>
              )}
              <ProductSizeBadges
                sizingType={product.sizingType}
                sizes={product.sizes}
              />
              <p className="mt-2 text-base font-bold text-whatsapp-dark sm:text-lg">
                {formatNaira(customerUnitDisplayPrice(product.price))}
              </p>
              <Button
                asChild
                size="sm"
                className="mt-3 h-9 w-full bg-whatsapp-green hover:bg-whatsapp-green/90 sm:h-10"
              >
                <Link to={`/s/${storeSlug}/p/${product.id}`}>View</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
