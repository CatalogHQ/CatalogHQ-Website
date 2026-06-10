import { apiClient } from "@/lib/api-client";
import type { ProductRepository } from "@/lib/repositories/product-repository";
import type { Product, ProductInput } from "@/types/domain";

type ProductsResponse = {
  products: Product[];
};

export class ApiProductRepository implements ProductRepository {
  async listByStoreId(_storeId: string): Promise<Product[]> {
    return apiClient<Product[]>("/stores/me/products");
  }

  async listPublishedBySlug(slug: string): Promise<Product[]> {
    const response = await apiClient<ProductsResponse>(
      `/stores/public/${encodeURIComponent(slug)}/products`,
    );
    return response.products;
  }

  async getById(_storeId: string, productId: string): Promise<Product | null> {
    try {
      return await apiClient<Product>(`/stores/me/products/${productId}`);
    } catch {
      return null;
    }
  }

  async getPublishedBySlug(
    slug: string,
    productId: string,
  ): Promise<Product | null> {
    try {
      return await apiClient<Product>(
        `/stores/public/${encodeURIComponent(slug)}/products/${productId}`,
      );
    } catch {
      return null;
    }
  }

  async create(_storeId: string, input: ProductInput): Promise<Product> {
    return apiClient<Product>("/stores/me/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async update(
    _storeId: string,
    productId: string,
    input: ProductInput,
  ): Promise<Product> {
    return apiClient<Product>(`/stores/me/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async remove(_storeId: string, productId: string): Promise<void> {
    await apiClient(`/stores/me/products/${productId}`, {
      method: "DELETE",
    });
  }

  async countByStoreId(storeId: string): Promise<number> {
    const products = await this.listByStoreId(storeId);
    return products.length;
  }

  async decrementStock(
    _storeId: string,
    _productId: string,
    _quantity: number,
  ): Promise<Product> {
    throw new Error(
      "Stock is decremented automatically when orders are created.",
    );
  }
}

export const apiProductRepository = new ApiProductRepository();
