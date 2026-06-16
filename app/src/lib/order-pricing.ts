import type { CustomerOrder } from "@/types/orders";

export function orderSubtotalNgn(
  order: Pick<
    CustomerOrder,
    "unitPrice" | "quantity" | "deliveryFee" | "discountAmount"
  >,
): number {
  return Math.max(
    0,
    order.unitPrice * order.quantity +
      (order.deliveryFee ?? 0) -
      (order.discountAmount ?? 0),
  );
}

/** VAT / checkout uplift included in what the customer pays. */
export function orderVatNgn(
  order: Pick<
    CustomerOrder,
    | "unitPrice"
    | "quantity"
    | "deliveryFee"
    | "discountAmount"
    | "totalPaid"
    | "platformFee"
  >,
): number {
  if (typeof order.platformFee === "number" && order.platformFee >= 0) {
    return order.platformFee;
  }

  return Math.max(0, order.totalPaid - orderSubtotalNgn(order));
}
