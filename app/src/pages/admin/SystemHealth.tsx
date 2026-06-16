import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { adminRepository } from "@/lib/repositories";
import { cn } from "@/lib/utils";
import type { HealthDetailResponse } from "@/types/health-detail";

function statusBadgeVariant(
  status: "up" | "down" | "ok" | "degraded",
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "up" || status === "ok") {
    return "default";
  }
  if (status === "degraded") {
    return "secondary";
  }
  return "destructive";
}

function CheckRow({
  label,
  check,
}: {
  label: string;
  check: HealthDetailResponse["checks"]["database"];
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div>
        <p className="font-medium">{label}</p>
        {check.message ? (
          <p className="mt-1 text-sm text-muted-foreground">{check.message}</p>
        ) : null}
        {check.storage ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Storage: {check.storage}
          </p>
        ) : null}
      </div>
      <Badge variant={statusBadgeVariant(check.status)}>{check.status}</Badge>
    </div>
  );
}

export default function AdminSystemHealth() {
  const [detail, setDetail] = useState<HealthDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminRepository.getHealthDetail();
      setDetail(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load system health.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System health</h1>
          <p className="text-sm text-muted-foreground">
            Database, Redis, and rate-limit storage status for the API.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadHealth()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading && !detail ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : detail ? (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Overall status</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(detail.status)}>
                  {detail.status}
                </Badge>
                <Badge variant="outline">{detail.environment}</Badge>
                <Badge variant="outline">
                  Rate limits: {detail.checks.rateLimitStorage}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Last checked:{" "}
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                }).format(new Date(detail.timestamp))}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <CheckRow label="Database" check={detail.checks.database} />
            <CheckRow label="Redis" check={detail.checks.redis} />
          </div>
        </>
      ) : null}
    </div>
  );
}
