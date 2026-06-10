import { readJson, writeJson } from "@/lib/local-storage";
import { slugify } from "@/lib/slug";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { StoreRepository } from "@/lib/repositories/store-repository";
import { authRepository } from "@/lib/repositories/local-auth-repository";
import type {
  PublicStoreView,
  Store,
  StoreSetupInput,
} from "@/types/domain";

function normalizeStore(store: Store): Store {
  return { ...store };
}

export class LocalStoreRepository implements StoreRepository {
  private getStores(): Store[] {
    return readJson<Store[]>(STORAGE_KEYS.stores, []);
  }

  private saveStores(stores: Store[]): void {
    writeJson(STORAGE_KEYS.stores, stores);
  }

  async getByVendorId(vendorId: string): Promise<Store | null> {
    const store = this.getStores().find((entry) => entry.vendorId === vendorId);
    return store ? normalizeStore(store) : null;
  }

  async getBySlug(slug: string): Promise<Store | null> {
    const normalized = slugify(slug);
    const store = this.getStores().find((entry) => entry.slug === normalized);
    return store ? normalizeStore(store) : null;
  }

  async getPublicBySlug(slug: string): Promise<PublicStoreView | null> {
    const store = await this.getBySlug(slug);
    if (!store?.setupComplete) return null;

    const vendor = authRepository.getUserById(store.vendorId);
    return {
      ...store,
      planTier: vendor?.planTier ?? "starter",
    };
  }

  async isSlugTaken(slug: string, excludeVendorId?: string): Promise<boolean> {
    const normalized = slugify(slug);
    return this.getStores().some(
      (store) =>
        store.slug === normalized && store.vendorId !== excludeVendorId,
    );
  }

  async save(vendorId: string, input: StoreSetupInput): Promise<Store> {
    const stores = this.getStores();
    const existingIndex = stores.findIndex(
      (store) => store.vendorId === vendorId,
    );

    const existing =
      existingIndex >= 0 ? stores[existingIndex] : undefined;
    const nin = input.nin.replace(/\D/g, "");
    const ninChanged = existing ? existing.nin !== nin : false;

    let verificationStatus = existing?.verificationStatus;
    let verificationSubmittedAt = existing?.verificationSubmittedAt;
    let verifiedAt = existing?.verifiedAt;
    let rejectionReason = existing?.rejectionReason;

    if (ninChanged && verificationStatus === "verified") {
      verificationStatus = "pending";
      verifiedAt = undefined;
      verificationSubmittedAt = new Date().toISOString();
      rejectionReason = undefined;
    } else if (ninChanged && verificationStatus === "rejected") {
      verificationStatus = "pending";
      verificationSubmittedAt = new Date().toISOString();
      rejectionReason = undefined;
    }

    const store: Store = {
      vendorId,
      slug: slugify(input.slug),
      businessName: input.businessName.trim(),
      bio: input.bio.trim(),
      whatsapp: input.whatsapp.replace(/\D/g, ""),
      nin,
      category: input.category?.trim() || undefined,
      city: input.city?.trim() || undefined,
      state: input.state?.trim() || undefined,
      setupComplete: existing?.setupComplete ?? false,
      verificationStatus,
      verificationSubmittedAt,
      verifiedAt,
      rejectionReason,
    };

    if (existingIndex >= 0) {
      stores[existingIndex] = store;
    } else {
      stores.push(store);
    }

    this.saveStores(stores);
    return store;
  }

  async completeSetup(vendorId: string, input: StoreSetupInput): Promise<Store> {
    const store = await this.save(vendorId, input);
    store.setupComplete = true;

    if (store.verificationStatus !== "verified") {
      store.verificationStatus = "pending";
      store.verificationSubmittedAt =
        store.verificationSubmittedAt ?? new Date().toISOString();
      store.rejectionReason = undefined;
    }

    const stores = this.getStores();
    const index = stores.findIndex((entry) => entry.vendorId === vendorId);
    if (index >= 0) {
      stores[index] = store;
      this.saveStores(stores);
    }

    return store;
  }
}

export const storeRepository: StoreRepository = new LocalStoreRepository();
