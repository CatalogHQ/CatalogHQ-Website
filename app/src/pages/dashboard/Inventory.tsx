import { useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, MapPin, Package, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FeatureUpgradeBanner from "@/components/vendor/FeatureUpgradeBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { hasFeature } from "@/data/plans";
import {
  getInStockCount,
  getInventoryStatus,
  getLowStockProducts,
  getSoldOutCount,
} from "@/lib/sales-analytics";
import { getProductPrimaryImage } from "@/lib/product-utils";
import { Input } from "@/components/ui/input";
import { vendorToolsRepository } from "@/lib/repositories/vendor-tools-repository";
import { isApiMode } from "@/lib/use-api";
import { getProductLowStockThreshold } from "@/types/domain";

const STATUS_LABELS = {
  in_stock: { label: "In stock", className: "bg-green-100 text-green-800" },
  low_stock: { label: "Low stock", className: "bg-amber-100 text-amber-800" },
  sold_out: { label: "Sold out", className: "bg-gray-100 text-gray-700" },
};

export default function Inventory() {
  const { user } = useAuth();
  const { products } = useVendor();
  const [locationProductId, setLocationProductId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationStock, setLocationStock] = useState("");
  const planTier = user?.planTier ?? "starter";
  const hasBasicInventory = hasFeature(planTier, "basic-inventory-tracking");
  const hasAdvancedInventory = hasFeature(
    planTier,
    "advanced-inventory-tracking",
  );
  const hasLowStockAlerts = hasFeature(planTier, "low-stock-alerts");
  const hasMultiLocation = hasFeature(planTier, "multi-location-stock");

  const lowStockProducts = hasLowStockAlerts
    ? getLowStockProducts(products)
    : [];

  if (!hasBasicInventory) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-gray-600">
            Track stock levels across your catalog.
          </p>
        </div>
        <FeatureUpgradeBanner featureName="Inventory tracking" requiredTier="Starter" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-gray-600">
            Monitor stock levels and restock before you miss a sale.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/products">
            <Pencil className="mr-2 h-4 w-4" />
            Edit stock on products
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In stock</CardDescription>
            <CardTitle className="text-xl text-whatsapp-green">
              {getInStockCount(products)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sold out</CardDescription>
            <CardTitle className="text-xl">{getSoldOutCount(products)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {hasLowStockAlerts && lowStockProducts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {lowStockProducts.length} product
                {lowStockProducts.length === 1 ? "" : "s"} running low
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Stock at or below each product&apos;s alert threshold. Restock
                soon to avoid missed sales.
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasAdvancedInventory && (
        <FeatureUpgradeBanner featureName="Advanced inventory tracking (auto-decrement and sold-out hide)" />
      )}

      {hasAdvancedInventory && (
        <Card className="border-whatsapp-green/30 bg-whatsapp-green/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Advanced inventory active</CardTitle>
            <CardDescription>
              Stock auto-decrements when orders are paid. Sold-out products are
              hidden from your storefront.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!hasLowStockAlerts && (
        <FeatureUpgradeBanner featureName="Low-stock alerts" />
      )}

      {hasMultiLocation && isApiMode() && products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Multi-location stock
            </CardTitle>
            <CardDescription>
              Track stock per shop or warehouse for a product.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={locationProductId}
              onChange={(event) => setLocationProductId(event.target.value)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Location (e.g. Lagos shop)"
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
            />
            <Input
              type="number"
              placeholder="Stock qty"
              value={locationStock}
              onChange={(event) => setLocationStock(event.target.value)}
            />
            <Button
              type="button"
              onClick={async () => {
                if (!locationProductId || !locationName.trim()) return;
                await vendorToolsRepository.upsertStockLocation(
                  locationProductId,
                  locationName.trim(),
                  Number(locationStock) || 0,
                );
                toast.success("Stock location saved.");
                setLocationName("");
                setLocationStock("");
              }}
            >
              Save location
            </Button>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Package className="h-10 w-10 text-gray-400" />
            <p className="mt-4 font-medium text-gray-900">No products yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Add products to start tracking inventory.
            </p>
            <Button asChild className="mt-4 bg-whatsapp-green hover:bg-whatsapp-green/90">
              <Link to="/dashboard/products">Add products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Alert at</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const status = getInventoryStatus(product);
                const statusMeta = STATUS_LABELS[status];
                const threshold = getProductLowStockThreshold(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getProductPrimaryImage(product) && (
                          <img
                            src={getProductPrimaryImage(product)}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{threshold}</TableCell>
                    <TableCell>
                      <Badge className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
