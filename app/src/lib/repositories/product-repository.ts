import type { Product, ProductInput } from "@/types/domain";

export interface ProductRepository {
  listByStoreId(storeId: string): Promise<Product[]>;
  listPublishedBySlug(slug: string): Promise<Product[]>;
  getById(storeId: string, productId: string): Promise<Product | null>;
  getPublishedBySlug(
    slug: string,
    productId: string,
  ): Promise<Product | null>;
  create(storeId: string, input: ProductInput): Promise<Product>;
  update(storeId: string, productId: string, input: ProductInput): Promise<Product>;
  remove(storeId: string, productId: string): Promise<void>;
  countByStoreId(storeId: string): Promise<number>;
  decrementStock(
    storeId: string,
    productId: string,
    quantity: number,
  ): Promise<Product>;
}
