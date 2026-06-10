import { Link } from "react-router";

type FeatureUpgradeBannerProps = {
  featureName: string;
  requiredTier?: string;
};

export default function FeatureUpgradeBanner({
  featureName,
  requiredTier = "Pro",
}: FeatureUpgradeBannerProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {featureName} is available on the {requiredTier} plan.{" "}
      <Link to="/#pricing" className="font-semibold underline">
        Upgrade your plan
      </Link>{" "}
      to unlock it.
    </div>
  );
}
