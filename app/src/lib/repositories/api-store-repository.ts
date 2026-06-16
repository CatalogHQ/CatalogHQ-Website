import { apiClient } from "@/lib/api-client";
import type { StoreRepository } from "@/lib/repositories/store-repository";
import type { PublicStoreView, Store, StoreSetupInput } from "@/types/domain";

type StoreResponse = {
  store: Store | null;
};

type PublicStoreResponse = {
  store: PublicStoreView | null;
};

type SlugAvailabilityResponse = {
  available: boolean;
};

export class ApiStoreRepository implements StoreRepository {
  async getByVendorId(_vendorId: string): Promise<Store | null> {
    return this.getMyStore();
  }

  async getMyStore(): Promise<Store | null> {
    const response = await apiClient<StoreResponse>("/stores/me");
    return response.store;
  }

  async getBySlug(slug: string): Promise<Store | null> {
    const publicStore = await this.getPublicBySlug(slug);
    if (!publicStore) return null;
    return {
      ...publicStore,
      nin: "",
    };
  }

  async getPublicBySlug(slug: string): Promise<PublicStoreView | null> {
    const response = await apiClient<PublicStoreResponse>(
      `/stores/public/${encodeURIComponent(slug)}`,
    );
    return response.store;
  }

  async isSlugTaken(slug: string, excludeVendorId?: string): Promise<boolean> {
    void excludeVendorId;
    const response = await apiClient<SlugAvailabilityResponse>(
      `/stores/me/slug/${encodeURIComponent(slug)}/available`,
    );
    return !response.available;
  }

  async save(vendorId: string, input: StoreSetupInput): Promise<Store> {
    void vendorId;
    return apiClient<Store>("/stores/me", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async completeSetup(vendorId: string, input: StoreSetupInput): Promise<Store> {
    void vendorId;
    return apiClient<Store>("/stores/me/complete-setup", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export const apiStoreRepository = new ApiStoreRepository();
