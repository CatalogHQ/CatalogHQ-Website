import type { PlanTier } from "@/data/plans";

export type PlanCatalogEntry = {
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

export type UpdatePlanCatalogInput = {
  name?: string;
  monthlyPriceKobo?: number;
  priceSubtext?: string;
  tagline?: string;
  cta?: string;
  popular?: boolean;
  productLimit?: number;
  active?: boolean;
  featureBullets?: string[];
  sortOrder?: number;
};
