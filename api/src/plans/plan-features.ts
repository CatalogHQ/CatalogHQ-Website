import { PlanTier } from '@prisma/client';

export type PlanFeatureDefinition = {
  id: string;
  comingSoon?: boolean;
};

export const PLAN_FEATURES: PlanFeatureDefinition[] = [
  { id: 'storefront-link' },
  { id: 'flutterwave-checkout' },
  { id: 'sell-offline' },
  { id: 'nin-verified-vendors' },
  { id: 'order-notifications' },
  { id: 'order-management' },
  { id: 'order-status-page' },
  { id: 'whatsapp-share' },
  { id: 'product-variants' },
  { id: 'basic-inventory-tracking' },
  { id: 'delivery-types' },
  { id: 'payment-links' },
  { id: 'quick-reply-templates' },
  { id: 'reserved-orders' },
  { id: 'verifiable-receipts' },
  { id: 'order-search' },
  { id: 'advanced-inventory-tracking' },
  { id: 'low-stock-alerts' },
  { id: 'verified-reviews' },
  { id: 'analytics-dashboard' },
  { id: 'referral-links', comingSoon: true },
  { id: 'discount-codes' },
  { id: 'flash-sales' },
  { id: 'delivery-zones' },
  { id: 'abandoned-cart' },
  { id: 'loyalty-points', comingSoon: true },
  { id: 'whatsapp-confirmations' },
  { id: 'staff-roles' },
  { id: 'multi-location-stock' },
  { id: 'advanced-analytics' },
];

export const PLAN_FEATURE_IDS = PLAN_FEATURES.map((feature) => feature.id);

export function getPlanFeatureById(id: string): PlanFeatureDefinition | undefined {
  return PLAN_FEATURES.find((feature) => feature.id === id);
}

export function hasPlanFeature(_tier: PlanTier, featureId: string): boolean {
  const feature = getPlanFeatureById(featureId);
  if (!feature || feature.comingSoon) {
    return false;
  }
  return true;
}
