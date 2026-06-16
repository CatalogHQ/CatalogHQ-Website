import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
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
import type { AdminCustomer } from "@/data/admin-mock";
import { adminRepository } from "@/lib/repositories";
import type { AdminListDateRange } from "@/lib/admin-date-range";
import { formatNaira } from "@/lib/format";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<AdminListDateRange>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await adminRepository.listCustomers(dateRange);
        if (!cancelled) {
          setCustomers(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load customers.",
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

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query),
    );
  }, [customers, search]);

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
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-gray-600">
          Unique buyers across all stores. Date filter shows customers with
          orders in the selected range.
        </p>
      </div>

      <AdminDateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total spent</TableHead>
              <TableHead>Last order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium text-gray-900">
                  {customer.name}
                </TableCell>
                <TableCell>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-whatsapp-dark hover:text-whatsapp-green"
                  >
                    {customer.phone}
                  </a>
                </TableCell>
                <TableCell>{customer.orderCount}</TableCell>
                <TableCell>{formatNaira(customer.totalSpent)}</TableCell>
                <TableCell className="text-gray-600">
                  {new Date(customer.lastOrderAt).toLocaleDateString("en-NG")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredCustomers.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          No customers match your search.
        </p>
      )}
    </div>
  );
}
