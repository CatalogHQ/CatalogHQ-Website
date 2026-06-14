import { useMemo } from "react";
import { Link } from "react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import { useVendor } from "@/contexts/VendorContext";
import { formatNaira } from "@/lib/format";

function formatOrderTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}

export default function VendorOrderNotifications() {
  const { orders, unreadOrderCount, refreshOrders } = useVendor();

  const unreadOrders = useMemo(
    () =>
      orders
        .filter((order) => !order.vendorSeenAt)
        .slice(0, 5),
    [orders],
  );

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) void refreshOrders();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={
            unreadOrderCount > 0
              ? `${unreadOrderCount} new order notifications`
              : "Order notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadOrderCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-whatsapp-green px-1 text-[10px] font-semibold text-white">
              {unreadOrderCount > 9 ? "9+" : unreadOrderCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Order notifications</p>
          <p className="text-xs text-gray-500">
            {unreadOrderCount > 0
              ? `${unreadOrderCount} new order${unreadOrderCount === 1 ? "" : "s"}`
              : "You are all caught up"}
          </p>
        </div>

        {unreadOrders.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No new orders right now.
          </div>
        ) : (
          <ul className="max-h-72 overflow-y-auto divide-y">
            {unreadOrders.map((order) => (
              <li key={order.id}>
                <Link
                  to="/dashboard/orders"
                  className="block px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatOrderTime(order.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-600">
                    {order.productName} x{order.quantity}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-whatsapp-dark">
                      {formatNaira(order.totalPaid)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/dashboard/orders">View all orders</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
