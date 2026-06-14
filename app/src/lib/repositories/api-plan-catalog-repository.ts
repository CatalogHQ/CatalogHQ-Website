import { apiClient } from "@/lib/api-client";
import type {
  PlanCatalogEntry,
  UpdatePlanCatalogInput,
} from "@/types/plan-catalog";
import type { PlanTier } from "@/data/plans";

export class ApiPlanCatalogRepository {
  getPublicCatalog(): Promise<PlanCatalogEntry[]> {
    return apiClient<PlanCatalogEntry[]>("/plans/catalog");
  }

  listAdminPlans(): Promise<PlanCatalogEntry[]> {
    return apiClient<PlanCatalogEntry[]>("/admin/plans");
  }

  updatePlan(
    tier: PlanTier,
    input: UpdatePlanCatalogInput,
  ): Promise<PlanCatalogEntry> {
    return apiClient<PlanCatalogEntry>(`/admin/plans/${tier}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  resetPlanDefaults(tier: PlanTier): Promise<PlanCatalogEntry> {
    return apiClient<PlanCatalogEntry>(`/admin/plans/${tier}/reset-defaults`, {
      method: "POST",
    });
  }
}

export const apiPlanCatalogRepository = new ApiPlanCatalogRepository();
