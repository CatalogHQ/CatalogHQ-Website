import type {
  PublicStoreView,
  Store,
  StoreSetupInput,
} from "@/types/domain";

export interface StoreRepository {
  getByVendorId(vendorId: string): Promise<Store | null>;
  getMyStore?(): Promise<Store | null>;
  getBySlug(slug: string): Promise<Store | null>;
  getPublicBySlug(slug: string): Promise<PublicStoreView | null>;
  isSlugTaken(slug: string, excludeVendorId?: string): Promise<boolean>;
  save(vendorId: string, input: StoreSetupInput): Promise<Store>;
  completeSetup(vendorId: string, input: StoreSetupInput): Promise<Store>;
}
