import { vendorNetFromOrderLine } from "@/lib/flutterwave-fees";
import type { Product } from "@/types/domain";
import { getProductLowStockThreshold } from "@/types/domain";
import type { CustomerOrder } from "@/types/orders";

export type SalesMetrics = {
  totalRevenue: number;
  orderCount: number;
  unitsSold: number;
};

export type AnalyticsDateRange = {
  from: Date;
  to: Date;
};

export type DateRangePreset = "7d" | "30d" | "90d" | "month" | "all" | "custom";

export type RevenueByDay = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

export function selectEvenlySpacedChartLabels(
  labels: string[],
  maxTicks = 7,
): string[] {
  if (labels.length <= maxTicks) {
    return labels;
  }

  const lastIndex = labels.length - 1;
  const step = lastIndex / (maxTicks - 1);
  const indices = new Set<number>();

  for (let i = 0; i < maxTicks; i++) {
    indices.add(Math.round(i * step));
  }
  indices.add(lastIndex);

  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => labels[index]);
}

export type TopProduct = {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
};

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function getActiveOrders(orders: CustomerOrder[]): CustomerOrder[] {
  return orders.filter((order) => order.status !== "cancelled");
}

export function getPresetDateRange(preset: Exclude<DateRangePreset, "custom">): AnalyticsDateRange {
  const to = endOfDay(new Date());

  if (preset === "all") {
    return { from: new Date(0), to };
  }

  if (preset === "month") {
    const from = startOfDay(new Date());
    from.setDate(1);
    return { from, to };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = startOfDay(new Date());
  from.setDate(from.getDate() - (days - 1));

  return { from, to };
}

export function getDaysInRange(range: AnalyticsDateRange): number {
  const from = startOfDay(range.from);
  const to = startOfDay(range.to);
  return Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1,
  );
}

export function formatAnalyticsDateRange(range: AnalyticsDateRange): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const fromLabel = range.from.toLocaleDateString("en-NG", options);
  const toLabel = range.to.toLocaleDateString("en-NG", options);

  if (fromLabel === toLabel) {
    return fromLabel;
  }

  return `${fromLabel} – ${toLabel}`;
}

export function getDateRangePresetLabel(preset: DateRangePreset): string {
  switch (preset) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "month":
      return "This month";
    case "all":
      return "All time";
    case "custom":
      return "Custom range";
  }
}

export function filterOrdersByDateRange(
  orders: CustomerOrder[],
  range: AnalyticsDateRange,
): CustomerOrder[] {
  const fromMs = startOfDay(range.from).getTime();
  const toMs = endOfDay(range.to).getTime();

  return getActiveOrders(orders).filter((order) => {
    const createdAt = new Date(order.createdAt).getTime();
    return createdAt >= fromMs && createdAt <= toMs;
  });
}

export function computeSalesMetrics(
  orders: CustomerOrder[],
  range?: AnalyticsDateRange,
): SalesMetrics {
  const activeOrders = range
    ? filterOrdersByDateRange(orders, range)
    : getActiveOrders(orders);
  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + order.totalPaid,
    0,
  );
  const unitsSold = activeOrders.reduce(
    (sum, order) => sum + order.quantity,
    0,
  );

  return {
    totalRevenue,
    orderCount: activeOrders.length,
    unitsSold,
  };
}

export function computeVendorNetMetrics(
  orders: CustomerOrder[],
  range?: AnalyticsDateRange,
): SalesMetrics {
  const activeOrders = range
    ? filterOrdersByDateRange(orders, range)
    : getActiveOrders(orders);
  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + vendorNetFromOrderLine(order),
    0,
  );
  const unitsSold = activeOrders.reduce(
    (sum, order) => sum + order.quantity,
    0,
  );

  return {
    totalRevenue,
    orderCount: activeOrders.length,
    unitsSold,
  };
}

export function computeRevenueByDay(
  orders: CustomerOrder[],
  days: number,
): RevenueByDay[] {
  const to = endOfDay(new Date());
  const from = startOfDay(new Date());
  from.setDate(from.getDate() - (days - 1));

  return computeRevenueByDayForRange(orders, { from, to });
}

export function computeRevenueByDayForRange(
  orders: CustomerOrder[],
  range: AnalyticsDateRange,
): RevenueByDay[] {
  const filtered = filterOrdersByDateRange(orders, range);
  const dayCount = getDaysInRange(range);

  if (dayCount > 45) {
    return computeRevenueByWeekForRange(filtered, range);
  }

  const result: RevenueByDay[] = [];
  const cursor = startOfDay(range.from);
  const end = startOfDay(range.to);

  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const dayOrders = filtered.filter((order) =>
      order.createdAt.startsWith(dateKey),
    );

    result.push({
      date: dateKey,
      label: cursor.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      }),
      revenue: dayOrders.reduce((sum, order) => sum + order.totalPaid, 0),
      orders: dayOrders.length,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function computeRevenueByWeekForRange(
  orders: CustomerOrder[],
  range: AnalyticsDateRange,
): RevenueByDay[] {
  const result: RevenueByDay[] = [];
  const cursor = startOfDay(range.from);
  const end = startOfDay(range.to);

  while (cursor <= end) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    const fromMs = startOfDay(weekStart).getTime();
    const toMs = endOfDay(weekEnd).getTime();
    const weekOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt).getTime();
      return createdAt >= fromMs && createdAt <= toMs;
    });

    result.push({
      date: weekStart.toISOString().slice(0, 10),
      label: `${weekStart.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      })} – ${weekEnd.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      })}`,
      revenue: weekOrders.reduce((sum, order) => sum + order.totalPaid, 0),
      orders: weekOrders.length,
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return result;
}

export function computeTopProducts(
  orders: CustomerOrder[],
  limit = 5,
): TopProduct[] {
  const byProduct = new Map<string, TopProduct>();

  for (const order of orders) {
    const existing = byProduct.get(order.productId);
    if (existing) {
      existing.unitsSold += order.quantity;
      existing.revenue += order.totalPaid;
    } else {
      byProduct.set(order.productId, {
        productId: order.productId,
        productName: order.productName,
        unitsSold: order.quantity,
        revenue: order.totalPaid,
      });
    }
  }

  return [...byProduct.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export type InventoryStatus = "in_stock" | "low_stock" | "sold_out";

export function getInventoryStatus(product: Product): InventoryStatus {
  if (product.stock <= 0) return "sold_out";
  if (product.stock <= getProductLowStockThreshold(product)) return "low_stock";
  return "in_stock";
}

export function getLowStockProducts(products: Product[]): Product[] {
  return products.filter((product) => {
    if (product.stock <= 0) return false;
    return product.stock <= getProductLowStockThreshold(product);
  });
}

export function getSoldOutCount(products: Product[]): number {
  return products.filter((product) => product.stock <= 0).length;
}

export function getInStockCount(products: Product[]): number {
  return products.filter((product) => product.stock > 0).length;
}
