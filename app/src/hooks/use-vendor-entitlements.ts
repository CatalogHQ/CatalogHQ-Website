import { useMemo } from "react";
import { hasFeature } from "@/data/plans";
import { useAuth } from "@/contexts/AuthContext";
import type { PlanTier } from "@/data/plans";

export function useVendorEntitlements() {
  const { user } = useAuth();

  return useMemo(() => {
    const planTier = user?.planTier ?? "starter";
    const subscription = user?.subscription;
    const subscriptionExempt = user?.subscriptionExempt ?? false;
    const hasActiveAccess =
      subscriptionExempt ||
      subscription?.hasActiveAccess !== false;
    const isHardBlocked =
      !subscriptionExempt && (subscription?.isHardBlocked ?? false);
    const isGracePeriod = subscription?.status === "grace";
    const graceEndsAt = subscription?.graceEndsAt;

    const canUseFeature = (featureId: string) => {
      if (!hasActiveAccess || isHardBlocked) {
        return false;
      }
      return hasFeature(planTier, featureId);
    };

    return {
      planTier: planTier as PlanTier,
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
