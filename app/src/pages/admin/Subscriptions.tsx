import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminDateRangeFilter from "@/components/admin/AdminDateRangeFilter";
import type { AdminSubscriptionPayment } from "@/data/admin-mock";
import { PLAN_TIER_LABELS } from "@/data/plans";
import { adminRepository } from "@/lib/repositories";
import type { AdminListDateRange } from "@/lib/admin-date-range";
import { formatNaira, formatDateTimeEnNg } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaymentStatusFilter = "all" | AdminSubscriptionPayment["status"];

const PAYMENT_STATUS_LABELS: Record<AdminSubscriptionPayment["status"], string> =
  {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
  };

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  past_due: "Past due",
  grace: "Grace period",
  expired: "Expired",
  canceled: "Canceled",
};

function PaymentStatusBadge({
  status,
}: {
  status: AdminSubscriptionPayment["status"];
}) {
  const variant =
    status === "paid"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";

  return (
    <Badge
      variant={variant}
      className={cn(status === "paid" && "bg-whatsapp-green hover:bg-whatsapp-green/90")}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

function SubscriptionStatusBadge({ status }: { status?: string }) {
  if (!status) {
    return <span className="text-gray-400">—</span>;
  }

  const variant =
    status === "active"
      ? "default"
      : status === "expired" || status === "canceled"
        ? "outline"
        : "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {SUBSCRIPTION_STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export default function AdminSubscriptions() {
  const [payments, setPayments] = useState<AdminSubscriptionPayment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("paid");
  const [dateRange, setDateRange] = useState<AdminListDateRange>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listSubscriptions(dateRange);
        if (!cancelled) {
          setPayments(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load subscription payments.",
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
  }, [dateRange]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      const matchesSearch =
        !query ||
        payment.reference.toLowerCase().includes(query) ||
        payment.vendorEmail.toLowerCase().includes(query) ||
        payment.storeName.toLowerCase().includes(query) ||
        payment.storeSlug.toLowerCase().includes(query) ||
        payment.paystackSubscriptionCode?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  const totalPaidNaira = useMemo(
    () =>
      filteredPayments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amountNaira, 0),
    [filteredPayments],
  );

  const statusTabs: { id: PaymentStatusFilter; label: string }[] = [
    { id: "paid", label: "Paid" },
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "failed", label: "Failed" },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="mt-1 text-gray-600">
          Vendor plan payments via Paystack Direct Debit.
        </p>
      </div>

      <AdminDateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Matching payments</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {filteredPayments.length}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Paid total (filtered)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatNaira(totalPaidNaira)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search store, email, reference..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={statusFilter === tab.id ? "default" : "outline"}
              size="sm"
              className={cn(
                statusFilter === tab.id &&
                  "bg-whatsapp-green hover:bg-whatsapp-green/90",
              )}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Vendor email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Paystack sub</TableHead>
              <TableHead>Checkout</TableHead>
              <TableHead>Paid at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{payment.storeName}</p>
                    {payment.storeSlug ? (
                      <p className="text-xs text-gray-500">{payment.storeSlug}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-700">
                  {payment.vendorEmail}
                  {payment.subscriptionExempt ? (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Exempt
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>{PLAN_TIER_LABELS[payment.planTier]}</TableCell>
                <TableCell>{formatNaira(payment.amountNaira)}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <SubscriptionStatusBadge status={payment.subscriptionStatus} />
                </TableCell>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {payment.reference}
                </TableCell>
                <TableCell className="max-w-[120px] truncate font-mono text-xs text-gray-600">
                  {payment.paystackSubscriptionCode ?? "—"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDateTimeEnNg(payment.createdAt)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {payment.paidAt
                    ? formatDateTimeEnNg(payment.paidAt)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPayments.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          No subscription payments match your filters.
        </p>
      )}
    </div>
  );
}
