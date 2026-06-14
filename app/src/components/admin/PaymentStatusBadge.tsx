import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types/orders";
import { cn } from "@/lib/utils";

const LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

const STYLES: Record<PaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  paid: "border-green-200 bg-green-50 text-green-800",
  failed: "border-red-200 bg-red-50 text-red-800",
};

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  className?: string;
};

export default function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STYLES[status], className)}>
      {LABELS[status]}
    </Badge>
  );
}
