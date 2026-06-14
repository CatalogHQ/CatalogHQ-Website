import type { PlanTier } from "@/data/plans";
import type { VendorSubscription } from "@/types/subscription";
import type { DeliveryZone } from "@/lib/delivery-zones";
import type { DeliveryTypeId } from "@/lib/delivery-types";
import type { ProductCategoryId } from "@/lib/product-categories";
import type { SizingTypeId } from "@/lib/sizing-types";

export type VendorVerificationStatus =
  | "unsubmitted"
  | "pending"
  | "verified"
  | "rejected";

export type AuthSession = {
  userId: string;
  token: string;
};

export type UserRole = "vendor" | "admin";

export type StoredUser = {
  id: string;
  email: string;
  phone?: string;
  passwordHash: string;
  planTier: PlanTier;
  subscriptionExempt?: boolean;
  subscription?: Pick<
    VendorSubscription,
    | "status"
    | "planTier"
    | "currentPeriodEnd"
    | "graceEndsAt"
    | "isHardBlocked"
    | "hasActiveAccess"
  >;
  role?: UserRole;
  createdAt: string;
};

export type Store = {
  vendorId: string;
  slug: string;
  businessName: string;
  legalFirstName?: string;
  legalLastName?: string;
  bio: string;
  whatsapp: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookHandle?: string;
  xHandle?: string;
  nin: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  setupComplete: boolean;
  verificationStatus?: VendorVerificationStatus;
  verificationSubmittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  payoutSetupComplete?: boolean;
  payoutSetupAt?: string;
  payoutBankName?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
};

export type PublicStoreView = Store & {
  planTier: PlanTier;
  deliveryZones?: DeliveryZone[];
  payoutSetupComplete: boolean;
  storeUnavailable?: boolean;
};

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export type Product = {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  /** @deprecated Use images instead. Kept for older saved products. */
  imageUrl?: string;
  images: string[];
  colors: string[];
  productCategory: ProductCategoryId;
  sizingType: SizingTypeId;
  sizes: string[];
  deliveryOptions: DeliveryTypeId[];
  stock: number;
  /** Alert when stock falls to this level or below */
  lowStockThreshold?: number;
  published: boolean;
  createdAt: string;
};

export function getProductLowStockThreshold(product: Product): number {
  return product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
}

export type StoreSetupInput = Omit<Store, "vendorId" | "setupComplete">;

export type ProductInput = Omit<Product, "id" | "storeId" | "createdAt">;
