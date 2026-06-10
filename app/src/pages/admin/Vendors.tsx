import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import VerificationStatusBadge from "@/components/admin/VerificationStatusBadge";
import type { AdminVendor } from "@/data/admin-mock";
import { PLAN_TIER_LABELS } from "@/data/plans";
import { adminRepository } from "@/lib/repositories";
import { formatNaira } from "@/lib/format";
import { getStoreUrl } from "@/lib/slug";

export default function AdminVendors() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listVendors();
        if (!cancelled) {
          setVendors(result);
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

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vendors;

    return vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(query) ||
        vendor.phone.includes(query) ||
        vendor.slug.toLowerCase().includes(query) ||
        vendor.city?.toLowerCase().includes(query) ||
        vendor.state?.toLowerCase().includes(query),
    );
  }, [search, vendors]);

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
          All vendor accounts and their store performance.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, phone, or location..."
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
              <TableHead>Phone</TableHead>
              <TableHead>Plan</TableHead>
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
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{vendor.phone}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {PLAN_TIER_LABELS[vendor.planTier]}
                  </Badge>
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
                    rel="noreferrer"
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
