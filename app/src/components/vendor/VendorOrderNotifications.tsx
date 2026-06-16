import { useMemo } from "react";
import { Link } from "react-router";
import { Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import { useVendor } from "@/contexts/VendorContext";
import { formatNaira } from "@/lib/format";

function formatNotificationTime(iso: string): string {
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
  const { orders, unreadNotificationCount, refreshOrders } = useVendor();

  const unreadOrders = useMemo(
    () =>
      orders
        .filter((order) => !order.vendorSeenAt)
        .slice(0, 5),
    [orders],
  );

  const unreadPayouts = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            order.payoutStatus === "settled" && !order.vendorPayoutSeenAt,
        )
        .slice(0, 5),
    [orders],
  );

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          void refreshOrders();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={
            unreadNotificationCount > 0
              ? `${unreadNotificationCount} new notifications`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-whatsapp-green px-1 text-[10px] font-semibold text-white">
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          <p className="text-xs text-gray-500">
            {unreadNotificationCount > 0
              ? `${unreadNotificationCount} unread update${unreadNotificationCount === 1 ? "" : "s"}`
              : "You are all caught up"}
          </p>
        </div>

        {unreadOrders.length === 0 && unreadPayouts.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No new notifications right now.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {unreadPayouts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 border-b bg-gray-50 px-4 py-2">
                  <Wallet className="h-3.5 w-3.5 text-gray-500" />
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Payouts
                  </p>
                </div>
                <ul className="divide-y">
                  {unreadPayouts.map((order) => (
                    <li key={`payout-${order.id}`}>
                      <Link
                        to="/dashboard/payouts"
                        className="block px-4 py-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            Payout sent
                          </p>
                          <span className="shrink-0 text-xs text-gray-500">
                            {formatNotificationTime(
                              order.payoutSettledAt ?? order.createdAt,
                            )}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-600">
                          {order.paymentRef} · {order.productName}
                        </p>
                        <p className="mt-2 text-xs font-medium text-whatsapp-dark">
                          {formatNaira(order.vendorNet ?? 0)} to your bank
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {unreadOrders.length > 0 && (
              <div>
                <div className="border-b bg-gray-50 px-4 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Orders
                  </p>
                </div>
                <ul className="divide-y">
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
                            {formatNotificationTime(order.createdAt)}
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
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 border-t p-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/payouts">Payouts</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/orders">Orders</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
