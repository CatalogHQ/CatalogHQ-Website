import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import OrderPhoneGate from "@/components/storefront/OrderPhoneGate";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import { useOrderPhoneGate } from "@/hooks/use-order-phone-gate";
import { formatNaira } from "@/lib/format";
import { orderRepository } from "@/lib/repositories";
import type { OrderReceipt } from "@/types/orders";

export default function VerifyReceipt() {
  const { paymentRef = "" } = useParams();
  const { phoneLastFour, onVerified, needsPhoneGate } =
    useOrderPhoneGate(paymentRef);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!paymentRef || !phoneLastFour) {
        setReceipt(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const loaded = await orderRepository.getReceipt(paymentRef, phoneLastFour);
        if (!cancelled) setReceipt(loaded);
      } catch {
        if (!cancelled) setReceipt(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [paymentRef, phoneLastFour]);

  if (needsPhoneGate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <OrderPhoneGate paymentRef={paymentRef} onVerified={onVerified} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Receipt not found</h1>
        <Button asChild className="mt-6">
          <Link to="/">Go to CatalogHQ</Link>
        </Button>
      </div>
    );
  }

  const { order, valid } = receipt;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              valid ? "bg-whatsapp-green/15" : "bg-amber-100"
            }`}
          >
            {valid ? (
              <BadgeCheck className="h-8 w-8 text-whatsapp-green" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-amber-600" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {valid ? "Verified receipt" : "Order pending payment"}
          </h1>
          <p className="mt-1 text-gray-600">
            Reference: <span className="font-medium">{order.paymentRef}</span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{order.productName}</CardTitle>
            <CardDescription>
              {order.customerName} · {order.customerPhone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold">{formatNaira(order.totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Placed</span>
              <span>{new Date(order.createdAt).toLocaleString("en-NG")}</span>
            </div>
            {order.transferReference && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Transfer ref</span>
                <span className="font-mono text-xs">{order.transferReference}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="w-full">
          <Link to="/">Back to CatalogHQ</Link>
        </Button>
      </div>
    </div>
  );
}
