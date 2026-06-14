import { formatNaira } from "@/lib/format";
import {
  estimateFlutterwaveFee,
  estimateVendorNet,
  FLUTTERWAVE_FEE_SUMMARY,
} from "@/lib/flutterwave-fees";
import { cn } from "@/lib/utils";

type FlutterwaveFeeBreakdownProps = {
  amountNgn: number;
  className?: string;
  compact?: boolean;
  label?: string;
};

export default function FlutterwaveFeeBreakdown({
  amountNgn,
  className,
  compact = false,
  label = "Customer pays",
}: FlutterwaveFeeBreakdownProps) {
  if (amountNgn <= 0) {
    return null;
  }

  const fee = estimateFlutterwaveFee(amountNgn);
  const net = estimateVendorNet(amountNgn);

  if (compact) {
    return (
      <p className={cn("text-xs text-gray-500", className)}>
        Est. you receive {formatNaira(net)} after {formatNaira(fee)} Flutterwave
        fee
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
      <p className="font-medium text-gray-900">Payment processing estimate</p>
      <p className="mt-1 text-xs text-gray-500">
        Flutterwave charges {FLUTTERWAVE_FEE_SUMMARY}. Customers pay your listed
        price. The fee is deducted from what you receive.
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">{label}</dt>
          <dd className="font-medium text-gray-900">{formatNaira(amountNgn)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">Est. Flutterwave fee</dt>
          <dd className="text-gray-700">−{formatNaira(fee)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-1.5">
          <dt className="font-medium text-gray-900">Est. you receive</dt>
          <dd className="font-semibold text-whatsapp-dark">
            {formatNaira(net)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
