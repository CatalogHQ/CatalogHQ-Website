import { Badge } from "@/components/ui/badge";
import {
  getSizeEquivalent,
  getSizingType,
  type SizingTypeId,
} from "@/lib/sizing-types";

type ProductSizeDisplayProps = {
  sizingType: SizingTypeId | null | undefined;
  sizes: string[] | undefined;
  compact?: boolean;
};

export default function ProductSizeDisplay({
  sizingType,
  sizes,
  compact = false,
}: ProductSizeDisplayProps) {
  if (!sizingType || sizingType === "none" || !sizes?.length) {
    return null;
  }

  const type = getSizingType(sizingType);

  if (compact) {
    return (
      <p className="line-clamp-1 text-xs text-gray-500">
        {sizes.join(" · ")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-900">Available sizes</p>
        <p className="text-xs text-gray-500">{type.label}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3 sm:grid-cols-4 sm:gap-2.5">
        {sizes.map((size) => {
          const equivalent = getSizeEquivalent(sizingType, size);

          return (
            <div
              key={size}
              className="flex flex-col items-center rounded-lg border bg-gray-50 px-2 py-2 text-center"
            >
              <span className="text-sm font-semibold text-gray-900">{size}</span>
              {equivalent && type.equivalentLabel && (
                <span className="mt-0.5 text-[10px] leading-tight text-gray-500">
                  {type.equivalentLabel}: {equivalent}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {type.equivalentLabel && sizes.some((size) => getSizeEquivalent(sizingType, size)) && (
        <p className="text-xs text-gray-400">
          Equivalents are approximate guides for customers.
        </p>
      )}
    </div>
  );
}

export function ProductSizeBadges({
  sizingType,
  sizes,
}: {
  sizingType: SizingTypeId | null | undefined;
  sizes: string[] | undefined;
}) {
  if (!sizingType || sizingType === "none" || !sizes?.length) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {sizes.slice(0, compactLimit(sizes.length)).map((size) => (
        <Badge key={size} variant="outline" className="text-[10px] px-1.5 py-0">
          {size}
        </Badge>
      ))}
      {sizes.length > 4 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          +{sizes.length - 4}
        </Badge>
      )}
    </div>
  );
}

function compactLimit(total: number) {
  return Math.min(total, 4);
}
