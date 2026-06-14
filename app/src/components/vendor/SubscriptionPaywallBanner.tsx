import { Link } from "react-router";
import { useVendorEntitlements } from "@/hooks/use-vendor-entitlements";

export default function SubscriptionPaywallBanner() {
  const { isHardBlocked, isGracePeriod, graceEndsAt, subscriptionExempt } =
    useVendorEntitlements();

  if (subscriptionExempt || (!isHardBlocked && !isGracePeriod)) {
    return null;
  }

  if (isGracePeriod && graceEndsAt) {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Subscription payment failed</p>
        <p className="mt-1">
          Renew by{" "}
          {new Date(graceEndsAt).toLocaleDateString("en-NG", {
            dateStyle: "medium",
          })}{" "}
          to keep your store open.
        </p>
        <Link
          to="/dashboard/billing"
          className="mt-2 inline-block font-semibold underline"
        >
          Renew subscription
        </Link>
      </div>
    );
  }

  if (isHardBlocked) {
    return (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p className="font-medium">Your store is paused</p>
        <p className="mt-1">
          Subscribe to a plan to reopen your dashboard and storefront checkout.
        </p>
        <Link
          to="/dashboard/billing"
          className="mt-2 inline-block font-semibold underline"
        >
          Go to billing
        </Link>
      </div>
    );
  }

  return null;
}
