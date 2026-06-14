export type DeliveryTypeId = "pickup" | "delivery";

export type DeliveryType = {
  id: DeliveryTypeId;
  label: string;
  shortLabel: string;
  requiresAddress: boolean;
};

export const DELIVERY_TYPES: DeliveryType[] = [
  {
    id: "pickup",
    label: "Pickup from vendor",
    shortLabel: "Pickup",
    requiresAddress: false,
  },
  {
    id: "delivery",
    label: "Delivery",
    shortLabel: "Delivery",
    requiresAddress: true,
  },
];

export const DEFAULT_DELIVERY_OPTIONS: DeliveryTypeId[] = ["pickup"];

const VALID_DELIVERY_IDS = new Set(
  DELIVERY_TYPES.map((entry) => entry.id),
);

const LEGACY_DELIVERY_MAP: Record<string, DeliveryTypeId> = {
  nationwide: "delivery",
  meetup: "delivery",
  local_delivery: "delivery",
};

export function normalizeDeliveryOptions(
  options?: readonly (DeliveryTypeId | string)[],
): DeliveryTypeId[] {
  const mapped = (options ?? [])
    .map((id) => {
      if (VALID_DELIVERY_IDS.has(id as DeliveryTypeId)) {
        return id as DeliveryTypeId;
      }
      return LEGACY_DELIVERY_MAP[id] ?? null;
    })
    .filter((id): id is DeliveryTypeId => id !== null);

  const unique = [...new Set(mapped)];
  return unique.length ? unique : ["pickup"];
}

export function getDeliveryType(id: DeliveryTypeId): DeliveryType {
  const normalized =
    LEGACY_DELIVERY_MAP[id as string] ?? (id as DeliveryTypeId);
  const type = DELIVERY_TYPES.find((entry) => entry.id === normalized);
  if (!type) {
    throw new Error(`Unknown delivery type: ${id}`);
  }
  return type;
}

export function deliveryRequiresAddress(id: DeliveryTypeId | string): boolean {
  const normalized =
    LEGACY_DELIVERY_MAP[id] ?? (VALID_DELIVERY_IDS.has(id as DeliveryTypeId)
      ? (id as DeliveryTypeId)
      : null);
  if (!normalized) return false;
  return getDeliveryType(normalized).requiresAddress;
}

export function formatDeliverySummary(options: DeliveryTypeId[]): string {
  return normalizeDeliveryOptions(options)
    .map((id) => getDeliveryType(id).shortLabel)
    .join(" · ");
}

export function getDeliveryLabel(id: DeliveryTypeId | string): string {
  const normalized =
    LEGACY_DELIVERY_MAP[id] ?? (VALID_DELIVERY_IDS.has(id as DeliveryTypeId)
      ? (id as DeliveryTypeId)
      : null);
  if (normalized) {
    return getDeliveryType(normalized).label;
  }
  return String(id);
}
