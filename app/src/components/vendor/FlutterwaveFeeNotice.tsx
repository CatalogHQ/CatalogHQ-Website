import { Info } from "lucide-react";
import { FLUTTERWAVE_FEE_SUMMARY } from "@/lib/flutterwave-fees";

export default function FlutterwaveFeeNotice() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
        <div>
          <p className="font-medium">You receive your listed price</p>
          <p className="mt-1 text-blue-900/90">
            Set the amount you want to receive per product. Customers pay your
            price plus a {FLUTTERWAVE_FEE_SUMMARY} processing fee at checkout.
            You keep the full listed amount after each successful payment.
          </p>
        </div>
      </div>
    </div>
  );
}
