import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_DATE_PRESET_LABELS,
  adminDateRangeFromPreset,
  adminDateRangeMatchesPreset,
  type AdminDateRangePreset,
  type AdminListDateRange,
} from "@/lib/admin-date-range";
import { cn } from "@/lib/utils";

type AdminDateRangeFilterProps = {
  value: AdminListDateRange;
  onChange: (range: AdminListDateRange) => void;
  className?: string;
};

const PRESETS: AdminDateRangePreset[] = [
  "all",
  "7d",
  "30d",
  "90d",
  "month",
];

export default function AdminDateRangeFilter({
  value,
  onChange,
  className,
}: AdminDateRangeFilterProps) {
  const activePreset =
    PRESETS.find((preset) => adminDateRangeMatchesPreset(value, preset)) ??
    null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={activePreset === preset ? "default" : "outline"}
            size="sm"
            className={cn(
              activePreset === preset &&
                "bg-whatsapp-green hover:bg-whatsapp-green/90",
            )}
            onClick={() => onChange(adminDateRangeFromPreset(preset))}
          >
            {ADMIN_DATE_PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <label
            htmlFor="admin-date-from"
            className="text-xs font-medium text-gray-600"
          >
            From
          </label>
          <Input
            id="admin-date-from"
            type="date"
            value={value.from ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                from: event.target.value || undefined,
              })
            }
            className="w-full sm:w-[160px]"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="admin-date-to"
            className="text-xs font-medium text-gray-600"
          >
            To
          </label>
          <Input
            id="admin-date-to"
            type="date"
            value={value.to ?? ""}
            min={value.from}
            onChange={(event) =>
              onChange({
                ...value,
                to: event.target.value || undefined,
              })
            }
            className="w-full sm:w-[160px]"
          />
        </div>
      </div>
    </div>
  );
}
