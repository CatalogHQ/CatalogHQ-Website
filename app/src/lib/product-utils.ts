import type { Product } from "@/types/domain";
import { optimizeProductImageUrl } from "@/lib/image-url";

export function getProductImages(product: Product): string[] {
  const raw =
    product.images?.length
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  return raw.map(optimizeProductImageUrl);
}
export function getProductPrimaryImage(product: Product): string | undefined {
  return getProductImages(product)[0];
}

export function parseColorsInput(value: string): string[] {
  return value
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);
}

export function formatColorsForInput(colors: string[] | undefined): string {
  return colors?.join(", ") ?? "";
}
