import type { StoredUser, Store } from "@/types/domain";

export function vendorHasActiveSubscription(
  user: StoredUser | null | undefined,
): boolean {
  if (!user) {
    return false;
  }
  return Boolean(
    user.subscriptionExempt || user.subscription?.hasActiveAccess,
  );
}

export function getPostAuthDashboardPath(
  user: StoredUser,
  store: Store | null,
): string {
  if (!vendorHasActiveSubscription(user)) {
    return "/dashboard/billing";
  }
  if (!store?.setupComplete) {
    return "/dashboard/setup";
  }
  return "/dashboard";
}
