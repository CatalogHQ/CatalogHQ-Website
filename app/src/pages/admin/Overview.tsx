import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, BadgeCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminStatCard from "@/components/admin/AdminStatCard";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import type {
  AdminPlatformOrder,
  AdminPlatformStats,
} from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import { formatNaira } from "@/lib/format";
import { isApiMode } from "@/lib/use-api";

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminPlatformOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [nextStats, orders] = await Promise.all([
          adminRepository.getStats(),
          adminRepository.listOrders(),
        ]);
        if (!cancelled) {
          setStats(nextStats);
          setRecentOrders(orders.slice(0, 5));
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

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform overview</h1>
        <p className="mt-1 text-gray-600">
          Monitor vendors, customers, sales, and support across CatalogHQ.
        </p>
      </div>

      {stats.pendingVerifications > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {stats.pendingVerifications} vendor
                  {stats.pendingVerifications === 1 ? "" : "s"} awaiting
                  verification
                </p>
                <p className="text-sm text-amber-800">
                  Review NIN submissions and approve or reject stores.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/verification">Review queue</Link>
            </Button>
          </div>
        </div>
      )}

      {stats.openTickets > 0 && (
        <div className="rounded-lg border border-whatsapp-green/30 bg-whatsapp-green/5 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp-green" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.openTickets} open support ticket
                  {stats.openTickets === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-gray-600">
                  Vendors and customers need help with orders and accounts.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-whatsapp-green hover:bg-whatsapp-green/90"
              asChild
            >
              <Link to="/admin/tickets">View tickets</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Total vendors" value={stats.totalVendors} />
        <AdminStatCard label="Active stores" value={stats.activeStores} />
        <AdminStatCard label="Customers" value={stats.totalCustomers} />
        <AdminStatCard label="Total orders" value={stats.totalOrders} />
        <AdminStatCard
          label="Platform GMV"
          value={formatNaira(stats.platformGmv)}
        />
        <AdminStatCard
          label="Open tickets"
          value={stats.openTickets}
          description={`${stats.pendingVerifications} pending verifications`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent orders</CardTitle>
          <CardDescription>
            Latest sales across all stores on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border-0 border-t bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.paymentRef}
                    </TableCell>
                    <TableCell>{order.storeName}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
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
        </CardContent>
      </Card>

      {!isApiMode() && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            <p className="text-sm text-gray-600">
              This dashboard uses mock data for preview. Set{" "}
              <code className="text-xs">VITE_USE_API=true</code> to see live
              platform metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
