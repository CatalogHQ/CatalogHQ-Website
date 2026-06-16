import { formatNaira } from "@/lib/format";
import {
  CATALOGHQ_SERVICE_FEE_LABEL,
  computeCheckoutPricing,
  SECURE_PAYMENT_FEE_LABEL,
} from "@/lib/flutterwave-fees";
import { cn } from "@/lib/utils";

type CheckoutPricingSummaryProps = {
  vendorNetNgn: number;
  className?: string;
  showProcessingFee?: boolean;
  totalLabel?: string;
  /** Use persisted order totals instead of recomputing checkout fees. */
  confirmedTotals?: {
    paymentProcessingFee: number;
    serviceFee: number;
    customerTotal: number;
  };
  showSubtotalLines?: {
    unitPrice: number;
    quantity: number;
    deliveryFee?: number;
    discountAmount?: number;
  };
};

export default function CheckoutPricingSummary({
  vendorNetNgn,
  className,
  showProcessingFee = false,
  totalLabel,
  confirmedTotals,
  showSubtotalLines,
}: CheckoutPricingSummaryProps) {
  const computed = computeCheckoutPricing(vendorNetNgn);
  const vendorNet = computed.vendorNet;
  const paymentProcessingFee =
    confirmedTotals?.paymentProcessingFee ?? computed.paymentProcessingFee;
  const serviceFee = confirmedTotals?.serviceFee ?? computed.serviceFee;
  const customerTotal = confirmedTotals?.customerTotal ?? computed.customerTotal;

  if (vendorNet <= 0) {
    return null;
  }

  const listedItemsTotal = showSubtotalLines
    ? showSubtotalLines.unitPrice * showSubtotalLines.quantity
    : vendorNet;
  const deliveryFee = showSubtotalLines?.deliveryFee ?? 0;
  const discountAmount = showSubtotalLines?.discountAmount ?? 0;
  const displayTotal = showProcessingFee ? customerTotal : vendorNet;
  const resolvedTotalLabel =
    totalLabel ?? (showProcessingFee ? "Total" : "Subtotal");

  return (
    <div className={cn("space-y-1.5 text-sm", className)}>
      {showSubtotalLines && (
        <>
          <div className="flex items-center justify-between text-gray-600">
            <span>
              Items ({showSubtotalLines.quantity})
            </span>
            <span>{formatNaira(listedItemsTotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Delivery</span>
              <span>{formatNaira(deliveryFee)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Discount</span>
              <span>−{formatNaira(discountAmount)}</span>
            </div>
          )}
          {showProcessingFee && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-gray-700">
              <span>Subtotal</span>
              <span>{formatNaira(vendorNet)}</span>
            </div>
          )}
        </>
      )}
      {showProcessingFee && paymentProcessingFee > 0 && (
        <div className="flex items-center justify-between gap-3 text-gray-600">
          <span className="min-w-0">{SECURE_PAYMENT_FEE_LABEL}</span>
          <span className="shrink-0">{formatNaira(paymentProcessingFee)}</span>
        </div>
      )}
      {showProcessingFee && serviceFee > 0 && (
        <div className="flex items-center justify-between gap-3 text-gray-600">
          <span className="min-w-0">{CATALOGHQ_SERVICE_FEE_LABEL}</span>
          <span className="shrink-0">{formatNaira(serviceFee)}</span>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
        <span>{resolvedTotalLabel}</span>
        <span className="text-lg text-whatsapp-dark">
          {formatNaira(displayTotal)}
        </span>
      </div>
    </div>
  );
}
