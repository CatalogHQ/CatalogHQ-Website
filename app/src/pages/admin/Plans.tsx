import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePlanCatalog } from "@/contexts/PlanCatalogContext";
import { PLAN_TIER_LABELS, type PlanTier } from "@/data/plans";
import { isApiMode } from "@/lib/use-api";
import { apiPlanCatalogRepository } from "@/lib/repositories/api-plan-catalog-repository";
import { localPlanCatalogRepository } from "@/lib/repositories/local-plan-catalog-repository";
import type { PlanCatalogEntry } from "@/types/plan-catalog";

const planCatalogRepository = isApiMode()
  ? apiPlanCatalogRepository
  : localPlanCatalogRepository;

type PlanDraft = {
  name: string;
  monthlyPriceNaira: string;
  priceSubtext: string;
  tagline: string;
  cta: string;
  productLimit: string;
  sortOrder: string;
  popular: boolean;
  active: boolean;
  featureBulletsText: string;
};

function toDraft(plan: PlanCatalogEntry): PlanDraft {
  return {
    name: plan.name,
    monthlyPriceNaira: String(Math.round(plan.monthlyPriceKobo / 100)),
    priceSubtext: plan.priceSubtext,
    tagline: plan.tagline,
    cta: plan.cta,
    productLimit: String(plan.productLimit),
    sortOrder: String(plan.sortOrder),
    popular: plan.popular,
    active: plan.active,
    featureBulletsText: plan.featureBullets.join("\n"),
  };
}

function parseFeatureBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AdminPlans() {
  const { refreshCatalog } = usePlanCatalog();
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PlanDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingTier, setSavingTier] = useState<PlanTier | null>(null);
  const [resettingTier, setResettingTier] = useState<PlanTier | null>(null);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const catalog = await planCatalogRepository.listAdminPlans();
      setPlans(catalog);
      setDrafts(
        Object.fromEntries(catalog.map((plan) => [plan.id, toDraft(plan)])),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load plans.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const updateDraft = (tier: PlanTier, patch: Partial<PlanDraft>) => {
    setDrafts((current) => ({
      ...current,
      [tier]: { ...current[tier], ...patch },
    }));
  };

  const handleSave = async (tier: PlanTier) => {
    const draft = drafts[tier];
    if (!draft) return;

    const monthlyPriceNaira = Number.parseInt(draft.monthlyPriceNaira, 10);
    const productLimit = Number.parseInt(draft.productLimit, 10);
    const sortOrder = Number.parseInt(draft.sortOrder, 10);

    if (!Number.isFinite(monthlyPriceNaira) || monthlyPriceNaira < 0) {
      toast.error("Enter a valid monthly price in naira.");
      return;
    }

    if (!Number.isFinite(productLimit) || productLimit < 1) {
      toast.error("Product limit must be at least 1.");
      return;
    }

    setSavingTier(tier);
    try {
      const updated = await planCatalogRepository.updatePlan(tier, {
        name: draft.name.trim(),
        monthlyPriceKobo: monthlyPriceNaira * 100,
        priceSubtext: draft.priceSubtext.trim(),
        tagline: draft.tagline.trim(),
        cta: draft.cta.trim(),
        popular: draft.popular,
        active: draft.active,
        productLimit,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined,
        featureBullets: parseFeatureBullets(draft.featureBulletsText),
      });

      setPlans((current) =>
        current.map((plan) => (plan.id === tier ? updated : plan)),
      );
      setDrafts((current) => ({ ...current, [tier]: toDraft(updated) }));
      await refreshCatalog();
      toast.success(`${PLAN_TIER_LABELS[tier]} plan updated.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save plan.",
      );
    } finally {
      setSavingTier(null);
    }
  };

  const handleResetDefaults = async (tier: PlanTier) => {
    setResettingTier(tier);
    try {
      const updated = await planCatalogRepository.resetPlanDefaults(tier);
      setPlans((current) =>
        current.map((plan) => (plan.id === tier ? updated : plan)),
      );
      setDrafts((current) => ({ ...current, [tier]: toDraft(updated) }));
      await refreshCatalog();
      toast.success(`${PLAN_TIER_LABELS[tier]} restored to default copy.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reset plan.",
      );
    } finally {
      setResettingTier(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans and pricing</h1>
        <p className="mt-1 text-gray-600">
          Set monthly prices, product limits, and landing-page plan copy. Use
          restore defaults to pull in the feature list already defined for each
          tier.
        </p>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => {
          const draft = drafts[plan.id];
          if (!draft) return null;

          return (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {PLAN_TIER_LABELS[plan.id]}
                    </CardTitle>
                    <CardDescription>
                      Shown on the homepage pricing section when active.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.popular && (
                      <Badge className="bg-whatsapp-green text-white hover:bg-whatsapp-green">
                        Most popular
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {draft.active ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-name`}>Display name</Label>
                    <Input
                      id={`${plan.id}-name`}
                      value={draft.name}
                      onChange={(event) =>
                        updateDraft(plan.id, { name: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-price`}>Monthly price (₦)</Label>
                    <Input
                      id={`${plan.id}-price`}
                      inputMode="numeric"
                      value={draft.monthlyPriceNaira}
                      onChange={(event) =>
                        updateDraft(plan.id, {
                          monthlyPriceNaira: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-subtext`}>Price subtext</Label>
                    <Input
                      id={`${plan.id}-subtext`}
                      value={draft.priceSubtext}
                      onChange={(event) =>
                        updateDraft(plan.id, {
                          priceSubtext: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-cta`}>Button label</Label>
                    <Input
                      id={`${plan.id}-cta`}
                      value={draft.cta}
                      onChange={(event) =>
                        updateDraft(plan.id, { cta: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-limit`}>Product limit</Label>
                    <Input
                      id={`${plan.id}-limit`}
                      inputMode="numeric"
                      value={draft.productLimit}
                      onChange={(event) =>
                        updateDraft(plan.id, {
                          productLimit: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${plan.id}-sort`}>Sort order</Label>
                    <Input
                      id={`${plan.id}-sort`}
                      inputMode="numeric"
                      value={draft.sortOrder}
                      onChange={(event) =>
                        updateDraft(plan.id, { sortOrder: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.id}-tagline`}>Tagline</Label>
                  <Textarea
                    id={`${plan.id}-tagline`}
                    rows={2}
                    value={draft.tagline}
                    onChange={(event) =>
                      updateDraft(plan.id, { tagline: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${plan.id}-features`}>
                    Feature bullets (one per line)
                  </Label>
                  <Textarea
                    id={`${plan.id}-features`}
                    rows={8}
                    value={draft.featureBulletsText}
                    onChange={(event) =>
                      updateDraft(plan.id, {
                        featureBulletsText: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Switch
                      checked={draft.active}
                      onCheckedChange={(active) =>
                        updateDraft(plan.id, { active })
                      }
                    />
                    Show on pricing page
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Switch
                      checked={draft.popular}
                      onCheckedChange={(popular) =>
                        updateDraft(plan.id, { popular })
                      }
                    />
                    Mark as most popular
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                    disabled={savingTier === plan.id}
                    onClick={() => void handleSave(plan.id)}
                  >
                    Save plan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={resettingTier === plan.id}
                    onClick={() => void handleResetDefaults(plan.id)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
