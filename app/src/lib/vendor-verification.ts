import type { Store, VendorVerificationStatus } from "@/types/domain";

export type { VendorVerificationStatus };

export const VERIFICATION_STATUS_LABELS: Record<
  VendorVerificationStatus,
  string
> = {
  unsubmitted: "Not submitted",
  pending: "Under review",
  verified: "Verified",
  rejected: "Action required",
};

export function resolveVerificationStatus(
  store: Store,
): VendorVerificationStatus {
  if (store.verificationStatus) {
    return store.verificationStatus;
  }

  if (!store.setupComplete || !store.nin) {
    return "unsubmitted";
  }

  return "pending";
}

export function isVendorVerified(store: Store): boolean {
  return resolveVerificationStatus(store) === "verified";
}

export function getVerificationStatusDescription(
  status: VendorVerificationStatus,
): string {
  switch (status) {
    case "unsubmitted":
      return "Submit your NIN during store setup to start vendor verification.";
    case "pending":
      return "Your NIN is being verified. This usually completes within a few minutes.";
    case "verified":
      return "Your store is verified. Customers will see a verified badge on your storefront.";
    case "rejected":
      return "We couldn't verify your details. Update your NIN in settings and save to resubmit.";
  }
}
