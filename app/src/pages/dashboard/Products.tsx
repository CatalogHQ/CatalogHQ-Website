import { useState } from "react";
import { Link } from "react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ProductFormDialog from "@/components/vendor/ProductFormDialog";
import FlutterwaveFeeNotice from "@/components/vendor/FlutterwaveFeeNotice";
import FlutterwaveFeeBreakdown from "@/components/vendor/FlutterwaveFeeBreakdown";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { formatDeliverySummary } from "@/lib/delivery-types";
import { formatSizesSummary } from "@/lib/sizing-types";
import { getProductLimit, PLAN_TIER_LABELS } from "@/data/plans";
import { formatNaira } from "@/lib/format";
import { getProductPrimaryImage, parseColorsInput } from "@/lib/product-utils";
import type { Product } from "@/types/domain";
import type { ProductFormValues } from "@/lib/store-schemas";
import { resolveProductSizes } from "@/lib/store-schemas";

export default function Products() {
  const { user } = useAuth();
  const { products, createProduct, updateProduct, deleteProduct } = useVendor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const productLimit = getProductLimit(user?.planTier ?? "starter");
  const atLimit = products.length >= productLimit;

  const openCreateDialog = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      const { sizingType, sizes } = resolveProductSizes(values);
      const payload = {
        name: values.name,
        description: editingProduct?.description ?? "",
        price: values.price,
        stock: values.stock,
        colors: parseColorsInput(values.colors ?? ""),
        productCategory: values.productCategory,
        sizingType,
        sizes,
        images: values.images.slice(0, 2),
        deliveryOptions: values.deliveryOptions,
        lowStockThreshold: values.lowStockThreshold,
        published: values.published,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success("Product updated.");
      } else {
        if (atLimit) {
          toast.error(
            `Your ${PLAN_TIER_LABELS[user?.planTier ?? "starter"]} plan allows up to ${productLimit} products.`,
          );
          return;
        }
        await createProduct(payload);
        toast.success("Product added.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save product.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.id);
    toast.success("Product deleted.");
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-gray-600">
            {products.length} of {productLimit} products on your{" "}
            {PLAN_TIER_LABELS[user?.planTier ?? "starter"]} plan.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          disabled={atLimit}
          className="bg-whatsapp-green hover:bg-whatsapp-green/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>

      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have reached your product limit.{" "}
          <Link to="/#pricing" className="font-semibold underline">
            Upgrade your plan
          </Link>{" "}
          to add more products.
        </div>
      )}

      <FlutterwaveFeeNotice />

      {products.length === 0 ? (
        <Empty className="border bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>
              Add your first product to start selling from your storefront link.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={openCreateDialog}
              className="bg-whatsapp-green hover:bg-whatsapp-green/90"
            >
              Add your first product
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Listed price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const primaryImage = getProductPrimaryImage(product);

                return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="line-clamp-1 text-sm text-gray-500">
                            {product.description}
                          </p>
                        )}
                        {product.colors?.length > 0 && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {product.colors.join(", ")}
                          </p>
                        )}
                        {formatSizesSummary(product.sizingType, product.sizes) && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatSizesSummary(product.sizingType, product.sizes)}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p>{formatNaira(product.price)}</p>
                    <FlutterwaveFeeBreakdown
                      amountNgn={product.price}
                      compact
                      className="mt-0.5"
                    />
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDeliverySummary(product.deliveryOptions ?? ["pickup"])}
                  </TableCell>
                  <TableCell>
                    {!product.published ? (
                      <Badge variant="secondary">Hidden</Badge>
                    ) : product.stock <= 0 ? (
                      <Badge variant="secondary">Sold out</Badge>
                    ) : (
                      <Badge className="bg-whatsapp-green hover:bg-whatsapp-green">
                        Live
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteTarget?.name}&quot; from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
