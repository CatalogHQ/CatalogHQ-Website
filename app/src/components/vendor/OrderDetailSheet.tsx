import { useEffect, useState } from "react";
import { Link2 as LinkIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import FlutterwaveFeeBreakdown from "@/components/vendor/FlutterwaveFeeBreakdown";
import { useAuth } from "@/contexts/AuthContext";
import { hasFeature } from "@/data/plans";
import { getDeliveryLabel } from "@/lib/delivery-types";
import { formatNaira } from "@/lib/format";
import { orderRepository } from "@/lib/repositories";
import { vendorToolsRepository } from "@/lib/repositories/vendor-tools-repository";
import { isApiMode } from "@/lib/use-api";
import {
  ORDER_STATUS_LABELS,
  type CustomerOrder,
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

type OrderDetailSheetProps = {
  order: CustomerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

export default function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onStatusChange,
}: OrderDetailSheetProps) {
  const { user } = useAuth();
  const [customerOrderCount, setCustomerOrderCount] = useState<number | null>(
    null,
  );
  useEffect(() => {
    if (!order || !open) return;

    let cancelled = false;

    async function loadCount() {
      if (!hasFeature(user?.planTier ?? "starter", "order-search")) return;
      try {
        const count = await orderRepository.getCustomerOrderCount(
          order!.customerPhone,
        );
        if (!cancelled) setCustomerOrderCount(count);
      } catch {
        if (!cancelled) setCustomerOrderCount(null);
      }
    }

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, [order, open, user?.planTier]);

  if (!order) return null;

  const handleStatusChange = (status: OrderStatus) => {
    try {
      onStatusChange(order.id, status);
      toast.success(`Order updated to ${ORDER_STATUS_LABELS[status]}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update order.",
      );
    }
  };

  const handlePaymentLink = async () => {
    if (!isApiMode()) {
      toast.error("Payment links require API mode.");
      return;
    }
    try {
      const link = await vendorToolsRepository.getPaymentLink(order.id);
      await navigator.clipboard.writeText(link.authorizationUrl);
      toast.success("Payment link copied to clipboard.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not get payment link.",
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{order.paymentRef}</SheetTitle>
          <SheetDescription>
            Placed {new Date(order.createdAt).toLocaleString("en-NG")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>

          {customerOrderCount !== null && customerOrderCount > 1 && (
            <p className="rounded-lg bg-whatsapp-green/10 px-3 py-2 text-sm text-whatsapp-dark">
              Repeat customer: {customerOrderCount} paid orders from this phone.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="order-status">Update status</Label>
            <Select value={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="order-status">
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

          {hasFeature(user?.planTier ?? "starter", "payment-links") &&
            order.paymentStatus !== "paid" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handlePaymentLink()}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Flutterwave payment link
              </Button>
            )}

          {order.paymentStatus === "pending" && (
            <TransferReferenceField
              key={order.id}
              paymentRef={order.paymentRef}
              initialRef={order.transferReference ?? ""}
            />
          )}

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

          {order.paymentStatus === "paid" && (
            <FlutterwaveFeeBreakdown amountNgn={order.totalPaid} />
          )}

          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">{order.customerName}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{order.customerPhone}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TransferReferenceField({
  paymentRef,
  initialRef,
}: {
  paymentRef: string;
  initialRef: string;
}) {
  const [transferRef, setTransferRef] = useState(initialRef);

  const handleSave = async () => {
    try {
      await orderRepository.markTransferReference(
        paymentRef,
        transferRef.trim(),
      );
      toast.success("Transfer reference saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save reference.",
      );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="transfer-ref">Bank transfer reference</Label>
      <div className="flex gap-2">
        <Input
          id="transfer-ref"
          placeholder="SHP-... or buyer memo"
          value={transferRef}
          onChange={(event) => setTransferRef(event.target.value)}
        />
        <Button type="button" onClick={() => void handleSave()}>
          Save
        </Button>
      </div>
    </div>
  );
}
