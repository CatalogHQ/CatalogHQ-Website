import { PlanTier } from '@prisma/client';

export type PlanCatalogDefault = {
  tier: PlanTier;
  name: string;
  monthlyPriceKobo: number;
  priceSubtext: string;
  tagline: string;
  cta: string;
  popular: boolean;
  productLimit: number;
  active: boolean;
  sortOrder: number;
  featureBullets: string[];
};

const COMING_SOON = ' (Coming soon)';

const SHARED_PRICING_FEATURE_BULLETS = [
  'Shareable storefront link',
  'Flutterwave checkout',
  'NIN-verified vendor badge',
  'Sell 24/7 while offline',
  'Order notifications',
  'Basic order management',
  'Buyer order status page',
  'WhatsApp share on products',
  'Product variants (size, color)',
  'Inventory tracking with sold-out hide',
  'Low-stock alerts',
  'Verified buyer reviews',
  'Sales analytics dashboard',
  'Delivery zones and fees',
  'Discount codes and flash sales',
  'Order search and bulk actions',
  'Abandoned cart SMS recovery',
  'Staff roles and activity log',
  'Multi-location inventory',
  'Advanced analytics (repeat rate, AOV)',
  `Customer referral links${COMING_SOON}`,
  `Loyalty points${COMING_SOON}`,
  'WhatsApp order confirmations',
] as const;

const PRODUCT_LIMITS: Record<PlanTier, number> = {
  [PlanTier.starter]: 15,
  [PlanTier.pro]: 30,
  [PlanTier.growth]: 50,
  [PlanTier.business]: 100,
};

function buildFeatureBullets(tier: PlanTier): string[] {
  return [`Up to ${PRODUCT_LIMITS[tier]} products`, ...SHARED_PRICING_FEATURE_BULLETS];
}

export const DEFAULT_PRICING_FEATURE_BULLETS: Record<PlanTier, string[]> = {
  starter: buildFeatureBullets(PlanTier.starter),
  pro: buildFeatureBullets(PlanTier.pro),
  growth: buildFeatureBullets(PlanTier.growth),
  business: buildFeatureBullets(PlanTier.business),
};

export const DEFAULT_PLAN_CATALOG: PlanCatalogDefault[] = [
  {
    tier: PlanTier.starter,
    name: 'Starter',
    monthlyPriceKobo: 300_000,
    priceSubtext: 'less than ₦100 a day',
    tagline:
      'For vendors who are tired of chasing transfers and answering the same questions all day. Get a real store, a real checkout, and your time back.',
    cta: 'Get Starter',
    popular: false,
    productLimit: 15,
    active: true,
    sortOrder: 1,
    featureBullets: DEFAULT_PRICING_FEATURE_BULLETS.starter,
  },
  {
    tier: PlanTier.pro,
    name: 'Pro',
    monthlyPriceKobo: 500_000,
    priceSubtext: 'less than ₦167 a day',
    tagline:
      'For vendors who are already selling and want to grow without chaos.',
    cta: 'Get Pro',
    popular: true,
    productLimit: 30,
    active: true,
    sortOrder: 2,
    featureBullets: DEFAULT_PRICING_FEATURE_BULLETS.pro,
  },
  {
    tier: PlanTier.growth,
    name: 'Growth',
    monthlyPriceKobo: 800_000,
    priceSubtext: 'less than ₦267 a day',
    tagline:
      'For vendors with a growing catalog who need more product slots without switching platforms.',
    cta: 'Get Growth',
    popular: false,
    productLimit: 50,
    active: true,
    sortOrder: 3,
    featureBullets: DEFAULT_PRICING_FEATURE_BULLETS.growth,
  },
  {
    tier: PlanTier.business,
    name: 'Business',
    monthlyPriceKobo: 1_200_000,
    priceSubtext: 'For teams and multi-location stores',
    tagline:
      'Staff roles, multi-location stock, and advanced analytics for scaling brands.',
    cta: 'Get Business',
    popular: false,
    productLimit: 100,
    active: false,
    sortOrder: 4,
    featureBullets: DEFAULT_PRICING_FEATURE_BULLETS.business,
  },
];

export function getDefaultPlanCatalogEntry(
  tier: PlanTier,
): PlanCatalogDefault {
  const entry = DEFAULT_PLAN_CATALOG.find((plan) => plan.tier === tier);
  if (!entry) {
    throw new Error(`Unknown plan tier: ${tier}`);
  }

  return {
    ...entry,
    featureBullets: [...entry.featureBullets],
  };
}
