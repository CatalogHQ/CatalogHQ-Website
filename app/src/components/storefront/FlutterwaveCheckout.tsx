import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Lock } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { phoneSchema } from "@/lib/auth-schemas";
import { deliveryRequiresAddress } from "@/lib/delivery-types";
import {
  CHECKOUT_PAYMENT_METHOD,
  savePendingPaymentDetails,
} from "@/lib/flutterwave-payment-methods";
import {
  saveOrderCustomerPhone,
} from "@/lib/order-phone-session";
import { formatNaira } from "@/lib/format";
import { computeCheckoutPricing } from "@/lib/flutterwave-fees";
import CheckoutPricingSummary from "@/components/storefront/CheckoutPricingSummary";
import { orderRepository } from "@/lib/repositories";
import { isApiMode } from "@/lib/use-api";
import type { DeliveryTypeId } from "@/lib/delivery-types";
import type { ProductOrderSelection } from "@/lib/product-order-selection";
import type { CustomerOrder } from "@/types/orders";

type FlutterwaveCheckoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeSlug: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  unitPrice: number;
  deliveryFee?: number;
  discountAmount?: number;
  selection: Required<
    Pick<ProductOrderSelection, "quantity" | "deliveryType">
  > &
    Pick<ProductOrderSelection, "color" | "size" | "deliveryZoneId" | "discountCode">;
  onSuccess: (order: CustomerOrder) => void;
  onReserve?: (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
  }) => void;
};

function createCheckoutSchema(deliveryType: DeliveryTypeId) {
  const needsAddress = deliveryRequiresAddress(deliveryType);

  return z.object({
    customerName: z
      .string()
      .min(2, "Enter your full name")
      .max(80, "Name is too long"),
    customerPhone: phoneSchema,
    deliveryAddress: needsAddress
      ? z
          .string()
          .min(10, "Enter the full address where the product should be delivered")
          .max(300)
      : z.string().max(300).optional().or(z.literal("")),
  });
}

export default function FlutterwaveCheckout({
  open,
  onOpenChange,
  storeSlug,
  storeId,
  storeName,
  productId,
  productName,
  unitPrice,
  deliveryFee = 0,
  discountAmount = 0,
  selection,
  onSuccess,
  onReserve,
}: FlutterwaveCheckoutProps) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const vendorNet =
    unitPrice * selection.quantity + deliveryFee - discountAmount;
  const { customerTotal } = computeCheckoutPricing(vendorNet);
  const isDelivery = deliveryRequiresAddress(selection.deliveryType);
  const checkoutSchema = createCheckoutSchema(selection.deliveryType);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
    },
  });

  useEffect(() => {
    if (!open || !isApiMode()) return;

    const handleAbandon = () => {
      void orderRepository.trackAbandonedCart({
        storeId,
        productId,
        cartData: {
          productName,
          quantity: selection.quantity,
          deliveryType: selection.deliveryType,
        },
      });
    };

    return () => {
      if (!processing) {
        handleAbandon();
      }
    };
  }, [
    open,
    processing,
    storeId,
    productId,
    productName,
    selection.quantity,
    selection.deliveryType,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!processing) {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        form.reset();
      }
    }
  };

  const handleSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    setProcessing(true);
    try {
      const result = await orderRepository.checkout({
        storeId,
        storeSlug,
        productId,
        productName,
        color: selection.color,
        size: selection.size,
        quantity: selection.quantity,
        deliveryType: selection.deliveryType,
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        deliveryAddress: values.deliveryAddress?.trim() || undefined,
        deliveryZoneId: selection.deliveryZoneId,
        discountCode: selection.discountCode,
        paymentMethod: CHECKOUT_PAYMENT_METHOD.id,
      });

      if (
        result.payment.paymentInstruction ||
        result.payment.virtualAccount
      ) {
        const normalizedPhone = values.customerPhone.trim().replace(/\D/g, "");
        savePendingPaymentDetails(result.order.paymentRef, {
          paymentInstruction: result.payment.paymentInstruction,
          virtualAccount: result.payment.virtualAccount,
          totalPaid: result.order.totalPaid,
        });
        saveOrderCustomerPhone(result.order.paymentRef, normalizedPhone);
        form.reset();
        onOpenChange(false);
        navigate(`/s/${storeSlug}/order/${result.order.paymentRef}`);
        return;
      }

      onSuccess(result.order);
      saveOrderCustomerPhone(
        result.order.paymentRef,
        values.customerPhone.trim(),
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Checkout failed. Try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded bg-[#F5A623] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Flutterwave
            </span>
            Secure checkout
          </DialogTitle>
          <DialogDescription>
            Pay {storeName} for {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-gray-50 p-4">
          <CheckoutPricingSummary
            vendorNetNgn={vendorNet}
            showProcessingFee
            showSubtotalLines={{
              unitPrice,
              quantity: selection.quantity,
              deliveryFee,
              discountAmount,
            }}
          />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="rounded-lg border bg-white p-3">
              <p className="text-sm font-medium text-gray-900">
                {CHECKOUT_PAYMENT_METHOD.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {CHECKOUT_PAYMENT_METHOD.description}. You will get the account
                details on the next page after you continue.
              </p>
            </div>

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isDelivery && (
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="House number, street, area, landmark, city, state"
                        className="min-h-[88px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp / reachable number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="08012345678"
                      inputMode="tel"
                      {...field}
                    />
                  </FormControl>
                  {isDelivery ? (
                    <p className="text-xs text-gray-500">
                      The vendor may call or message you about delivery.
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={processing}
              className="h-11 w-full bg-[#F5A623] text-white hover:bg-[#F5A623]/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting account details...
                </>
              ) : (
                <>Continue to pay {formatNaira(customerTotal)}</>
              )}
            </Button>

            {onReserve && (
              <Button
                type="button"
                variant="outline"
                disabled={processing}
                className="h-11 w-full"
                onClick={() => {
                  void form.handleSubmit((values) => {
                    onReserve({
                      customerName: values.customerName.trim(),
                      customerPhone: values.customerPhone.trim(),
                      deliveryAddress: values.deliveryAddress?.trim() || undefined,
                    });
                  })();
                }}
              >
                Reserve for 5 hours (pay later)
              </Button>
            )}

            <p className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              Secured by Flutterwave
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
