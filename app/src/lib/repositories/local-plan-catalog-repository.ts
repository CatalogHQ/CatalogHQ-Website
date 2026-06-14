import {
  PLANS,
  getPricingFeaturesForTier,
  type PlanTier,
} from "@/data/plans";
import type { PlanCatalogEntry, UpdatePlanCatalogInput } from "@/types/plan-catalog";
import type { ApiPlanCatalogRepository } from "@/lib/repositories/api-plan-catalog-repository";

const PRODUCT_LIMITS: Record<PlanTier, number> = {
  starter: 15,
  pro: 30,
  growth: 50,
  business: 100,
};

function toLocalCatalogEntry(plan: (typeof PLANS)[number]): PlanCatalogEntry {
  const monthlyPriceKobo = parseInt(plan.price.replace(/[^\d]/g, ""), 10) * 100;

  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    monthlyPriceKobo,
    priceSubtext: plan.priceSubtext,
    tagline: plan.tagline,
    cta: plan.cta,
    popular: Boolean(plan.popular),
    productLimit: PRODUCT_LIMITS[plan.id],
    active: true,
    featureBullets: getPricingFeaturesForTier(plan.id),
    sortOrder: PLANS.findIndex((entry) => entry.id === plan.id) + 1,
  };
}

function buildBusinessEntry(): PlanCatalogEntry {
  return {
    id: "business",
    name: "Business",
    price: "₦12,000",
    monthlyPriceKobo: 1_200_000,
    priceSubtext: "For teams and multi-location stores",
    tagline:
      "Staff roles, multi-location stock, and advanced analytics for scaling brands.",
    cta: "Get Business",
    popular: false,
    productLimit: PRODUCT_LIMITS.business,
    active: false,
    featureBullets: getPricingFeaturesForTier("business"),
    sortOrder: 4,
  };
}

function buildInitialLocalCatalog(): PlanCatalogEntry[] {
  const fromPlans = PLANS.map(toLocalCatalogEntry);
  if (!fromPlans.some((entry) => entry.id === "business")) {
    fromPlans.push(buildBusinessEntry());
  }
  return fromPlans.sort((a, b) => a.sortOrder - b.sortOrder);
}

const LOCAL_CATALOG: PlanCatalogEntry[] = buildInitialLocalCatalog();

export class LocalPlanCatalogRepository implements Pick<
  ApiPlanCatalogRepository,
  "getPublicCatalog" | "listAdminPlans" | "updatePlan" | "resetPlanDefaults"
> {
  private catalog = LOCAL_CATALOG.map((entry) => ({ ...entry }));

  getPublicCatalog(): Promise<PlanCatalogEntry[]> {
    return Promise.resolve(
      this.catalog
        .filter((entry) => entry.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  listAdminPlans(): Promise<PlanCatalogEntry[]> {
    return Promise.resolve(
      [...this.catalog].sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  updatePlan(
    tier: PlanTier,
    input: UpdatePlanCatalogInput,
  ): Promise<PlanCatalogEntry> {
    const index = this.catalog.findIndex((entry) => entry.id === tier);
    if (index === -1) {
      return Promise.reject(new Error("Plan not found."));
    }

    const current = this.catalog[index];
    const monthlyPriceKobo = input.monthlyPriceKobo ?? current.monthlyPriceKobo;
    const updated: PlanCatalogEntry = {
      ...current,
      ...input,
      monthlyPriceKobo,
      price:
        input.monthlyPriceKobo !== undefined
          ? `₦${Math.round(monthlyPriceKobo / 100).toLocaleString("en-NG")}`
          : current.price,
    };

    this.catalog[index] = updated;
    return Promise.resolve(updated);
  }

  resetPlanDefaults(tier: PlanTier): Promise<PlanCatalogEntry> {
    const fromPlans = PLANS.find((plan) => plan.id === tier);
    const resetEntry = fromPlans
      ? toLocalCatalogEntry(fromPlans)
      : tier === "business"
        ? buildBusinessEntry()
        : null;

    if (!resetEntry) {
      return Promise.reject(new Error("Plan not found."));
    }
    const index = this.catalog.findIndex((entry) => entry.id === tier);
    if (index === -1) {
      this.catalog.push(resetEntry);
    } else {
      this.catalog[index] = resetEntry;
    }

    return Promise.resolve(resetEntry);
  }
}

export const localPlanCatalogRepository = new LocalPlanCatalogRepository();
