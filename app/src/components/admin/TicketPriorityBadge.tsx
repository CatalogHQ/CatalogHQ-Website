import { Badge } from "@/components/ui/badge";
import type { AdminTicketPriority } from "@/data/admin-mock";

const PRIORITY_LABELS: Record<AdminTicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_CLASS: Record<AdminTicketPriority, string> = {
  low: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  medium: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  high: "bg-red-100 text-red-800 hover:bg-red-100",
};

type TicketPriorityBadgeProps = {
  priority: AdminTicketPriority;
};

export default function TicketPriorityBadge({
  priority,
}: TicketPriorityBadgeProps) {
  return (
    <Badge variant="outline" className={PRIORITY_CLASS[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
