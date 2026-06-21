import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Share2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FlutterwaveCheckout from "@/components/storefront/FlutterwaveCheckout";
import ProductOrderOptions from "@/components/storefront/ProductOrderOptions";
import {
  getDeliveryFee,
  getInitialOrderSelection,
  isOrderSelectionValid,
  resolveOrderSelection,
  type ProductOrderSelection,
} from "@/lib/product-order-selection";
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { Spinner } from "@/components/ui/spinner";
import { usePublicStore } from "@/hooks/use-public-store";
import {
  buildOrderWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/order-message";
import { formatNaira, normalizePhoneForWhatsApp } from "@/lib/format";
import { sanitizeText } from "@/lib/sanitize";
import ProductImageSwipeGallery from "@/components/storefront/ProductImageSwipeGallery";
import { getProductImages } from "@/lib/product-utils";
import { orderRepository, productRepository } from "@/lib/repositories";
import { hasFeature } from "@/data/plans";
import {
  buildProductShareMessage,
  shareToWhatsAppStatus,
} from "@/lib/whatsapp-share";
import type { Product } from "@/types/domain";
import type { CustomerOrder } from "@/types/orders";

export default function PublicProduct() {
  const { slug = "", productId = "" } = useParams();
  const { store, isLoading: storeLoading } = usePublicStore(slug);
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selection, setSelection] = useState<ProductOrderSelection>({
    quantity: 1,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!store) {
        setProduct(null);
        setProductLoading(false);
        return;
      }

      setProductLoading(true);
      try {
        const loaded = await productRepository.getPublishedBySlug(
          slug,
          productId,
        );
        if (!cancelled) {
          setProduct(loaded);
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setProductLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [store, slug, productId]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      const initial = getInitialOrderSelection(product);
      const zones = store?.deliveryZones ?? [];
      if (zones.length > 0) {
        initial.deliveryZoneId = zones[0].id;
      }
      setSelection(initial);
    }
  }, [product, store?.deliveryZones]);

  const resolvedSelection = useMemo(
    () => (product ? resolveOrderSelection(product, selection) : null),
    [product, selection],
  );

  const deliveryFee = useMemo(
    () =>
      getDeliveryFee(
        store?.deliveryZones,
        resolvedSelection?.deliveryType,
        resolvedSelection?.deliveryZoneId,
      ),
    [store?.deliveryZones, resolvedSelection?.deliveryType, resolvedSelection?.deliveryZoneId],
  );

  const selectionValid =
    product !== null && isOrderSelectionValid(product, selection);

  const showDiscountCodes =
    store !== null && hasFeature(store.planTier, "discount-codes");

  const handleOrderSuccess = (order: CustomerOrder) => {
    if (!store) return;

    const message = buildOrderWhatsAppMessage(store.businessName, order, {
      storeSlug: store.slug,
      appOrigin: window.location.origin,
    });
    const whatsappUrl = buildWhatsAppUrl(
      normalizePhoneForWhatsApp(store.whatsapp),
      message,
    );

    const trackUrl = `/s/${store.slug}/order/${order.paymentRef}`;
    toast.success(`Payment successful. Order ref: ${order.paymentRef}`, {
      action: {
        label: "Track order",
        onClick: () => {
          window.location.href = trackUrl;
        },
      },
    });
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleReserve = async (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
  }) => {
    if (!store || !product || !resolvedSelection) return;

    try {
      const order = await orderRepository.reserve({
        storeId: store.vendorId,
        productId: product.id,
        productName: product.name,
        color: resolvedSelection.color,
        size: resolvedSelection.size,
        quantity: resolvedSelection.quantity,
        deliveryType: resolvedSelection.deliveryType,
        deliveryZoneId: resolvedSelection.deliveryZoneId,
        discountCode: resolvedSelection.discountCode,
        customerName: details.customerName,
        customerPhone: details.customerPhone,
        deliveryAddress: details.deliveryAddress,
      });
      setCheckoutOpen(false);
      toast.success(`Reserved until ${order.reservedUntil ? new Date(order.reservedUntil).toLocaleString("en-NG") : "5 hours"}. Ref: ${order.paymentRef}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reserve order.",
      );
    }
  };

  const handleShareProduct = () => {
    if (!store || !product) return;
    const productUrl = `${window.location.origin}/s/${store.slug}/p/${product.id}`;
    const message = buildProductShareMessage({
      productName: product.name,
      price: product.price,
      storeName: store.businessName,
      productUrl,
    });
    shareToWhatsAppStatus(message);
  };

  if (storeLoading || productLoading) {
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

  if (store.storeUnavailable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Store temporarily closed
        </h1>
        <p className="mt-2 max-w-md text-gray-600">
          {store.businessName} is not accepting orders right now.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go to CatalogHQ</Link>
        </Button>
      </div>
    );
  }

  if (!product || !product.published) {
    return (
      <StorefrontLayout store={store}>
        <div className="rounded-xl border bg-white p-8 text-center sm:rounded-2xl sm:p-10">
          <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 sm:text-xl">
            Product not found
          </h2>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/s/${store.slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to store
            </Link>
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  const images = getProductImages(product);
  const lowStock =
    product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5);

  return (
    <StorefrontLayout store={store}>
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <Button asChild variant="ghost" className="h-9 px-2 text-sm sm:h-10">
          <Link to={`/s/${store.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to store
          </Link>
        </Button>
        {hasFeature(store.planTier, "whatsapp-share") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShareProduct}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share on WhatsApp
          </Button>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border bg-white p-3 sm:rounded-2xl sm:p-5 lg:p-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[280px] md:mx-0 md:max-w-none">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
              <ProductImageSwipeGallery
                images={images}
                alt={product.name}
                className="h-full w-full"
                selectedIndex={activeImageIndex}
                onIndexChange={setActiveImageIndex}
                dotVariant="dark"
                dotsClassName="top-3"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex justify-center gap-2 md:justify-start">
                {images.map((image, index) => (
                  <button
                    key={`${index}-${image.slice(0, 24)}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${
                      index === activeImageIndex
                        ? "border-whatsapp-green"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col text-center md:max-w-xl md:text-left lg:max-w-2xl">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <h2 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
                {product.name}
              </h2>

              <p className="text-2xl font-bold text-whatsapp-dark sm:text-3xl">
                {formatNaira(product.price)}
              </p>

              {product.stock <= 0 ? (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Sold out
                </Badge>
              ) : lowStock ? (
                <Badge variant="destructive" className="shrink-0 text-xs">
                  Only {product.stock} left
                </Badge>
              ) : (
                <Badge className="shrink-0 bg-whatsapp-green text-xs hover:bg-whatsapp-green">
                  In stock
                </Badge>
              )}

              {product.description && (
                <p className="max-w-prose text-sm leading-relaxed text-gray-600">
                  {sanitizeText(product.description)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5 sm:mt-6 sm:pt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Complete your order
          </h3>
          <ProductOrderOptions
            product={product}
            selection={selection}
            onChange={setSelection}
            selectionValid={selectionValid}
            onPayClick={() => setCheckoutOpen(true)}
            deliveryZones={store.deliveryZones}
            showDiscountCode={showDiscountCodes}
            paymentsDisabled={!store.payoutSetupComplete}
            paymentsDisabledMessage="This store is not ready to accept payments yet."
          />
        </div>
      </div>

      {resolvedSelection && (
        <FlutterwaveCheckout
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          storeSlug={store.slug}
          storeId={store.vendorId}
          storeName={store.businessName}
          productId={product.id}
          productName={product.name}
          unitPrice={product.price}
          deliveryFee={deliveryFee}
          selection={resolvedSelection}
          onSuccess={handleOrderSuccess}
          onReserve={
            hasFeature(store.planTier, "reserved-orders")
              ? (details) => void handleReserve(details)
              : undefined
          }
        />
      )}
    </StorefrontLayout>
  );
}
