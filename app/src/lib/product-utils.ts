import type { Product } from "@/types/domain";

export function getProductImages(product: Product): string[] {
  if (product.images?.length) return product.images;
  if (product.imageUrl) return [product.imageUrl];
  return [];
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
