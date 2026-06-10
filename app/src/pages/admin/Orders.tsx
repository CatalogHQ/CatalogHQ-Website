import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import type { AdminPlatformOrder } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import { formatNaira } from "@/lib/format";

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminPlatformOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listOrders();
        if (!cancelled) {
          setOrders(result);
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
  }, []);

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
          All sales across every store on the platform.
        </p>
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
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
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
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString("en-NG")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
