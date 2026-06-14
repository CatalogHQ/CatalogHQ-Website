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

export const DEFAULT_PRICING_FEATURE_BULLETS: Record<PlanTier, string[]> = {
  starter: [
    'Shareable storefront link',
    'Flutterwave checkout',
    'Sell 24/7 while offline',
    'Order notifications',
    'Basic order management',
    'Buyer order status page',
    'WhatsApp share on products',
    'Up to 15 products',
    'Product variants (size, color)',
    'Basic inventory tracking',
    'Delivery types',
  ],
  pro: [
    'Everything in Starter, plus:',
    'Up to 30 products',
    'Advanced inventory tracking + sold-out hide',
    'Low-stock alerts',
    'Verified buyer reviews',
    'Sales analytics dashboard',
    'Delivery zones and fees',
    'Discount codes and flash sales',
    'Order search and bulk actions',
    'Abandoned cart SMS recovery',
    `Customer referral links${COMING_SOON}`,
    `Loyalty points${COMING_SOON}`,
    'WhatsApp order confirmations',
  ],
  growth: [
    'Everything in Pro, plus:',
    'Up to 50 products',
  ],
  business: [
    'Everything in Pro, plus:',
    'Up to 100 products',
    'Staff roles and activity log',
    'Multi-location inventory',
    'Advanced analytics (repeat rate, AOV)',
    'Priority support',
  ],
};

export const DEFAULT_PLAN_CATALOG: PlanCatalogDefault[] = [
  {
    tier: PlanTier.starter,
    name: 'Starter',
    monthlyPriceKobo: 300_000,
    priceSubtext: 'Less than ₦100 a day',
    tagline:
      'Perfect for new vendors. Stop chasing transfers and answering "how much?" all day.',
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
    priceSubtext: 'Less than ₦167 a day',
    tagline:
      'Advanced inventory, analytics, and growth tools for stores ready to scale.',
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
    priceSubtext: 'Less than ₦267 a day',
    tagline:
      'More catalog room and the same Pro tools for vendors with a larger inventory.',
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
