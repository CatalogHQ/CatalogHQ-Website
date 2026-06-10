import { readJson, writeJson } from "@/lib/local-storage";
import { slugify } from "@/lib/slug";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Store } from "@/types/domain";
import type { ProductRepository } from "@/lib/repositories/product-repository";
import { normalizeDeliveryOptions } from "@/lib/delivery-types";
import { inferProductCategory } from "@/lib/product-categories";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  type Product,
  type ProductInput,
} from "@/types/domain";

function generateId(): string {
  return crypto.randomUUID();
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    images: product.images ?? (product.imageUrl ? [product.imageUrl] : []),
    colors: product.colors ?? [],
    productCategory:
      product.productCategory ?? inferProductCategory(product.name),
    sizingType: product.sizingType ?? "none",
    sizes: product.sizes ?? [],
    deliveryOptions: normalizeDeliveryOptions(product.deliveryOptions),
    lowStockThreshold:
      product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
  };
}

export class LocalProductRepository implements ProductRepository {
  private getProducts(): Product[] {
    return readJson<Product[]>(STORAGE_KEYS.products, []);
  }

  private saveProducts(products: Product[]): void {
    writeJson(STORAGE_KEYS.products, products);
  }

  async listByStoreId(storeId: string): Promise<Product[]> {
    return this.getProducts()
      .filter((product) => product.storeId === storeId)
      .map(normalizeProduct)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async listPublishedBySlug(slug: string): Promise<Product[]> {
    const stores = readJson<Store[]>(STORAGE_KEYS.stores, []);
    const store = stores.find((entry) => entry.slug === slugify(slug));
    if (!store?.setupComplete) return [];
    const products = await this.listByStoreId(store.vendorId);
    return products.filter((product) => product.published);
  }

  async getById(storeId: string, productId: string): Promise<Product | null> {
    const product = this.getProducts().find(
      (entry) => entry.storeId === storeId && entry.id === productId,
    );
    return product ? normalizeProduct(product) : null;
  }

  async getPublishedBySlug(
    slug: string,
    productId: string,
  ): Promise<Product | null> {
    const stores = readJson<Store[]>(STORAGE_KEYS.stores, []);
    const store = stores.find((entry) => entry.slug === slugify(slug));
    if (!store?.setupComplete) return null;
    const product = await this.getById(store.vendorId, productId);
    return product?.published ? product : null;
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.getProducts().filter(
      (product) => product.storeId === storeId,
    ).length;
  }

  async create(storeId: string, input: ProductInput): Promise<Product> {
    const product: Product = {
      id: generateId(),
      storeId,
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      images: input.images ?? [],
      colors: input.colors ?? [],
      productCategory: input.productCategory,
      sizingType: input.sizingType ?? "none",
      sizes: input.sizes ?? [],
      deliveryOptions: normalizeDeliveryOptions(input.deliveryOptions),
      imageUrl: input.images?.[0],
      stock: input.stock,
      lowStockThreshold:
        input.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
      published: input.published,
      createdAt: new Date().toISOString(),
    };

    const products = this.getProducts();
    products.push(product);
    this.saveProducts(products);
    return product;
  }

  async update(
    storeId: string,
    productId: string,
    input: ProductInput,
  ): Promise<Product> {
    const products = this.getProducts();
    const index = products.findIndex(
      (product) => product.storeId === storeId && product.id === productId,
    );

    if (index < 0) {
      throw new Error("Product not found.");
    }

    const updated: Product = {
      ...products[index],
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      images: input.images ?? [],
      colors: input.colors ?? [],
      productCategory: input.productCategory,
      sizingType: input.sizingType ?? "none",
      sizes: input.sizes ?? [],
      deliveryOptions: normalizeDeliveryOptions(input.deliveryOptions),
      imageUrl: input.images?.[0],
      stock: input.stock,
      lowStockThreshold:
        input.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
      published: input.published,
    };

    products[index] = updated;
    this.saveProducts(products);
    return updated;
  }

  async remove(storeId: string, productId: string): Promise<void> {
    const products = this.getProducts().filter(
      (product) =>
        !(product.storeId === storeId && product.id === productId),
    );
    this.saveProducts(products);
  }

  async decrementStock(
    storeId: string,
    productId: string,
    quantity: number,
  ): Promise<Product> {
    const products = this.getProducts();
    const index = products.findIndex(
      (product) => product.storeId === storeId && product.id === productId,
    );

    if (index < 0) {
      throw new Error("Product not found.");
    }

    const updated: Product = {
      ...products[index],
      stock: Math.max(0, products[index].stock - quantity),
    };

    products[index] = updated;
    this.saveProducts(products);
    return normalizeProduct(updated);
  }
}

export const productRepository: ProductRepository =
  new LocalProductRepository();
