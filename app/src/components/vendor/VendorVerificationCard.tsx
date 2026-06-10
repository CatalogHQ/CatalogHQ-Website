import { Link } from "react-router";
import {
  BadgeCheck,
  Clock3,
  ShieldAlert,
  ShieldOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { maskNin } from "@/lib/format";
import {
  getVerificationStatusDescription,
  resolveVerificationStatus,
  VERIFICATION_STATUS_LABELS,
  type VendorVerificationStatus,
} from "@/lib/vendor-verification";
import type { Store } from "@/types/domain";
import { cn } from "@/lib/utils";

type VendorVerificationCardProps = {
  store: Store;
  variant?: "card" | "banner";
};

const STATUS_STYLES: Record<
  VendorVerificationStatus,
  { badge: string; icon: typeof BadgeCheck; accent: string }
> = {
  verified: {
    badge: "bg-whatsapp-green/10 text-whatsapp-dark hover:bg-whatsapp-green/10",
    icon: BadgeCheck,
    accent: "border-whatsapp-green/30 bg-whatsapp-green/5",
  },
  pending: {
    badge: "bg-amber-100 text-amber-900 hover:bg-amber-100",
    icon: Clock3,
    accent: "border-amber-200 bg-amber-50",
  },
  rejected: {
    badge: "bg-red-100 text-red-800 hover:bg-red-100",
    icon: ShieldAlert,
    accent: "border-red-200 bg-red-50",
  },
  unsubmitted: {
    badge: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    icon: ShieldOff,
    accent: "border-gray-200 bg-gray-50",
  },
};

export default function VendorVerificationCard({
  store,
  variant = "card",
}: VendorVerificationCardProps) {
  const status = resolveVerificationStatus(store);
  const meta = STATUS_STYLES[status];
  const Icon = meta.icon;
  const description = getVerificationStatusDescription(status);

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "rounded-lg border px-4 py-3",
          meta.accent,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  Vendor verification
                </p>
                <Badge className={meta.badge}>
                  {VERIFICATION_STATUS_LABELS[status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>
          </div>
          {status !== "verified" && (
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to="/dashboard/settings">
                {status === "unsubmitted" ? "Complete setup" : "View details"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Vendor verification</CardTitle>
          <Badge className={meta.badge}>
            {VERIFICATION_STATUS_LABELS[status]}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="rounded-lg border bg-gray-50 px-3 py-2.5">
            <p className="text-gray-500">NIN on file</p>
            <p className="mt-0.5 font-medium text-gray-900">
              {store.nin ? maskNin(store.nin) : "Not submitted"}
            </p>
          </div>
          {status === "verified" && store.verifiedAt && (
            <div className="rounded-lg border bg-gray-50 px-3 py-2.5">
              <p className="text-gray-500">Verified on</p>
              <p className="mt-0.5 font-medium text-gray-900">
                {new Date(store.verifiedAt).toLocaleDateString("en-NG", {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          )}
          {status === "rejected" && store.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-red-700">Reason</p>
              <p className="mt-0.5 font-medium text-red-900">
                {store.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {status === "verified" ? (
          <p className="text-sm text-gray-600">
            Your verified badge is visible to customers on your storefront.
          </p>
        ) : status === "pending" ? (
          <p className="text-sm text-gray-600">
            No action needed right now. We'll notify you when verification is
            complete.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            {status === "rejected"
              ? "Update your NIN below and save to resubmit for review."
              : "Complete store setup with your NIN to submit for verification."}
          </p>
        )}

        {status === "unsubmitted" && !store.setupComplete && (
          <Button asChild className="bg-whatsapp-green hover:bg-whatsapp-green/90">
            <Link to="/dashboard/setup">Complete store setup</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
