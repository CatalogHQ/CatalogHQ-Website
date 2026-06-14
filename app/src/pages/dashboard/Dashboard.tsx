import { Link } from "react-router";
import {
  ArrowRight,
  Package,
  Settings,
  ClipboardList,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StoreLinkCard from "@/components/vendor/StoreLinkCard";
import VendorVerificationCard from "@/components/vendor/VendorVerificationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { usePlanCatalog } from "@/contexts/PlanCatalogContext";
import { hasFeature, PLAN_TIER_LABELS } from "@/data/plans";
import { formatNaira } from "@/lib/format";
import {
  computeSalesMetrics,
  getLowStockProducts,
} from "@/lib/sales-analytics";

export default function Dashboard() {
  const { user } = useAuth();
  const { store, products, orders, unreadOrderCount } = useVendor();
  const { getProductLimit } = usePlanCatalog();
  const planTier = user?.planTier ?? "starter";

  if (!store?.setupComplete) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to CatalogHQ
          </h1>
          <p className="mt-2 text-gray-600">
            Complete your store setup to get your shareable link and start adding
            products.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Finish setting up your store</CardTitle>
            <CardDescription>
              Add your business details and NIN to unlock your storefront link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-whatsapp-green hover:bg-whatsapp-green/90">
              <Link to="/dashboard/setup">
                Continue setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const productLimit = getProductLimit(planTier);
  const metrics = computeSalesMetrics(orders);
  const hasAnalytics = hasFeature(planTier, "analytics-dashboard");
  const hasLowStockAlerts = hasFeature(planTier, "low-stock-alerts");
  const lowStockCount = hasLowStockAlerts
    ? getLowStockProducts(products).length
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-gray-600">
          Manage your store, orders, and inventory from here.
        </p>
      </div>

      <VendorVerificationCard store={store} variant="banner" />

      {unreadOrderCount > 0 && (
        <div className="rounded-lg border border-whatsapp-green/30 bg-whatsapp-green/5 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp-green" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {unreadOrderCount} new order
                  {unreadOrderCount === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-gray-600">
                  Review and update order status from your dashboard.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-whatsapp-green hover:bg-whatsapp-green/90">
              <Link to="/dashboard/orders">View orders</Link>
            </Button>
          </div>
        </div>
      )}

      {hasLowStockAlerts && lowStockCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {lowStockCount} product{lowStockCount === 1 ? "" : "s"} running
                  low
                </p>
                <p className="text-sm text-amber-800">
                  Restock before you miss another sale.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/inventory">View inventory</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plan</CardDescription>
            <CardTitle className="text-xl">
              {PLAN_TIER_LABELS[planTier]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {products.length} of {productLimit} products used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders</CardDescription>
            <CardTitle className="text-xl">{orders.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/orders">Manage orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Products</CardDescription>
            <CardTitle className="text-xl">{products.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/products">Manage products</Link>
            </Button>
          </CardContent>
        </Card>

        {hasAnalytics ? (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revenue</CardDescription>
              <CardTitle className="text-xl">
                {formatNaira(metrics.totalRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Store status</CardDescription>
              <CardTitle className="text-xl text-whatsapp-green">Live</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Your storefront is ready to share.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <StoreLinkCard slug={store.slug} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-whatsapp-green" />
              Orders
            </CardTitle>
            <CardDescription>
              View new orders and update fulfilment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-whatsapp-green hover:bg-whatsapp-green/90">
              <Link to="/dashboard/orders">Go to orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-whatsapp-green" />
              Add products
            </CardTitle>
            <CardDescription>
              Build your catalog so customers can browse and order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/dashboard/products">Go to products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-5 w-5 text-whatsapp-green" />
              Store settings
            </CardTitle>
            <CardDescription>
              Update your business name, bio, and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/dashboard/settings">Edit settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
