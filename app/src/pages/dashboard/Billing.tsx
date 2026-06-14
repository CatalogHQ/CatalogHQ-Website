import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanCatalog } from "@/contexts/PlanCatalogContext";
import { PLAN_TIER_LABELS, type PlanTier } from "@/data/plans";
import { formatNaira } from "@/lib/format";
import { subscriptionRepository } from "@/lib/repositories";
import type {
  SubscriptionPayment,
  VendorSubscription,
} from "@/types/subscription";

const STATUS_LABELS: Record<VendorSubscription["status"], string> = {
  pending: "Payment required",
  active: "Active",
  past_due: "Past due",
  grace: "Grace period",
  expired: "Expired",
  canceled: "Canceled",
};

export default function Billing() {
  const { refreshUser } = useAuth();
  const { plans, getFeatureBullets } = usePlanCatalog();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<VendorSubscription | null>(
    null,
  );
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [sub, history] = await Promise.all([
          subscriptionRepository.getSubscription(),
          subscriptionRepository.listPayments(),
        ]);
        if (!cancelled) {
          setSubscription(sub);
          setPayments(history);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load billing details.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const status = searchParams.get("status");
    const reference = searchParams.get("reference");
    if (status !== "success") {
      return;
    }

    void (async () => {
      try {
        if (reference) {
          await subscriptionRepository.confirm(reference);
        }
        await refreshUser();
        const sub = await subscriptionRepository.getSubscription();
        setSubscription(sub);
        toast.success("Subscription activated. Your store is now open.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Payment received but activation is still pending.",
        );
      }
    })();
  }, [searchParams, refreshUser]);

  const handleCheckout = async (planTier: PlanTier) => {
    setCheckoutTier(planTier);
    try {
      const result = await subscriptionRepository.checkout({ planTier });
      window.location.href = result.authorizationUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start checkout.",
      );
      setCheckoutTier(null);
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await subscriptionRepository.cancel();
      setSubscription(updated);
      await refreshUser();
      toast.success("Subscription will cancel at the end of this period.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel subscription.",
      );
    }
  };

  if (isLoading || !subscription) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  const currentTier = subscription.planTier;
  const hasPaidPlan =
    subscription.hasActiveAccess &&
    subscription.status !== "pending" &&
    !subscription.subscriptionExempt;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-gray-600">
          Manage your CatalogHQ subscription. Your plan controls product limits
          and premium features.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current subscription</CardTitle>
          <CardDescription>
            {subscription.subscriptionExempt
              ? "This account is comped by CatalogHQ admin."
              : hasPaidPlan
                ? "Monthly billing through Flutterwave."
                : "Choose a plan below to activate your store."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {hasPaidPlan ? (
              <Badge variant="secondary">
                {PLAN_TIER_LABELS[currentTier]}
              </Badge>
            ) : null}
            <Badge
              variant={
                subscription.status === "active" ? "default" : "outline"
              }
            >
              {STATUS_LABELS[subscription.status]}
            </Badge>
          </div>

          {subscription.currentPeriodEnd ? (
            <p className="text-sm text-gray-600">
              {subscription.cancelAtPeriodEnd ? "Access until" : "Renews on"}{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                "en-NG",
                { dateStyle: "medium" },
              )}
            </p>
          ) : null}

          {subscription.graceEndsAt ? (
            <p className="text-sm text-amber-800">
              Grace period ends{" "}
              {new Date(subscription.graceEndsAt).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </p>
          ) : null}

          {subscription.status === "active" && !subscription.cancelAtPeriodEnd ? (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel at period end
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = hasPaidPlan && plan.id === currentTier;
          const bullets = getFeatureBullets(plan.id);

          return (
            <Card
              key={plan.id}
              className={plan.popular ? "border-whatsapp-green/40" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.popular ? (
                    <Badge className="bg-whatsapp-green">Popular</Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNaira(plan.monthlyPriceKobo / 100)}
                  <span className="text-sm font-normal text-gray-500">
                    /month
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1 text-sm text-gray-600">
                  {bullets.slice(0, 5).map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
                  disabled={isCurrent || checkoutTier === plan.id}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {isCurrent
                    ? "Current plan"
                    : checkoutTier === plan.id
                      ? "Redirecting..."
                      : hasPaidPlan
                        ? "Switch plan"
                        : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString("en-NG")}
                    </TableCell>
                    <TableCell>
                      {PLAN_TIER_LABELS[payment.planTier]}
                    </TableCell>
                    <TableCell>
                      {formatNaira(payment.amountKobo / 100)}
                    </TableCell>
                    <TableCell className="capitalize">{payment.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
