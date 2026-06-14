import { formatNaira } from "@/lib/format";
import { computeCheckoutPricing } from "@/lib/flutterwave-fees";
import { cn } from "@/lib/utils";

type CheckoutPricingSummaryProps = {
  vendorNetNgn: number;
  className?: string;
  showSubtotalLines?: {
    unitPrice: number;
    quantity: number;
    deliveryFee?: number;
    discountAmount?: number;
  };
  compact?: boolean;
};

export default function CheckoutPricingSummary({
  vendorNetNgn,
  className,
  showSubtotalLines,
  compact = false,
}: CheckoutPricingSummaryProps) {
  const { vendorNet, processingFee, customerTotal } =
    computeCheckoutPricing(vendorNetNgn);

  if (vendorNet <= 0) {
    return null;
  }

  if (compact) {
    return (
      <p className={cn("text-xs text-gray-500", className)}>
        Includes {formatNaira(processingFee)} payment processing
      </p>
    );
  }

  return (
    <div className={cn("space-y-1.5 text-sm", className)}>
      {showSubtotalLines && (
        <>
          <div className="flex items-center justify-between text-gray-600">
            <span>
              {formatNaira(showSubtotalLines.unitPrice)} ×{" "}
              {showSubtotalLines.quantity}
            </span>
            <span>
              {formatNaira(
                showSubtotalLines.unitPrice * showSubtotalLines.quantity,
              )}
            </span>
          </div>
          {(showSubtotalLines.deliveryFee ?? 0) > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Delivery</span>
              <span>{formatNaira(showSubtotalLines.deliveryFee ?? 0)}</span>
            </div>
          )}
          {(showSubtotalLines.discountAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Discount</span>
              <span>
                −{formatNaira(showSubtotalLines.discountAmount ?? 0)}
              </span>
            </div>
          )}
        </>
      )}
      <div className="flex items-center justify-between text-gray-600">
        <span>Payment processing</span>
        <span>{formatNaira(processingFee)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
        <span>Total</span>
        <span className="text-lg text-whatsapp-dark">
          {formatNaira(customerTotal)}
        </span>
      </div>
    </div>
  );
}
