import { PlanTier } from '@prisma/client';

export type PlanCatalogDto = {
  id: PlanTier;
  name: string;
  price: string;
  monthlyPriceKobo: number;
  priceSubtext: string;
  tagline: string;
  cta: string;
  popular: boolean;
  productLimit: number;
  active: boolean;
  featureBullets: string[];
  sortOrder: number;
};

export function formatPlanPrice(monthlyPriceKobo: number): string {
  const naira = Math.round(monthlyPriceKobo / 100);
  return `₦${naira.toLocaleString('en-NG')}`;
}

type PlanCatalogRow = {
  tier: PlanTier;
  name: string;
  monthlyPriceKobo: number;
  priceSubtext: string;
  tagline: string;
  cta: string;
  popular: boolean;
  productLimit: number;
  active: boolean;
  featureBullets: unknown;
  sortOrder: number;
};

export function toPlanCatalogDto(entry: PlanCatalogRow): PlanCatalogDto {
  const featureBullets = Array.isArray(entry.featureBullets)
    ? entry.featureBullets.filter(
        (item): item is string => typeof item === 'string',
      )
    : [];

  return {
    id: entry.tier,
    name: entry.name,
    price: formatPlanPrice(entry.monthlyPriceKobo),
    monthlyPriceKobo: entry.monthlyPriceKobo,
    priceSubtext: entry.priceSubtext,
    tagline: entry.tagline,
    cta: entry.cta,
    popular: entry.popular,
    productLimit: entry.productLimit,
    active: entry.active,
    featureBullets,
    sortOrder: entry.sortOrder,
  };
}
