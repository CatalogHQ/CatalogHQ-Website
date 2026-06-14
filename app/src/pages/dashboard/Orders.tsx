import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { toast } from "sonner";
import OrderDetailSheet from "@/components/vendor/OrderDetailSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { hasFeature } from "@/data/plans";
import { formatNaira } from "@/lib/format";
import { orderRepository } from "@/lib/repositories";
import {
  ORDER_STATUS_LABELS,
  type CustomerOrder,
  type OrderStatus,
} from "@/types/orders";

export default function Orders() {
  const { user } = useAuth();
  const { store, markOrdersSeen, updateOrderStatus, refreshOrders } =
    useVendor();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManageOrders = hasFeature(user?.planTier ?? "starter", "order-management");
  const canSearch = canManageOrders;
  const canBulk = canManageOrders;

  useEffect(() => {
    if (!canManageOrders || !store) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const loaded = await orderRepository.listByStoreId(
          store!.vendorId,
          canSearch ? searchQuery : undefined,
        );
        if (!cancelled) setOrders(loaded);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(() => void load(), canSearch ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canManageOrders, store, searchQuery, canSearch]);

  useEffect(() => {
    if (canManageOrders) {
      markOrdersSeen();
    }
  }, [canManageOrders, markOrdersSeen]);

  const allSelected = useMemo(
    () => orders.length > 0 && selectedIds.length === orders.length,
    [orders.length, selectedIds.length],
  );

  const openOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : orders.map((order) => order.id));
  };

  const toggleSelect = (orderId: string) => {
    setSelectedIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    try {
      await orderRepository.bulkUpdateStatus(selectedIds, bulkStatus);
      toast.success(
        `Updated ${selectedIds.length} order${selectedIds.length === 1 ? "" : "s"}.`,
      );
      setSelectedIds([]);
      await refreshOrders();
      const loaded = await orderRepository.listByStoreId(
        store!.vendorId,
        canSearch ? searchQuery : undefined,
      );
      setOrders(loaded);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bulk update failed.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-gray-600">
          View and fulfil customer orders from your store.
        </p>
      </div>

      {canSearch && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by ref, phone, or name..."
            className="pl-9"
          />
        </div>
      )}

      {canBulk && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
          <span className="text-sm text-gray-600">
            {selectedIds.length} selected
          </span>
          <Select
            value={bulkStatus}
            onValueChange={(value) => setBulkStatus(value as OrderStatus)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["confirmed", "shipped", "delivered", "cancelled"] as const).map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={() => void handleBulkUpdate()}>
            Update selected
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <Empty className="border bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              When customers pay on your storefront, orders will appear here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                {canBulk && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all orders"
                    />
                  </TableHead>
                )}
                <TableHead>Order ref</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => openOrder(order)}
                >
                  {canBulk && (
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                        aria-label={`Select order ${order.paymentRef}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{order.paymentRef}</TableCell>
                  <TableCell>{order.productName}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{formatNaira(order.totalPaid)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-NG")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={updateOrderStatus}
      />
    </div>
  );
}
