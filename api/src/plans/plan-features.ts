import { PlanTier } from '@prisma/client';

export type PlanFeatureDefinition = {
  id: string;
  tier: PlanTier;
  comingSoon?: boolean;
};

const TIER_ORDER: PlanTier[] = [
  PlanTier.starter,
  PlanTier.pro,
  PlanTier.growth,
  PlanTier.business,
];

export const PLAN_FEATURES: PlanFeatureDefinition[] = [
  { id: 'storefront-link', tier: PlanTier.starter },
  { id: 'flutterwave-checkout', tier: PlanTier.starter },
  { id: 'sell-offline', tier: PlanTier.starter },
  { id: 'order-notifications', tier: PlanTier.starter },
  { id: 'order-management', tier: PlanTier.starter },
  { id: 'order-status-page', tier: PlanTier.starter },
  { id: 'whatsapp-share', tier: PlanTier.starter },
  { id: 'product-limit', tier: PlanTier.starter },
  { id: 'product-variants', tier: PlanTier.starter },
  { id: 'basic-inventory-tracking', tier: PlanTier.starter },
  { id: 'delivery-types', tier: PlanTier.starter },
  { id: 'payment-links', tier: PlanTier.starter },
  { id: 'quick-reply-templates', tier: PlanTier.starter },
  { id: 'reserved-orders', tier: PlanTier.starter },
  { id: 'verifiable-receipts', tier: PlanTier.starter },
  { id: 'order-search', tier: PlanTier.starter },
  { id: 'product-limit-pro', tier: PlanTier.pro },
  { id: 'advanced-inventory-tracking', tier: PlanTier.pro },
  { id: 'low-stock-alerts', tier: PlanTier.pro },
  { id: 'verified-reviews', tier: PlanTier.pro },
  { id: 'analytics-dashboard', tier: PlanTier.pro },
  { id: 'referral-links', tier: PlanTier.pro, comingSoon: true },
  { id: 'discount-codes', tier: PlanTier.pro },
  { id: 'flash-sales', tier: PlanTier.pro },
  { id: 'delivery-zones', tier: PlanTier.pro },
  { id: 'abandoned-cart', tier: PlanTier.pro },
  { id: 'loyalty-points', tier: PlanTier.pro, comingSoon: true },
  { id: 'whatsapp-confirmations', tier: PlanTier.pro },
  { id: 'product-limit-growth', tier: PlanTier.growth },
  { id: 'staff-roles', tier: PlanTier.business },
  { id: 'multi-location-stock', tier: PlanTier.business },
  { id: 'advanced-analytics', tier: PlanTier.business },
];

export const PLAN_FEATURE_IDS = PLAN_FEATURES.map((feature) => feature.id);

export function tierIncludes(tier: PlanTier, featureTier: PlanTier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(featureTier);
}

export function getPlanFeatureById(id: string): PlanFeatureDefinition | undefined {
  return PLAN_FEATURES.find((feature) => feature.id === id);
}

export function hasPlanFeature(tier: PlanTier, featureId: string): boolean {
  const feature = getPlanFeatureById(featureId);
  if (!feature || feature.comingSoon) {
    return false;
  }
  return tierIncludes(tier, feature.tier);
}
