import { Store, VendorVerificationStatus } from '@prisma/client';

export type StoreDto = {
  vendorId: string;
  slug: string;
  businessName: string;
  bio: string;
  whatsapp: string;
  nin: string;
  category?: string;
  city?: string;
  state?: string;
  setupComplete: boolean;
  verificationStatus?: VendorVerificationStatus;
  verificationSubmittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
};

export type PublicStoreDto = Omit<StoreDto, 'nin'> & {
  planTier: 'starter' | 'pro' | 'business';
  deliveryZones: unknown;
};

export function toStoreDto(store: Store): StoreDto {
  return {
    vendorId: store.vendorId,
    slug: store.slug,
    businessName: store.businessName,
    bio: store.bio,
    whatsapp: store.whatsapp,
    nin: store.nin,
    category: store.category ?? undefined,
    city: store.city ?? undefined,
    state: store.state ?? undefined,
    setupComplete: store.setupComplete,
    verificationStatus: store.verificationStatus,
    verificationSubmittedAt: store.verificationSubmittedAt?.toISOString(),
    verifiedAt: store.verifiedAt?.toISOString(),
    rejectionReason: store.rejectionReason ?? undefined,
  };
}

export function toPublicStoreDto(
  store: Store,
  planTier: 'starter' | 'pro' | 'business',
): PublicStoreDto {
  const dto = toStoreDto(store);
  const { nin: _nin, ...publicFields } = dto;
  return {
    ...publicFields,
    planTier,
    deliveryZones: store.deliveryZones,
  };
}
