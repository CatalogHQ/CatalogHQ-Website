import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminRepository } from "@/lib/repositories";
import { cn } from "@/lib/utils";
import type {
  SecurityAuditCategory,
  SecurityAuditLogEntry,
} from "@/types/security-audit";

const PAGE_SIZE = 50;

const categoryTabs: { id: SecurityAuditCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "auth", label: "Auth" },
  { id: "admin", label: "Admin" },
  { id: "payment", label: "Payments" },
  { id: "subscription", label: "Subscriptions" },
  { id: "vendor", label: "Vendors" },
];

function formatActionLabel(action: string): string {
  return action.replace(/\./g, " ").replace(/_/g, " ");
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function actionBadgeVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    action.includes("failed") ||
    action.includes("mismatch") ||
    action.includes("reuse") ||
    action.includes("deferred")
  ) {
    return "destructive";
  }

  if (action.startsWith("admin.")) {
    return "default";
  }

  return "secondary";
}

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState<SecurityAuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [category, setCategory] = useState<SecurityAuditCategory>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SecurityAuditLogEntry | null>(
    null,
  );

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminRepository.listSecurityLogs({
        limit: PAGE_SIZE,
        offset,
        category,
        search: search || undefined,
      });
      setLogs(result.items);
      setTotal(result.total);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load security logs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [category, offset, search]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim().slice(0, 100));
  };

  const handleCategoryChange = (nextCategory: SecurityAuditCategory) => {
    setCategory(nextCategory);
    setOffset(0);
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + logs.length, total);
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Security logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor sign-in events, admin actions, payments, and vendor
            security activity.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadLogs()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryTabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={category === tab.id ? "default" : "outline"}
            onClick={() => handleCategoryChange(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by actor email, target ID, or IP address"
            className="pl-9"
            maxLength={100}
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No security events found</p>
            <p className="text-sm text-muted-foreground">
              Try another filter or search term.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatTimestamp(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionBadgeVariant(log.action)}>
                      {formatActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">
                    {log.actorEmail ?? log.actorId ?? "System"}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">
                    {log.targetType
                      ? `${log.targetType}${log.targetId ? `: ${log.targetId}` : ""}`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {log.ipAddress ?? "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {pageStart} to {pageEnd} of {total} events
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoPrev || isLoading}
            onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoNext || isLoading}
            onClick={() => setOffset((current) => current + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet
        open={selectedLog != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
      >
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          {selectedLog ? (
            <>
              <SheetHeader>
                <SheetTitle>Security event</SheetTitle>
                <SheetDescription>
                  {formatTimestamp(selectedLog.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Action</p>
                  <p className="mt-1">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Actor</p>
                  <p className="mt-1">
                    {selectedLog.actorEmail ?? selectedLog.actorId ?? "System"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Target</p>
                  <p className="mt-1">
                    {selectedLog.targetType ?? "N/A"}
                    {selectedLog.targetId ? ` (${selectedLog.targetId})` : ""}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">IP address</p>
                  <p className="mt-1">{selectedLog.ipAddress ?? "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Metadata</p>
                  <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
