import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import NumericFormInput from "@/components/vendor/NumericFormInput";
import FlutterwaveFeeBreakdown from "@/components/vendor/FlutterwaveFeeBreakdown";
import ProductImageUpload from "@/components/vendor/ProductImageUpload";
import ProductSizeSelector from "@/components/vendor/ProductSizeSelector";
import {
  formatColorsForInput,
  getProductImages,
} from "@/lib/product-utils";
import {
  inferProductCategory,
  isSizingTypeAllowedForCategory,
  PRODUCT_CATEGORY_OPTIONS,
  type ProductCategoryId,
} from "@/lib/product-categories";
import {
  formatCustomSizesInput,
  type SizingTypeId,
} from "@/lib/sizing-types";
import {
  DEFAULT_DELIVERY_OPTIONS,
  DELIVERY_TYPES,
  type DeliveryTypeId,
} from "@/lib/delivery-types";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  type Product,
} from "@/types/domain";
import { productSchema, type ProductFormValues } from "@/lib/store-schemas";

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

const defaultValues: ProductFormValues = {
  name: "",
  price: 0,
  stock: 0,
  colors: "",
  productCategory: "other",
  sizingType: "none",
  sizes: [],
  customSizes: "",
  images: [],
  deliveryOptions: DEFAULT_DELIVERY_OPTIONS,
  lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  published: true,
};

function resetSizingForCategory(
  form: ReturnType<typeof useForm<ProductFormValues>>,
  category: ProductCategoryId,
) {
  const currentSizingType = form.getValues("sizingType");
  if (!isSizingTypeAllowedForCategory(category, currentSizingType)) {
    form.setValue("sizingType", "none", { shouldValidate: true });
    form.setValue("sizes", []);
    form.setValue("customSizes", "");
  }
}

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: ProductFormDialogProps) {
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const productName = useWatch({ control: form.control, name: "name" }) ?? "";
  const productCategory =
    useWatch({ control: form.control, name: "productCategory" }) ?? "other";
  const sizingType =
    useWatch({ control: form.control, name: "sizingType" }) ?? "none";
  const sizes = useWatch({ control: form.control, name: "sizes" }) ?? [];
  const customSizes = useWatch({ control: form.control, name: "customSizes" }) ?? "";
  const listPrice = useWatch({ control: form.control, name: "price" }) ?? 0;
  const numericFieldKey = `${product?.id ?? "new"}-${open ? "open" : "closed"}`;

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        stock: product.stock,
        colors: formatColorsForInput(product.colors),
        productCategory: product.productCategory ?? inferProductCategory(product.name),
        sizingType: product.sizingType ?? "none",
        sizes: product.sizes ?? [],
        customSizes:
          product.sizingType === "custom"
            ? formatCustomSizesInput(product.sizes)
            : "",
        images: getProductImages(product).slice(0, 2),
        deliveryOptions: product.deliveryOptions?.length
          ? product.deliveryOptions
          : DEFAULT_DELIVERY_OPTIONS,
        lowStockThreshold:
          product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
        published: product.published,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [product, open, form]);

  useEffect(() => {
    if (product || categoryManuallySet || !productName.trim()) return;

    const inferred = inferProductCategory(productName);
    if (inferred !== form.getValues("productCategory")) {
      form.setValue("productCategory", inferred, { shouldValidate: true });
      resetSizingForCategory(form, inferred);
    }
  }, [product, productName, form, categoryManuallySet]);

  const handleCategoryChange = (value: ProductCategoryId) => {
    setCategoryManuallySet(true);
    form.setValue("productCategory", value, { shouldValidate: true });
    resetSizingForCategory(form, value);
  };

  const handleSizingTypeChange = (value: SizingTypeId) => {
    form.setValue("sizingType", value, { shouldValidate: true });

    if (value === "one_size") {
      form.setValue("sizes", ["One Size"]);
      form.setValue("customSizes", "");
      return;
    }

    form.setValue("sizes", []);
    form.setValue("customSizes", "");
  };

  const handleDeliveryToggle = (
    deliveryId: DeliveryTypeId,
    checked: boolean,
  ) => {
    const current = form.getValues("deliveryOptions");
    const next = checked
      ? [...new Set([...current, deliveryId])]
      : current.filter((id) => id !== deliveryId);
    form.setValue("deliveryOptions", next, { shouldValidate: true });
  };

  const handleSubmit = async (values: ProductFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  const categoryWasInferred =
    !product &&
    !categoryManuallySet &&
    productName.trim().length > 0 &&
    inferProductCategory(productName) === productCategory;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCategoryManuallySet(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Add details customers will see on your storefront.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ankara Two-Piece Set" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      handleCategoryChange(value as ProductCategoryId)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {categoryWasInferred
                      ? "Detected from your product name. Change it if needed."
                      : "Sizing options are based on this product type."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colors</FormLabel>
                  <FormControl>
                    <Input placeholder="Red, Blue, Gold" {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate multiple colors with commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sizingType"
              render={() => (
                <FormItem>
                  <FormControl>
                    <ProductSizeSelector
                      productCategory={productCategory}
                      sizingType={sizingType}
                      sizes={sizes}
                      customSizes={customSizes}
                      onSizingTypeChange={handleSizingTypeChange}
                      onSizesChange={(sizes) =>
                        form.setValue("sizes", sizes, { shouldValidate: true })
                      }
                      onCustomSizesChange={(value) =>
                        form.setValue("customSizes", value, {
                          shouldValidate: true,
                        })
                      }
                    />
                  </FormControl>
                  {form.formState.errors.sizingType?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.sizingType.message}
                    </p>
                  )}
                  {form.formState.errors.sizes?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.sizes.message}
                    </p>
                  )}
                  {form.formState.errors.customSizes?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.customSizes.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listed price (₦)</FormLabel>
                    <FormControl>
                      <NumericFormInput
                        key={`price-${numericFieldKey}`}
                        placeholder="e.g. 5000"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      What customers pay at checkout. Include Flutterwave
                      processing in this amount.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock quantity</FormLabel>
                    <FormControl>
                      <NumericFormInput
                        key={`stock-${numericFieldKey}`}
                        placeholder="e.g. 10"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low-stock alert</FormLabel>
                    <FormControl>
                      <NumericFormInput
                        key={`low-stock-${numericFieldKey}`}
                        placeholder="e.g. 5"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Alert when stock hits this level or below.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {listPrice > 0 && (
              <FlutterwaveFeeBreakdown
                amountNgn={listPrice}
                label="Listed price (per item)"
              />
            )}

            <FormField
              control={form.control}
              name="deliveryOptions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery available</FormLabel>
                  <FormDescription>
                    Choose how customers can receive this product.
                  </FormDescription>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DELIVERY_TYPES.map((deliveryType) => {
                      const checked = field.value.includes(deliveryType.id);
                      const checkboxId = `delivery-${deliveryType.id}`;

                      return (
                        <div
                          key={deliveryType.id}
                          className="flex items-start gap-2 rounded-lg border p-3"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={checked}
                            onCheckedChange={(value) =>
                              handleDeliveryToggle(
                                deliveryType.id,
                                value === true,
                              )
                            }
                          />
                          <Label
                            htmlFor={checkboxId}
                            className="cursor-pointer font-normal leading-snug"
                          >
                            {deliveryType.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product pictures</FormLabel>
                  <FormControl>
                    <ProductImageUpload
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="published"
                      />
                    </FormControl>
                    <Label htmlFor="published" className="font-normal">
                      Show on my storefront
                    </Label>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-whatsapp-green hover:bg-whatsapp-green/90"
              >
                {product ? "Save changes" : "Add product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
