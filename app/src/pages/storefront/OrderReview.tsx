import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Star } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import OrderPhoneGate from "@/components/storefront/OrderPhoneGate";
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { useOrderPhoneGate } from "@/hooks/use-order-phone-gate";
import { usePublicStore } from "@/hooks/use-public-store";
import { phoneSchema } from "@/lib/auth-schemas";
import { canCustomerReviewOrder } from "@/lib/order-review";
import { orderRepository, reviewRepository } from "@/lib/repositories";
import { hasFeature } from "@/data/plans";
import type { CustomerOrder } from "@/types/orders";

const reviewSchema = z.object({
  buyerName: z.string().min(2, "Enter your name").max(80),
  customerPhone: phoneSchema,
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Write at least 10 characters").max(500),
});

export default function OrderReview() {
  const { slug = "", paymentRef = "" } = useParams();
  const { store, isLoading: storeLoading } = usePublicStore(slug);
  const { phoneLastFour, onVerified, needsPhoneGate } =
    useOrderPhoneGate(paymentRef);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      buyerName: "",
      customerPhone: "",
      rating: 5,
      comment: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!paymentRef || !phoneLastFour) {
        setOrder(null);
        setOrderLoading(false);
        setStatusLoading(false);
        return;
      }

      setOrderLoading(true);
      setStatusLoading(true);
      try {
        const loaded = await orderRepository.getByPaymentRef(
          paymentRef,
          phoneLastFour,
        );
        if (!cancelled) {
          setOrder(loaded);
          if (loaded) {
            form.reset({
              buyerName: loaded.customerName,
              customerPhone: loaded.customerPhone,
              rating: 5,
              comment: "",
            });
          }
        }

        const status = await reviewRepository.getOrderReviewStatus(
          paymentRef,
          phoneLastFour,
        );
        if (!cancelled) {
          setAlreadyReviewed(status.alreadyReviewed);
        }
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) {
          setOrderLoading(false);
          setStatusLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [paymentRef, phoneLastFour, form]);

  if (needsPhoneGate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <OrderPhoneGate paymentRef={paymentRef} onVerified={onVerified} />
      </div>
    );
  }

  const reviewsEnabled =
    store !== null && hasFeature(store.planTier, "verified-reviews");

  const canReview =
    order &&
    store &&
    order.storeId === store.vendorId &&
    reviewsEnabled &&
    canCustomerReviewOrder(order) &&
    !alreadyReviewed;

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    if (!paymentRef) return;

    try {
      await reviewRepository.submitOrderReview(paymentRef, {
        ...values,
        rating,
      });
      setSubmitted(true);
      toast.success("Thank you for your review!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit review.",
      );
    }
  };

  if (storeLoading || orderLoading || statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!store || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Review not available</h1>
        <p className="mt-2 max-w-md text-gray-600">
          We could not find this order. Check your order reference and try again.
        </p>
        {store ? (
          <Button asChild className="mt-6">
            <Link to={`/s/${store.slug}`}>Back to store</Link>
          </Button>
        ) : (
          <Button asChild className="mt-6">
            <Link to="/">Go to CatalogHQ</Link>
          </Button>
        )}
      </div>
    );
  }

  if (!reviewsEnabled) {
    return (
      <StorefrontLayout store={store}>
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>Reviews unavailable</CardTitle>
            <CardDescription>
              This store has not enabled verified buyer reviews yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/s/${store.slug}`}>Back to store</Link>
            </Button>
          </CardContent>
        </Card>
      </StorefrontLayout>
    );
  }

  if (alreadyReviewed || submitted) {
    return (
      <StorefrontLayout store={store}>
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>
              {submitted ? "Review submitted" : "Review already submitted"}
            </CardTitle>
            <CardDescription>
              Thank you for helping other buyers trust {store.businessName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/s/${store.slug}/reviews`}>View store reviews</Link>
            </Button>
          </CardContent>
        </Card>
      </StorefrontLayout>
    );
  }

  if (!canReview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Review not available yet</h1>
        <p className="mt-2 max-w-md text-gray-600">
          You can leave a review after your payment is confirmed and the vendor
          starts processing your order.
        </p>
        <Button asChild className="mt-6">
          <Link to={`/s/${store.slug}/order/${order.paymentRef}`}>
            Track your order
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <StorefrontLayout store={store}>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Review {store.businessName}
          </h1>
          <p className="mt-1 text-gray-600">
            Order {order.paymentRef} · {order.productName}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Share your experience with this vendor. Your review is linked to this
            purchase and shown as verified on the storefront.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div>
                  <FormLabel>Your rating</FormLabel>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="rounded p-1 hover:bg-gray-100"
                        onClick={() => {
                          setRating(value);
                          form.setValue("rating", value);
                        }}
                      >
                        <Star
                          className={`h-7 w-7 ${
                            value <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="buyerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone on order</FormLabel>
                      <FormControl>
                        <Input inputMode="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your experience with this vendor</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px]"
                          placeholder="How was the product, communication, and delivery?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
                >
                  Submit verified review
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  );
}
