import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Check, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { Spinner } from "@/components/ui/spinner";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import { usePublicStore } from "@/hooks/use-public-store";
import { getDeliveryLabel } from "@/lib/delivery-types";
import { formatNaira, normalizePhoneForWhatsApp } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/order-message";
import { orderRepository } from "@/lib/repositories";
import { hasFeature } from "@/data/plans";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type CustomerOrder,
  type OrderStatus,
} from "@/types/orders";

function getStepState(
  step: OrderStatus,
  current: OrderStatus,
): "complete" | "current" | "upcoming" | "cancelled" {
  if (current === "cancelled") {
    return step === "paid" ? "complete" : "cancelled";
  }

  if (current === "reserved") {
    return step === "paid" ? "current" : "upcoming";
  }

  const stepIndex = ORDER_STATUS_FLOW.indexOf(step);
  const currentIndex = ORDER_STATUS_FLOW.indexOf(current);

  if (currentIndex < 0) return "upcoming";
  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export default function OrderStatusPage() {
  const { slug = "", paymentRef = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { store, isLoading: storeLoading } = usePublicStore(slug);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!paymentRef) {
        setOrder(null);
        setOrderLoading(false);
        return;
      }

      setOrderLoading(true);
      try {
        if (searchParams.get("paid") === "1") {
          const verified = await orderRepository.verifyPayment(paymentRef);
          if (!cancelled) setOrder(verified);
          return;
        }

        const loaded = await orderRepository.getByPaymentRef(paymentRef);
        if (!cancelled) setOrder(loaded);
      } catch (error) {
        if (!cancelled) {
          setOrder(null);
          if (searchParams.get("paid") === "1") {
            toast.error(
              error instanceof Error
                ? error.message
                : "Could not verify payment.",
            );
          }
        }
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [paymentRef, searchParams]);

  const isValid = store && order && order.storeId === store.vendorId;

  if (storeLoading || orderLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!isValid || !order || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Order not found
        </h1>
        <p className="mt-2 max-w-md text-gray-600">
          This order reference does not exist or does not belong to this store.
        </p>
        {store ? (
          <Button asChild className="mt-6">
            <Link to={`/s/${store.slug}`}>Back to store</Link>
          </Button>
        ) : (
          <Button asChild className="mt-6">
            <Link to="/">Go to ShopEase</Link>
          </Button>
        )}
      </div>
    );
  }

  const whatsappUrl = buildWhatsAppUrl(
    normalizePhoneForWhatsApp(store.whatsapp),
    `Hi ${store.businessName}, I want an update on order ${order.paymentRef}.`,
  );

  const showReviewLink =
    order.status === "delivered" &&
    hasFeature(store.planTier, "verified-reviews");

  return (
    <StorefrontLayout store={store} supportOrderRef={order.paymentRef}>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track your order</h1>
          <p className="mt-1 text-gray-600">
            Order ref: <span className="font-medium">{order.paymentRef}</span>
          </p>
          {hasFeature(store.planTier, "verifiable-receipts") && (
            <p className="mt-1 text-sm">
              <Link
                to={`/receipt/${order.paymentRef}`}
                className="text-whatsapp-green hover:underline"
              >
                Verify payment receipt
              </Link>
            </p>
          )}
        </div>

        {order.status === "reserved" && order.reservedUntil && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 text-sm text-amber-900">
              This order is reserved until{" "}
              {new Date(order.reservedUntil).toLocaleString("en-NG")}. Complete
              payment before then to avoid cancellation.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">{order.productName}</CardTitle>
              <OrderStatusBadge status={order.status} />
            </div>
            <CardDescription>
              Placed {new Date(order.createdAt).toLocaleString("en-NG")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {order.color && (
              <p>
                <span className="text-gray-500">Color: </span>
                {order.color}
              </p>
            )}
            {order.size && (
              <p>
                <span className="text-gray-500">Size: </span>
                {order.size}
              </p>
            )}
            <p>
              <span className="text-gray-500">Quantity: </span>
              {order.quantity}
            </p>
            <p>
              <span className="text-gray-500">Delivery: </span>
              {getDeliveryLabel(order.deliveryType)}
            </p>
            {(order.deliveryFee ?? 0) > 0 && (
              <p>
                <span className="text-gray-500">Delivery fee: </span>
                {formatNaira(order.deliveryFee!)}
              </p>
            )}
            <p>
              <span className="text-gray-500">Total paid: </span>
              <span className="font-semibold">{formatNaira(order.totalPaid)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order progress</CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === "cancelled" ? (
              <p className="text-sm text-red-600">
                This order was cancelled. Contact the seller if you have questions.
              </p>
            ) : order.status === "reserved" ? (
              <p className="text-sm text-amber-700">
                Waiting for payment confirmation. Pay via the link from the
                seller or complete checkout.
              </p>
            ) : (
              <ol className="space-y-4">
                {ORDER_STATUS_FLOW.map((step) => {
                  const state = getStepState(step, order.status);
                  return (
                    <li key={step} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          state === "complete" || state === "current"
                            ? "border-whatsapp-green bg-whatsapp-green text-white"
                            : "border-gray-300 bg-white text-gray-400"
                        }`}
                      >
                        {state === "complete" || state === "current" ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            state === "upcoming"
                              ? "text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[step]}
                        </p>
                        {state === "current" && (
                          <p className="text-xs text-gray-500">Current status</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {showReviewLink && (
          <Button asChild className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90">
            <Link to={`/s/${store.slug}/order/${order.paymentRef}/review`}>
              <Star className="mr-2 h-4 w-4" />
              Leave a verified review
            </Link>
          </Button>
        )}

        <Button asChild className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90">
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Message seller on WhatsApp
          </a>
        </Button>

        <Button variant="outline" asChild className="w-full">
          <Link to={`/s/${store.slug}`}>Continue shopping</Link>
        </Button>
      </div>
    </StorefrontLayout>
  );
}
