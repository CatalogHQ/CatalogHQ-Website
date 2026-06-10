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
import StorefrontLayout from "@/layouts/StorefrontLayout";
import { usePublicStore } from "@/hooks/use-public-store";
import { phoneSchema } from "@/lib/auth-schemas";
import { apiClient } from "@/lib/api-client";
import { orderRepository } from "@/lib/repositories";
import { isApiMode } from "@/lib/use-api";
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
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
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
      if (!paymentRef) {
        setOrder(null);
        setOrderLoading(false);
        return;
      }

      setOrderLoading(true);
      try {
        const loaded = await orderRepository.getByPaymentRef(paymentRef);
        if (!cancelled) setOrder(loaded);
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [paymentRef]);

  const canReview =
    order &&
    store &&
    order.storeId === store.vendorId &&
    order.status === "delivered";

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    if (!paymentRef || !isApiMode()) {
      toast.error("Reviews require API mode.");
      return;
    }

    try {
      await apiClient(`/orders/ref/${encodeURIComponent(paymentRef)}/reviews`, {
        method: "POST",
        body: JSON.stringify({ ...values, rating }),
      });
      setSubmitted(true);
      toast.success("Thank you for your review!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit review.",
      );
    }
  };

  if (storeLoading || orderLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!store || !order || !canReview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Review not available</h1>
        <p className="mt-2 max-w-md text-gray-600">
          Reviews can only be left after your order is delivered.
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

  if (submitted) {
    return (
      <StorefrontLayout store={store}>
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>Review submitted</CardTitle>
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

  return (
    <StorefrontLayout store={store}>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave a review</h1>
          <p className="mt-1 text-gray-600">
            Order {order.paymentRef} · {order.productName}
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
                      <FormLabel>Your experience</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px]"
                          placeholder="What did you think of the product and delivery?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90">
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
