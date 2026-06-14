import { useMemo } from "react";
import { hasFeature } from "@/data/plans";
import { useAuth } from "@/contexts/AuthContext";
import type { PlanTier } from "@/data/plans";

export function useVendorEntitlements() {
  const { user } = useAuth();

  return useMemo(() => {
    const subscription = user?.subscription;
    const subscriptionExempt = user?.subscriptionExempt ?? false;
    const hasActiveAccess =
      subscriptionExempt || (subscription?.hasActiveAccess ?? false);
    const paidPlanTier =
      subscription?.paidPlanTier ??
      (hasActiveAccess ? (user?.planTier as PlanTier) : undefined);
    const isHardBlocked =
      !subscriptionExempt && (subscription?.isHardBlocked ?? false);
    const isGracePeriod = subscription?.status === "grace";
    const graceEndsAt = subscription?.graceEndsAt;

    const canUseFeature = (featureId: string) => {
      if (!hasActiveAccess || isHardBlocked || !paidPlanTier) {
        return false;
      }
      return hasFeature(paidPlanTier, featureId);
    };

    return {
      planTier: (paidPlanTier ?? "starter") as PlanTier,
      paidPlanTier,
      subscription,
      subscriptionExempt,
      hasActiveAccess,
      isHardBlocked,
      isGracePeriod,
      graceEndsAt,
      canUseFeature,
    };
  }, [user]);
}
