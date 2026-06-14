import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import PaymentStatusBadge from "@/components/admin/PaymentStatusBadge";
import { getDeliveryLabel } from "@/lib/delivery-types";
import { formatNaira } from "@/lib/format";
import { adminRepository } from "@/lib/repositories";
import { getStoreOrderUrl } from "@/lib/slug";
import type { AdminPlatformOrder } from "@/data/admin-mock";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/types/orders";

const ALL_STATUSES: OrderStatus[] = [
  "reserved",
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

type AdminOrderDetailSheetProps = {
  order: AdminPlatformOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderChange: (order: AdminPlatformOrder) => void;
};

export default function AdminOrderDetailSheet({
  order,
  open,
  onOpenChange,
  onOrderChange,
}: AdminOrderDetailSheetProps) {
  if (!order) return null;

  const handleStatusChange = async (status: OrderStatus) => {
    try {
      const updated = await adminRepository.updateOrderStatus(order.id, status);
      onOrderChange(updated);
      toast.success(`Order updated to ${ORDER_STATUS_LABELS[status]}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update order.",
      );
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const updated = await adminRepository.confirmOrderPayment(order.id);
      onOrderChange(updated);
      toast.success("Payment verified and order marked as paid.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not confirm payment.",
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-mono">{order.paymentRef}</SheetTitle>
          <SheetDescription>
            {order.storeName} ·{" "}
            {new Date(order.createdAt).toLocaleString("en-NG")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>

          {order.paymentStatus !== "paid" && order.gatewayReference && (
            <Button
              type="button"
              className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
              onClick={() => void handleConfirmPayment()}
            >
              Verify Flutterwave payment
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-order-status">Update status</Label>
            <Select
              value={order.status}
              onValueChange={(value) => void handleStatusChange(value as OrderStatus)}
            >
              <SelectTrigger id="admin-order-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border bg-gray-50 p-4 text-sm">
            <div>
              <p className="text-gray-500">Product</p>
              <p className="font-medium text-gray-900">{order.productName}</p>
            </div>
            {order.color && (
              <div>
                <p className="text-gray-500">Color</p>
                <p className="font-medium text-gray-900">{order.color}</p>
              </div>
            )}
            {order.size && (
              <div>
                <p className="text-gray-500">Size</p>
                <p className="font-medium text-gray-900">{order.size}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Quantity</p>
              <p className="font-medium text-gray-900">{order.quantity}</p>
            </div>
            <div>
              <p className="text-gray-500">Delivery</p>
              <p className="font-medium text-gray-900">
                {getDeliveryLabel(order.deliveryType)}
              </p>
            </div>
            {order.deliveryAddress && (
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {order.deliveryAddress}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Total paid</p>
              <p className="font-semibold text-gray-900">
                {formatNaira(order.totalPaid)}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-whatsapp-dark hover:text-whatsapp-green"
              >
                {order.customerPhone}
              </a>
            </div>
            {order.gatewayReference && (
              <div>
                <p className="text-gray-500">Flutterwave ref</p>
                <p className="break-all font-mono text-xs text-gray-900">
                  {order.gatewayReference}
                </p>
              </div>
            )}
            {order.transferReference && (
              <div>
                <p className="text-gray-500">Transfer ref</p>
                <p className="font-mono text-xs text-gray-900">
                  {order.transferReference}
                </p>
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a
              href={getStoreOrderUrl(order.storeSlug, order.paymentRef)}
              target="_blank"
              rel="noreferrer"
            >
              Open buyer order page
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
