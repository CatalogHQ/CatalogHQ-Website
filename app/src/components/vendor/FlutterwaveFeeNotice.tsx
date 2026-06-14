import { Info } from "lucide-react";
import { FLUTTERWAVE_FEE_SUMMARY } from "@/lib/flutterwave-fees";

export default function FlutterwaveFeeNotice() {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
        <div>
          <p className="font-medium">Factor Flutterwave fees into your prices</p>
          <p className="mt-1 text-blue-900/90">
            The price you list is what customers pay. Flutterwave deducts{" "}
            {FLUTTERWAVE_FEE_SUMMARY} from each successful checkout before
            settlement. Set your product prices high enough to cover this
            processing cost and keep your margin.
          </p>
        </div>
      </div>
    </div>
  );
}
