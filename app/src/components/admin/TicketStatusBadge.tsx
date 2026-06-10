import { Badge } from "@/components/ui/badge";
import type { AdminTicketStatus } from "@/data/admin-mock";

const STATUS_LABELS: Record<AdminTicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

const STATUS_CLASS: Record<AdminTicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  in_progress: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  resolved: "bg-whatsapp-green/15 text-whatsapp-dark hover:bg-whatsapp-green/15",
};

type TicketStatusBadgeProps = {
  status: AdminTicketStatus;
};

export default function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
