import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminStatCard from "@/components/admin/AdminStatCard";
import VerificationStatusBadge from "@/components/admin/VerificationStatusBadge";
import type {
  AdminPlatformStats,
  AdminRevenueByDay,
  AdminVendor,
} from "@/data/admin-mock";
import type { DatePreset } from "@/lib/repositories/api-admin-repository";
import { adminRepository } from "@/lib/repositories";
import { PLAN_TIER_LABELS } from "@/data/plans";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(142 70% 35%)",
  },
} satisfies ChartConfig;

const PRESET_LABELS: Record<DatePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export default function AdminAnalytics() {
  const [preset, setPreset] = useState<DatePreset>("7d");
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [chartData, setChartData] = useState<AdminRevenueByDay[]>([]);
  const [topVendors, setTopVendors] = useState<AdminVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [nextStats, revenue, vendors] = await Promise.all([
          adminRepository.getStats(),
          adminRepository.getRevenueAnalytics(preset),
          adminRepository.getTopVendors(),
        ]);
        if (!cancelled) {
          setStats(nextStats);
          setChartData(revenue);
          setTopVendors(vendors);
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
  }, [preset]);

  const periodGmv = useMemo(
    () => chartData.reduce((sum, entry) => sum + entry.revenue, 0),
    [chartData],
  );

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform analytics</h1>
        <p className="mt-1 text-gray-600">
          Revenue trends and top-performing vendors across ShopEase.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date range</CardTitle>
          <CardDescription>{PRESET_LABELS[preset]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESET_LABELS) as DatePreset[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  preset === key
                    ? "border-whatsapp-green bg-whatsapp-green/10 text-whatsapp-dark"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {PRESET_LABELS[key]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Period GMV" value={formatNaira(periodGmv)} />
        <AdminStatCard
          label="All-time GMV"
          value={formatNaira(stats.platformGmv)}
        />
        <AdminStatCard label="Total orders" value={stats.totalOrders} />
        <AdminStatCard label="Active stores" value={stats.activeStores} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue over time</CardTitle>
          <CardDescription>
            Platform gross merchandise value for the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatNaira(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top vendors by revenue</CardTitle>
          <CardDescription>
            Highest-earning stores on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border-0 border-t bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium text-gray-900">
                      {vendor.businessName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PLAN_TIER_LABELS[vendor.planTier]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <VerificationStatusBadge
                        status={vendor.verificationStatus}
                      />
                    </TableCell>
                    <TableCell>{vendor.orderCount}</TableCell>
                    <TableCell>{formatNaira(vendor.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
