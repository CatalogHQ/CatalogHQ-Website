import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ProductFeed from "@/components/storefront/ProductFeed";
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { usePublicStore } from "@/hooks/use-public-store";
import { usePublicProducts } from "@/hooks/use-public-products";

export default function PublicStore() {
  const { slug = "" } = useParams();
  const { store, isLoading: storeLoading } = usePublicStore(slug);
  const { products, isLoading: productsLoading } = usePublicProducts(
    slug,
    store?.planTier ?? "starter",
  );

  if (storeLoading || productsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Store not found</h1>
        <p className="mt-2 max-w-md text-gray-600">
          This store link does not exist or has not finished setup yet.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go to CatalogHQ</Link>
        </Button>
      </div>
    );
  }

  return (
    <StorefrontLayout store={store} immersive>
      <ProductFeed products={products} store={store} />
    </StorefrontLayout>
  );
}
