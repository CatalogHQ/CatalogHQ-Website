import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PLANS,
  PRODUCT_LIMITS,
  getPricingFeaturesForTier,
  type Plan,
  type PlanTier,
} from "@/data/plans";
import { isApiMode } from "@/lib/use-api";
import { apiPlanCatalogRepository } from "@/lib/repositories/api-plan-catalog-repository";
import { localPlanCatalogRepository } from "@/lib/repositories/local-plan-catalog-repository";
import type { PlanCatalogEntry } from "@/types/plan-catalog";

type PlanCatalogContextValue = {
  plans: PlanCatalogEntry[];
  isLoading: boolean;
  getProductLimit: (tier: PlanTier) => number;
  getFeatureBullets: (tier: PlanTier) => string[];
  getPlan: (tier: PlanTier) => PlanCatalogEntry | undefined;
  refreshCatalog: () => Promise<void>;
};

const PlanCatalogContext = createContext<PlanCatalogContextValue | null>(null);

const planCatalogRepository = isApiMode()
  ? apiPlanCatalogRepository
  : localPlanCatalogRepository;

function buildFallbackCatalog(): PlanCatalogEntry[] {
  return PLANS.map((plan, index) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    monthlyPriceKobo: parseInt(plan.price.replace(/[^\d]/g, ""), 10) * 100,
    priceSubtext: plan.priceSubtext,
    tagline: plan.tagline,
    cta: plan.cta,
    popular: Boolean(plan.popular),
    productLimit: PRODUCT_LIMITS[plan.id],
    active: true,
    featureBullets: getPricingFeaturesForTier(plan.id),
    sortOrder: index + 1,
  }));
}

export function toDisplayPlan(entry: PlanCatalogEntry): Plan {
  return {
    id: entry.id,
    name: entry.name,
    price: entry.price,
    priceSubtext: entry.priceSubtext,
    tagline: entry.tagline,
    cta: entry.cta,
    popular: entry.popular,
  };
}

export function PlanCatalogProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<PlanCatalogEntry[]>(buildFallbackCatalog());
  const [isLoading, setIsLoading] = useState(true);

  const refreshCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const catalog = await planCatalogRepository.getPublicCatalog();
      if (catalog.length > 0) {
        setPlans(catalog);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const catalogByTier = useMemo(
    () => new Map(plans.map((plan) => [plan.id, plan])),
    [plans],
  );

  const value = useMemo<PlanCatalogContextValue>(
    () => ({
      plans,
      isLoading,
      getProductLimit: (tier) =>
        catalogByTier.get(tier)?.productLimit ?? PRODUCT_LIMITS[tier],
      getFeatureBullets: (tier) =>
        catalogByTier.get(tier)?.featureBullets ??
        getPricingFeaturesForTier(tier),
      getPlan: (tier) => catalogByTier.get(tier),
      refreshCatalog,
    }),
    [catalogByTier, isLoading, plans, refreshCatalog],
  );

  return (
    <PlanCatalogContext.Provider value={value}>
      {children}
    </PlanCatalogContext.Provider>
  );
}

export function usePlanCatalog(): PlanCatalogContextValue {
  const context = useContext(PlanCatalogContext);
  if (!context) {
    throw new Error("usePlanCatalog must be used within PlanCatalogProvider");
  }
  return context;
}
