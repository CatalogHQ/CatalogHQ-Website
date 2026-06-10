import { deliveryRequiresAddress, type DeliveryTypeId } from "@/lib/delivery-types";
import type { DeliveryZone } from "@/lib/delivery-zones";
import type { Product } from "@/types/domain";

export type ProductOrderSelection = {
  color?: string;
  size?: string;
  quantity: number;
  deliveryType?: DeliveryTypeId;
  deliveryZoneId?: string;
  discountCode?: string;
};

export function getInitialOrderSelection(product: Product): ProductOrderSelection {
  const selection: ProductOrderSelection = {
    quantity: product.stock > 0 ? 1 : 0,
  };

  if (product.colors.length === 1) {
    selection.color = product.colors[0];
  }

  if (product.sizingType === "one_size") {
    selection.size = "One Size";
  } else if (product.sizes.length === 1) {
    selection.size = product.sizes[0];
  }

  if (product.deliveryOptions.length === 1) {
    selection.deliveryType = product.deliveryOptions[0];
  }

  return selection;
}

export function isOrderSelectionValid(
  product: Product,
  selection: ProductOrderSelection,
): boolean {
  if (product.stock <= 0) return false;
  if (selection.quantity < 1 || selection.quantity > product.stock) return false;

  if (product.colors.length > 1 && !selection.color) return false;

  if (
    product.sizingType !== "none" &&
    product.sizes.length > 1 &&
    !selection.size
  ) {
    return false;
  }

  if (product.deliveryOptions.length > 1 && !selection.deliveryType) {
    return false;
  }

  return true;
}

export function getSelectionHint(
  product: Product,
  selection: ProductOrderSelection,
): string | null {
  if (product.stock <= 0) return "This item is sold out.";

  const missing: string[] = [];
  if (product.colors.length > 1 && !selection.color) missing.push("color");
  if (
    product.sizingType !== "none" &&
    product.sizes.length > 1 &&
    !selection.size
  ) {
    missing.push("size");
  }
  if (product.deliveryOptions.length > 1 && !selection.deliveryType) {
    missing.push("delivery");
  }

  if (missing.length === 0) return null;
  if (missing.length === 1) return `Choose a ${missing[0]} to continue.`;
  return `Choose ${missing.slice(0, -1).join(", ")} and ${missing.at(-1)} to continue.`;
}

export function resolveOrderSelection(
  product: Product,
  selection: ProductOrderSelection,
): Required<Pick<ProductOrderSelection, "quantity" | "deliveryType">> &
  Pick<ProductOrderSelection, "color" | "size" | "deliveryZoneId" | "discountCode"> {
  return {
    color:
      selection.color ??
      (product.colors.length === 1 ? product.colors[0] : undefined),
    size:
      selection.size ??
      (product.sizingType === "one_size"
        ? "One Size"
        : product.sizes.length === 1
          ? product.sizes[0]
          : undefined),
    quantity: selection.quantity,
    deliveryType:
      selection.deliveryType ??
      product.deliveryOptions[0] ??
      "pickup",
    deliveryZoneId: selection.deliveryZoneId,
    discountCode: selection.discountCode,
  };
}

export function getDeliveryFee(
  zones: DeliveryZone[] | undefined,
  deliveryType: DeliveryTypeId | undefined,
  zoneId: string | undefined,
): number {
  if (!deliveryRequiresAddress(deliveryType ?? "pickup") || !zones?.length) {
    return 0;
  }
  const zone = zones.find((entry) => entry.id === zoneId) ?? zones[0];
  return zone?.fee ?? 0;
}
