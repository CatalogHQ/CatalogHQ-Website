import { formatNaira } from "@/lib/format";
import {
  computeCheckoutPricing,
  FLUTTERWAVE_FEE_SUMMARY,
  vendorNetFromOrderLine,
} from "@/lib/flutterwave-fees";
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

  const { vendorNet, processingFee, customerTotal } =
    computeCheckoutPricing(vendorNetNgn);

  if (compact) {
    return (
      <p className={cn("text-xs text-gray-500", className)}>
        Customer pays {formatNaira(customerTotal)} ({formatNaira(processingFee)}{" "}
        processing fee)
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
        Your listed price is what you receive in full. Flutterwave adds a{" "}
        {FLUTTERWAVE_FEE_SUMMARY} fee at checkout for secure card, transfer,
        and wallet payments. Customers pay it, not you, so your payout is never
        reduced and every sale stays confirmed on record.
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">{label}</dt>
          <dd className="font-medium text-gray-900">{formatNaira(vendorNet)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">Processing fee (customer pays)</dt>
          <dd className="text-gray-700">+{formatNaira(processingFee)}</dd>
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
  };
  className?: string;
}) {
  const vendorNet = vendorNetFromOrderLine(order);
  const processingFee = Math.max(0, order.totalPaid - vendorNet);

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
          <dt className="text-gray-600">Processing fee</dt>
          <dd className="text-gray-700">{formatNaira(processingFee)}</dd>
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
