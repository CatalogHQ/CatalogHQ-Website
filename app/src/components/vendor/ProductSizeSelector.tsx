import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getSizingTypesForCategory,
  type ProductCategoryId,
} from "@/lib/product-categories";
import { SIZING_TYPES, type SizingTypeId } from "@/lib/sizing-types";

type ProductSizeSelectorProps = {
  productCategory: ProductCategoryId;
  sizingType: SizingTypeId;
  sizes: string[];
  customSizes: string;
  onSizingTypeChange: (value: SizingTypeId) => void;
  onSizesChange: (sizes: string[]) => void;
  onCustomSizesChange: (value: string) => void;
};

export default function ProductSizeSelector({
  productCategory,
  sizingType,
  sizes,
  customSizes,
  onSizingTypeChange,
  onSizesChange,
  onCustomSizesChange,
}: ProductSizeSelectorProps) {
  const definition = SIZING_TYPES[sizingType];
  const sizingOptions = getSizingTypesForCategory(productCategory);

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      onSizesChange(sizes.filter((entry) => entry !== size));
      return;
    }
    onSizesChange([...sizes, size]);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium leading-none">Sizing type</p>
        <Select
          value={sizingType}
          onValueChange={(value) => onSizingTypeChange(value as SizingTypeId)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose sizing type" />
          </SelectTrigger>
          <SelectContent>
            {sizingOptions.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sizingType !== "none" && (
          <p className="text-xs text-gray-500">{definition.description}</p>
        )}
      </div>

      {sizingType !== "none" &&
        sizingType !== "custom" &&
        sizingType !== "one_size" &&
        definition.sizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium leading-none">
              Select available sizes
            </p>
            <div className="flex flex-wrap gap-2">
              {definition.sizes.map((size) => {
                const selected = sizes.includes(size);
                const equivalent = definition.equivalents?.[size];

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors",
                      selected
                        ? "border-whatsapp-green bg-whatsapp-green/10 text-whatsapp-dark"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <span className="block text-sm font-semibold">{size}</span>
                    {equivalent && definition.equivalentLabel && (
                      <span className="block text-[10px] text-gray-500">
                        {definition.equivalentLabel}: {equivalent}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {sizingType === "custom" && (
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">Custom sizes</p>
          <Input
            placeholder="Small, Medium, Large"
            value={customSizes}
            onChange={(event) => onCustomSizesChange(event.target.value)}
          />
          <p className="text-xs text-gray-500">
            Separate multiple sizes with commas.
          </p>
        </div>
      )}

      {sizingType === "one_size" && (
        <p className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
          This product will show as <strong>One Size</strong> on your storefront.
        </p>
      )}
    </div>
  );
}
