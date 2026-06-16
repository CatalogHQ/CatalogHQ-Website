import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import VerificationStatusBadge from "@/components/admin/VerificationStatusBadge";
import AdminDateRangeFilter from "@/components/admin/AdminDateRangeFilter";
import type { AdminVendor } from "@/data/admin-mock";
import { PLAN_TIER_LABELS, type PlanTier } from "@/data/plans";
import { adminRepository } from "@/lib/repositories";
import type { AdminListDateRange } from "@/lib/admin-date-range";
import { formatNaira } from "@/lib/format";
import { getStoreUrl } from "@/lib/slug";

const PLAN_TIERS: PlanTier[] = ["starter", "pro", "growth", "business"];

export default function AdminVendors() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<AdminListDateRange>({});
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listVendors(dateRange);
        if (!cancelled) {
          setVendors(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load vendors.",
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

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vendors;

    return vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(query) ||
        vendor.email.toLowerCase().includes(query) ||
        vendor.phone.includes(query) ||
        vendor.slug.toLowerCase().includes(query) ||
        vendor.city?.toLowerCase().includes(query) ||
        vendor.state?.toLowerCase().includes(query),
    );
  }, [search, vendors]);

  const handlePlanChange = async (vendorId: string, planTier: PlanTier) => {
    setUpdatingId(vendorId);
    try {
      const updated = await adminRepository.updateVendorPlan(vendorId, planTier);
      setVendors((current) =>
        current.map((vendor) => (vendor.id === vendorId ? updated : vendor)),
      );
      toast.success(`Plan updated to ${PLAN_TIER_LABELS[planTier]}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update plan.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="mt-1 text-gray-600">
          All vendor accounts, plan tiers, and store performance. Date filter
          uses joined date; order and revenue columns match the same range.
        </p>
      </div>

      <AdminDateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, email, WhatsApp, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">
                      {vendor.businessName}
                    </p>
                    {(vendor.city || vendor.state) && (
                      <p className="text-sm text-gray-500">
                        {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {!vendor.setupComplete && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Setup incomplete
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {vendor.email}
                </TableCell>
                <TableCell className="text-gray-600">{vendor.phone}</TableCell>
                <TableCell>
                  <Select
                    value={vendor.planTier}
                    disabled={updatingId === vendor.id}
                    onValueChange={(value) =>
                      void handlePlanChange(vendor.id, value as PlanTier)
                    }
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {PLAN_TIER_LABELS[tier]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {vendor.subscriptionExempt ? (
                    <Badge variant="outline">Comped</Badge>
                  ) : vendor.subscriptionStatus ? (
                    <Badge variant="secondary" className="capitalize">
                      {vendor.subscriptionStatus.replace("_", " ")}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <VerificationStatusBadge status={vendor.verificationStatus} />
                </TableCell>
                <TableCell>{vendor.orderCount}</TableCell>
                <TableCell>{formatNaira(vendor.revenue)}</TableCell>
                <TableCell className="text-gray-600">
                  {new Date(vendor.createdAt).toLocaleDateString("en-NG")}
                </TableCell>
                <TableCell>
                  <a
                    href={getStoreUrl(vendor.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-whatsapp-green hover:text-whatsapp-dark"
                    title="View storefront"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredVendors.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          No vendors match your search.
        </p>
      )}
    </div>
  );
}
