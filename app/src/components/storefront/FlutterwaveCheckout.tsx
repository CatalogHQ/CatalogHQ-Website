import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { phoneSchema } from "@/lib/auth-schemas";
import { deliveryRequiresAddress } from "@/lib/delivery-types";
import {
  FLUTTERWAVE_PAYMENT_METHODS,
  savePendingPaymentDetails,
  USSD_BANK_OPTIONS,
  type FlutterwavePaymentMethodId,
} from "@/lib/flutterwave-payment-methods";
import { saveOrderPhoneLastFour } from "@/lib/order-phone-session";
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

  return z
    .object({
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
      paymentMethod: z.enum([
        "opay",
        "mobile_money",
        "ussd",
        "bank_transfer",
      ]),
      ussdBankCode: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (values.paymentMethod === "ussd" && !values.ussdBankCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select your bank for USSD",
          path: ["ussdBankCode"],
        });
      }
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
      paymentMethod: "opay",
      ussdBankCode: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

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
        paymentMethod: values.paymentMethod,
        ussdBankCode:
          values.paymentMethod === "ussd" ? values.ussdBankCode : undefined,
      });

      if (result.payment.authorizationUrl) {
        saveOrderPhoneLastFour(
          result.order.paymentRef,
          values.customerPhone.trim(),
        );
        window.location.href = result.payment.authorizationUrl;
        return;
      }

      if (
        result.payment.paymentInstruction ||
        result.payment.virtualAccount
      ) {
        savePendingPaymentDetails(result.order.paymentRef, {
          paymentInstruction: result.payment.paymentInstruction,
          virtualAccount: result.payment.virtualAccount,
        });
        saveOrderPhoneLastFour(
          result.order.paymentRef,
          values.customerPhone.trim(),
        );
        form.reset();
        onOpenChange(false);
        window.location.href = `/s/${storeSlug}/order/${result.order.paymentRef}`;
        return;
      }

      onSuccess(result.order);
      saveOrderPhoneLastFour(
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
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as FlutterwavePaymentMethodId)
                      }
                      className="space-y-2"
                    >
                      {FLUTTERWAVE_PAYMENT_METHODS.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <RadioGroupItem
                            value={method.id}
                            id={`pay-${method.id}`}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`pay-${method.id}`}
                            className="cursor-pointer space-y-0.5 font-normal"
                          >
                            <span className="block text-sm font-medium text-gray-900">
                              {method.label}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {method.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentMethod === "ussd" && (
              <FormField
                control={form.control}
                name="ussdBankCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your bank</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {USSD_BANK_OPTIONS.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                  Processing payment...
                </>
              ) : (
                <>Pay {formatNaira(customerTotal)}</>
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
                Reserve for 24 hours (pay later)
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
