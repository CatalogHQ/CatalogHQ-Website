import { Badge } from "@/components/ui/badge";
import { VERIFICATION_STATUS_LABELS } from "@/lib/vendor-verification";
import type { VendorVerificationStatus } from "@/types/domain";

const STATUS_CLASS: Record<VendorVerificationStatus, string> = {
  unsubmitted: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  verified: "bg-whatsapp-green/15 text-whatsapp-dark hover:bg-whatsapp-green/15",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

type VerificationStatusBadgeProps = {
  status: VendorVerificationStatus;
};

export default function VerificationStatusBadge({
  status,
}: VerificationStatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {VERIFICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
