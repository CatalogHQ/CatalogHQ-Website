import { Product } from '@prisma/client';

export type ProductDto = {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images: string[];
  colors: string[];
  productCategory: string;
  sizingType: string;
  sizes: string[];
  deliveryOptions: string[];
  stock: number;
  lowStockThreshold: number;
  published: boolean;
  createdAt: string;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function toProductDto(product: Product): ProductDto {
  const images = toStringArray(product.images);

  return {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl ?? images[0],
    images,
    colors: toStringArray(product.colors),
    productCategory: product.productCategory,
    sizingType: product.sizingType,
    sizes: toStringArray(product.sizes),
    deliveryOptions: toStringArray(product.deliveryOptions),
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    published: product.published,
    createdAt: product.createdAt.toISOString(),
  };
}
