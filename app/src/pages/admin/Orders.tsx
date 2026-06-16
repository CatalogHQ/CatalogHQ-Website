import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminOrderDetailSheet from "@/components/admin/AdminOrderDetailSheet";
import AdminDateRangeFilter from "@/components/admin/AdminDateRangeFilter";
import PaymentStatusBadge from "@/components/admin/PaymentStatusBadge";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import type { AdminPlatformOrder } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import type { AdminListDateRange } from "@/lib/admin-date-range";
import { formatNaira, formatDateTimeEnNg } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types/orders";

type PaymentFilter = "all" | PaymentStatus;

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminPlatformOrder[]>([]);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [dateRange, setDateRange] = useState<AdminListDateRange>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminPlatformOrder | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listOrders(dateRange);
        if (!cancelled) {
          setOrders(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load orders.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesPayment =
        paymentFilter === "all" || order.paymentStatus === paymentFilter;
      const matchesSearch =
        !query ||
        order.paymentRef.toLowerCase().includes(query) ||
        order.storeName.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        order.productName.toLowerCase().includes(query);

      return matchesPayment && matchesSearch;
    });
  }, [orders, paymentFilter, search]);

  const paymentTabs: { id: PaymentFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending payment" },
    { id: "paid", label: "Paid" },
    { id: "failed", label: "Failed" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-gray-600">
          All sales across every store. Click a row for payment and fulfilment
          details.
        </p>
      </div>

      <AdminDateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search ref, store, customer, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {paymentTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={paymentFilter === tab.id ? "default" : "outline"}
              size="sm"
              className={cn(
                paymentFilter === tab.id &&
                  "bg-whatsapp-green hover:bg-whatsapp-green/90",
              )}
              onClick={() => setPaymentFilter(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedOrder(order)}
              >
                <TableCell className="font-mono text-sm">
                  {order.paymentRef}
                </TableCell>
                <TableCell>{order.storeName}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-500">
                      {order.customerPhone}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {order.productName}
                </TableCell>
                <TableCell>{formatNaira(order.totalPaid)}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDateTimeEnNg(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredOrders.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          No orders match your filters.
        </p>
      )}

      <AdminOrderDetailSheet
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
        onOrderChange={(updated) => {
          setOrders((current) =>
            current.map((order) => (order.id === updated.id ? updated : order)),
          );
          setSelectedOrder(updated);
        }}
      />
    </div>
  );
}
