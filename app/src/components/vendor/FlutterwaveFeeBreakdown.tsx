import { formatNaira } from "@/lib/format";
import {
  CATALOGHQ_SERVICE_FEE_LABEL,
  CATALOGHQ_SERVICE_FEE_NGN,
  computeCheckoutPricing,
  FLUTTERWAVE_FEE_SUMMARY,
  SECURE_PAYMENT_FEE_LABEL,
  vendorNetFromOrderLine,
} from "@/lib/flutterwave-fees";
import {
  orderPaymentProcessingFeeNgn,
  orderServiceFeeNgn,
} from "@/lib/order-pricing";
import { cn } from "@/lib/utils";

type FlutterwaveFeeBreakdownProps = {
  vendorNetNgn: number;
  className?: string;
  compact?: boolean;
  label?: string;
};

export default function FlutterwaveFeeBreakdown({
  vendorNetNgn,
  className,
  compact = false,
  label = "You receive",
}: FlutterwaveFeeBreakdownProps) {
  if (vendorNetNgn <= 0) {
    return null;
  }

  const {
    vendorNet,
    paymentProcessingFee,
    serviceFee,
    customerTotal,
  } = computeCheckoutPricing(vendorNetNgn);

  if (compact) {
    return (
      <p className={cn("text-xs text-gray-500", className)}>
        Customer pays {formatNaira(customerTotal)} (
        {formatNaira(paymentProcessingFee)} secure payment fee +{" "}
        {formatNaira(serviceFee)} service fee)
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm",
        className,
      )}
    >
      <p className="font-medium text-gray-900">Checkout pricing</p>
      <p className="mt-1 text-xs text-gray-500">
        Your listed price is what you receive in full. Customers pay a{" "}
        {FLUTTERWAVE_FEE_SUMMARY}{" "}
        {SECURE_PAYMENT_FEE_LABEL.toLowerCase()} plus a fixed{" "}
        {formatNaira(CATALOGHQ_SERVICE_FEE_NGN)} {CATALOGHQ_SERVICE_FEE_LABEL.toLowerCase()}{" "}
        at checkout. You are never charged these fees, and every sale stays
        confirmed on record.
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">{label}</dt>
          <dd className="font-medium text-gray-900">{formatNaira(vendorNet)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="min-w-0 text-gray-600">{SECURE_PAYMENT_FEE_LABEL}</dt>
          <dd className="shrink-0 text-gray-700">
            +{formatNaira(paymentProcessingFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">{CATALOGHQ_SERVICE_FEE_LABEL}</dt>
          <dd className="text-gray-700">+{formatNaira(serviceFee)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-1.5">
          <dt className="font-medium text-gray-900">Customer pays</dt>
          <dd className="font-semibold text-whatsapp-dark">
            {formatNaira(customerTotal)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function OrderFeeBreakdown({
  order,
  className,
}: {
  order: {
    unitPrice: number;
    quantity: number;
    deliveryFee?: number;
    discountAmount?: number;
    totalPaid: number;
    platformFee?: number;
  };
  className?: string;
}) {
  const vendorNet = vendorNetFromOrderLine(order);
  const serviceFee = orderServiceFeeNgn(order);
  const paymentProcessingFee = orderPaymentProcessingFeeNgn(order);

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm",
        className,
      )}
    >
      <p className="font-medium text-gray-900">Payment breakdown</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">You receive</dt>
          <dd className="font-medium text-gray-900">{formatNaira(vendorNet)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="min-w-0 text-gray-600">{SECURE_PAYMENT_FEE_LABEL}</dt>
          <dd className="shrink-0 text-gray-700">
            {formatNaira(paymentProcessingFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">{CATALOGHQ_SERVICE_FEE_LABEL}</dt>
          <dd className="text-gray-700">{formatNaira(serviceFee)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-1.5">
          <dt className="font-medium text-gray-900">Customer paid</dt>
          <dd className="font-semibold text-gray-900">
            {formatNaira(order.totalPaid)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
