import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FeatureUpgradeBanner from "@/components/vendor/FeatureUpgradeBanner";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { hasFeature } from "@/data/plans";
import { formatNaira } from "@/lib/format";
import {
  computeRevenueByDayForRange,
  computeSalesMetrics,
  computeTopProducts,
  selectEvenlySpacedChartLabels,
  endOfDay,
  formatAnalyticsDateRange,
  getDateRangePresetLabel,
  getDaysInRange,
  getPresetDateRange,
  startOfDay,
  type AnalyticsDateRange,
  type DateRangePreset,
} from "@/lib/sales-analytics";
import { cn } from "@/lib/utils";
import {
  vendorToolsRepository,
  type AdvancedAnalytics,
} from "@/lib/repositories/vendor-tools-repository";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(142 70% 35%)",
  },
} satisfies ChartConfig;

const PRESET_OPTIONS: Exclude<DateRangePreset, "custom">[] = [
  "7d",
  "30d",
  "90d",
  "all",
];

function toAnalyticsRange(range: DateRange): AnalyticsDateRange | null {
  if (!range.from) return null;

  return {
    from: startOfDay(range.from),
    to: endOfDay(range.to ?? range.from),
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const { orders } = useVendor();
  const [advanced, setAdvanced] = useState<AdvancedAnalytics | null>(null);

  const showAdvanced = hasFeature(
    user?.planTier ?? "starter",
    "advanced-analytics",
  );

  useEffect(() => {
    if (!showAdvanced) return;
    void vendorToolsRepository.getAdvancedAnalytics().then(setAdvanced);
  }, [showAdvanced]);
  const planTier = user?.planTier ?? "starter";
  const hasAnalytics = hasFeature(planTier, "analytics-dashboard");

  const [preset, setPreset] = useState<DateRangePreset>("7d");
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const [customRange, setCustomRange] = useState<AnalyticsDateRange | null>(
    null,
  );

  const appliedRange = useMemo<AnalyticsDateRange>(() => {
    if (preset === "custom" && customRange) {
      return customRange;
    }
     return getPresetDateRange(preset === "custom" ? "7d" : preset);
  }, [preset, customRange]);

  const filteredOrders = useMemo(() => {
    const fromMs = startOfDay(appliedRange.from).getTime();
    const toMs = endOfDay(appliedRange.to).getTime();

    return orders
      .filter((order) => order.status !== "cancelled")
      .filter((order) => {
        const createdAt = new Date(order.createdAt).getTime();
        return createdAt >= fromMs && createdAt <= toMs;
      });
  }, [orders, appliedRange]);

  const metrics = useMemo(
    () => computeSalesMetrics(orders, appliedRange),
    [orders, appliedRange],
  );
  const revenueByDay = useMemo(
    () => computeRevenueByDayForRange(orders, appliedRange),
    [orders, appliedRange],
  );
  const topProducts = useMemo(
    () => computeTopProducts(filteredOrders),
    [filteredOrders],
  );
  const recentOrders = filteredOrders.slice(0, 5);

  const rangeLabel =
    preset === "custom" && customRange
      ? formatAnalyticsDateRange(customRange)
      : formatAnalyticsDateRange(appliedRange);
  const periodDays = getDaysInRange(appliedRange);
  const chartUsesWeeks = periodDays > 45;
  const chartXAxisTicks = useMemo(
    () => selectEvenlySpacedChartLabels(revenueByDay.map((entry) => entry.label)),
    [revenueByDay],
  );

  const handlePresetChange = (nextPreset: Exclude<DateRangePreset, "custom">) => {
    setPreset(nextPreset);
    setCustomPickerOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!draftRange?.from) return;
    const nextRange = toAnalyticsRange(draftRange);
    if (!nextRange) return;

    setCustomRange(nextRange);
    setPreset("custom");
    setCustomPickerOpen(false);
  };

  if (!hasAnalytics) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-gray-600">
            See revenue, best sellers, and order trends in one place.
          </p>
        </div>
        <FeatureUpgradeBanner featureName="Sales analytics dashboard" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-gray-600">
          Track sales, best sellers, and order trends for any period.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date range</CardTitle>
          <CardDescription>
            Showing {rangeLabel}
            {preset !== "custom" ? ` · ${getDateRangePresetLabel(preset)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={preset === option ? "default" : "outline"}
                className={cn(
                  preset === option &&
                    "bg-whatsapp-green hover:bg-whatsapp-green/90",
                )}
                onClick={() => handlePresetChange(option)}
              >
                {getDateRangePresetLabel(option)}
              </Button>
            ))}

            <Popover open={customPickerOpen} onOpenChange={setCustomPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={preset === "custom" ? "default" : "outline"}
                  className={cn(
                    preset === "custom" &&
                      "bg-whatsapp-green hover:bg-whatsapp-green/90",
                  )}
                  onClick={() => {
                    setDraftRange(
                      customRange
                        ? { from: customRange.from, to: customRange.to }
                        : { from: appliedRange.from, to: appliedRange.to },
                    );
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Custom range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <Calendar
                    mode="range"
                    selected={draftRange}
                    onSelect={setDraftRange}
                    disabled={{ after: new Date() }}
                    numberOfMonths={1}
                  />
                  <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                    <p className="text-xs text-gray-500">
                      {draftRange?.from
                        ? draftRange.to
                          ? formatAnalyticsDateRange({
                              from: draftRange.from,
                              to: draftRange.to,
                            })
                          : formatAnalyticsDateRange({
                              from: draftRange.from,
                              to: draftRange.from,
                            })
                        : "Pick a start and end date"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                      disabled={!draftRange?.from}
                      onClick={handleApplyCustomRange}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total sales</CardDescription>
            <CardTitle className="text-xl">
              {formatNaira(metrics.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-500">{rangeLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders</CardDescription>
            <CardTitle className="text-xl">{metrics.orderCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-500">
              Paid orders in selected period
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Items sold</CardDescription>
            <CardTitle className="text-xl">{metrics.unitsSold}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-500">
              Total units across all orders
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Sales {chartUsesWeeks ? "by week" : "by day"}
          </CardTitle>
          <CardDescription>
            {chartUsesWeeks
              ? "Weekly totals for the selected period"
              : "Daily totals for the selected period"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No sales in this period. Try a wider date range or check back
              after your next order.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={revenueByDay} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  ticks={chartXAxisTicks}
                  interval={0}
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
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best sellers</CardTitle>
            <CardDescription>Top products in {rangeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No sales in this period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell>{item.unitsSold}</TableCell>
                      <TableCell>{formatNaira(item.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent orders</CardTitle>
              <CardDescription>Latest orders in {rangeLabel}</CardDescription>
            </div>
            <Link
              to="/dashboard/orders"
              className="text-sm font-medium text-whatsapp-green hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders in this period.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {order.productName}
                      </p>
                      <p className="text-xs text-gray-500">{order.paymentRef}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-xs font-medium text-gray-900">
                        {formatNaira(order.totalPaid)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showAdvanced && advanced && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repeat customer rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {(advanced.repeatCustomerRate * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average order value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatNaira(Math.round(advanced.averageOrderValue))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {advanced.topCustomers.length === 0 ? (
                <p className="text-gray-500">No repeat customers yet.</p>
              ) : (
                advanced.topCustomers.map((customer) => (
                  <div
                    key={customer.phone}
                    className="flex justify-between gap-2"
                  >
                    <span className="truncate">{customer.name}</span>
                    <span className="shrink-0 text-gray-500">
                      {customer.orderCount} orders
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
