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
import type { AdminPlatformPayout } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import type { AdminListDateRange } from "@/lib/admin-date-range";
import { formatNaira, formatDateTimeEnNg } from "@/lib/format";
import { cn } from "@/lib/utils";

type PayoutStatusFilter = "all" | AdminPlatformPayout["status"];

const STATUS_LABELS: Record<AdminPlatformPayout["status"], string> = {
  pending: "Pending",
  processing: "Processing",
  split: "Split sent",
  settled: "Settled",
  failed: "Failed",
};

function PayoutStatusBadge({ status }: { status: AdminPlatformPayout["status"] }) {
  const variant =
    status === "settled"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";

  return (
    <Badge
      variant={variant}
      className={cn(status === "settled" && "bg-whatsapp-green hover:bg-whatsapp-green/90")}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<AdminPlatformPayout[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("all");
  const [dateRange, setDateRange] = useState<AdminListDateRange>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listPayouts(dateRange);
        if (!cancelled) {
          setPayouts(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load payouts.",
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

  const filteredPayouts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payouts.filter((payout) => {
      const matchesStatus =
        statusFilter === "all" || payout.status === statusFilter;
      const matchesSearch =
        !query ||
        payout.paymentRef.toLowerCase().includes(query) ||
        payout.storeName.toLowerCase().includes(query) ||
        payout.storeSlug.toLowerCase().includes(query) ||
        payout.flutterwaveReference?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [payouts, search, statusFilter]);

  const statusTabs: { id: PayoutStatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "processing", label: "Processing" },
    { id: "settled", label: "Settled" },
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
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="mt-1 text-gray-600">
          Vendor transfer records across every store.
        </p>
      </div>

      <AdminDateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search ref, store, transfer ref..."
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
              <TableHead>Order ref</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Vendor amount</TableHead>
              <TableHead>Service fee</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Settled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell className="font-mono text-sm">
                  {payout.paymentRef}
                </TableCell>
                <TableCell>{payout.storeName}</TableCell>
                <TableCell>{formatNaira(payout.amountNaira)}</TableCell>
                <TableCell>{formatNaira(payout.platformFeeNaira)}</TableCell>
                <TableCell className="capitalize">
                  {payout.method.replace("_", " ")}
                </TableCell>
                <TableCell>
                  <PayoutStatusBadge status={payout.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {payout.bankName
                    ? `${payout.bankName}${payout.accountNumberLast4 ? ` ····${payout.accountNumberLast4}` : ""}`
                    : "-"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDateTimeEnNg(payout.createdAt)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {payout.settledAt
                    ? formatDateTimeEnNg(payout.settledAt)
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPayouts.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          No payouts match your filters.
        </p>
      )}
    </div>
  );
}
