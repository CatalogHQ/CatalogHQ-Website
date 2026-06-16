import type { CustomerOrder } from "@/types/orders";
import { CATALOGHQ_SERVICE_FEE_NGN } from "@/lib/flutterwave-fees";

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

export function orderServiceFeeNgn(
  order: Pick<CustomerOrder, "platformFee" | "totalPaid"> &
    Parameters<typeof orderSubtotalNgn>[0],
): number {
  if (typeof order.platformFee === "number" && order.platformFee >= 0) {
    return order.platformFee;
  }

  const subtotal = orderSubtotalNgn(order);
  if (order.totalPaid <= subtotal) {
    return 0;
  }

  return CATALOGHQ_SERVICE_FEE_NGN;
}

export function orderPaymentProcessingFeeNgn(
  order: Pick<CustomerOrder, "totalPaid" | "platformFee"> &
    Parameters<typeof orderSubtotalNgn>[0],
): number {
  return Math.max(
    0,
    order.totalPaid - orderSubtotalNgn(order) - orderServiceFeeNgn(order),
  );
}
