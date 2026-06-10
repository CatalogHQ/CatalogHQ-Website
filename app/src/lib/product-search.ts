import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/product-categories";
import type { Product } from "@/types/domain";

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function getCategoryLabel(categoryId: Product["productCategory"]): string {
  return (
    PRODUCT_CATEGORY_OPTIONS.find((entry) => entry.id === categoryId)?.label ??
    categoryId
  );
}

function productSearchText(product: Product): string {
  return [
    product.name,
    product.description,
    getCategoryLabel(product.productCategory),
    ...product.colors,
    ...product.sizes,
  ]
    .join(" ")
    .toLowerCase();
}

export function searchProducts(
  products: Product[],
  query: string,
): Product[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return products;

  const terms = normalized.split(/\s+/).filter(Boolean);

  return products.filter((product) => {
    const haystack = productSearchText(product);
    return terms.every((term) => haystack.includes(term));
  });
}
