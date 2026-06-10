import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/types/orders";

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  reserved: "outline",
  paid: "default",
  confirmed: "secondary",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  reserved: "bg-amber-50 text-amber-800 hover:bg-amber-50",
  paid: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  confirmed: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  shipped: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  delivered: "bg-whatsapp-green/15 text-whatsapp-dark hover:bg-whatsapp-green/15",
  cancelled: "",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className={STATUS_CLASS[status]}
    >
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
