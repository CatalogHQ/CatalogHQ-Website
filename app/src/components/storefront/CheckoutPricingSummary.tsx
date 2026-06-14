import { formatNaira } from "@/lib/format";
import { computeCheckoutPricing } from "@/lib/flutterwave-fees";
import { cn } from "@/lib/utils";

type CheckoutPricingSummaryProps = {
  vendorNetNgn: number;
  className?: string;
  showSubtotalLines?: {
    quantity: number;
    deliveryFee?: number;
    discountAmount?: number;
  };
};

export default function CheckoutPricingSummary({
  vendorNetNgn,
  className,
  showSubtotalLines,
}: CheckoutPricingSummaryProps) {
  const { vendorNet, customerTotal } = computeCheckoutPricing(vendorNetNgn);

  if (vendorNet <= 0) {
    return null;
  }

  const deliveryFee = showSubtotalLines?.deliveryFee ?? 0;
  const itemsTotal = customerTotal - deliveryFee;

  return (
    <div className={cn("space-y-1.5 text-sm", className)}>
      {showSubtotalLines && (
        <>
          <div className="flex items-center justify-between text-gray-600">
            <span>Items ({showSubtotalLines.quantity})</span>
            <span>{formatNaira(itemsTotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Delivery</span>
              <span>{formatNaira(deliveryFee)}</span>
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
      <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
        <span>Total</span>
        <span className="text-lg text-whatsapp-dark">
          {formatNaira(customerTotal)}
        </span>
      </div>
    </div>
  );
}
