import { formatNaira } from "@/lib/format";
import { computeCheckoutPricing } from "@/lib/flutterwave-fees";
import { cn } from "@/lib/utils";

type CheckoutPricingSummaryProps = {
  vendorNetNgn: number;
  className?: string;
  showProcessingFee?: boolean;
  totalLabel?: string;
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
  showSubtotalLines,
}: CheckoutPricingSummaryProps) {
  const { vendorNet, processingFee, customerTotal } =
    computeCheckoutPricing(vendorNetNgn);

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
      {showProcessingFee && processingFee > 0 && (
        <div className="flex items-center justify-between text-gray-600">
          <span>VAT</span>
          <span>{formatNaira(processingFee)}</span>
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
