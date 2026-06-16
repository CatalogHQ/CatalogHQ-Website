export type AdminListDateRange = {
  from?: string;
  to?: string;
};

export type AdminDateRangePreset = "all" | "7d" | "30d" | "90d" | "month";

export const ADMIN_DATE_PRESET_LABELS: Record<AdminDateRangePreset, string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  month: "This month",
};

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function adminDateRangeFromPreset(
  preset: AdminDateRangePreset,
): AdminListDateRange {
  if (preset === "all") {
    return {};
  }

  const today = new Date();
  const end = formatDateOnly(today);

  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDateOnly(start), to: end };
  }

  const days =
    preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  return { from: formatDateOnly(start), to: end };
}

export function buildAdminDateRangeQuery(
  range: AdminListDateRange,
): string {
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function isWithinAdminDateRange(
  isoDate: string,
  range: AdminListDateRange,
): boolean {
  if (!range.from && !range.to) {
    return true;
  }

  const value = new Date(isoDate).getTime();
  if (Number.isNaN(value)) {
    return false;
  }

  if (range.from) {
    const from = new Date(`${range.from}T00:00:00`).getTime();
    if (value < from) {
      return false;
    }
  }

  if (range.to) {
    const to = new Date(`${range.to}T23:59:59.999`).getTime();
    if (value > to) {
      return false;
    }
  }

  return true;
}

export function adminDateRangeMatchesPreset(
  range: AdminListDateRange,
  preset: AdminDateRangePreset,
): boolean {
  const expected = adminDateRangeFromPreset(preset);
  return range.from === expected.from && range.to === expected.to;
}
