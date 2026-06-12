import { getDeliveryLabel } from "@/lib/delivery-types";
import { formatNaira } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  type CustomerOrder,
  type OrderStatus,
  type PaymentStatus,
} from "@/types/orders";

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

export type OrderWhatsAppMessageOptions = {
  storeSlug?: string;
  appOrigin?: string;
};

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function resolvePaymentLabel(order: CustomerOrder): string {
  if (order.paymentStatus) {
    return PAYMENT_STATUS_LABELS[order.paymentStatus];
  }
  return order.status === "reserved" ? "Pending" : "Paid";
}

function buildTrackOrderUrl(
  options: OrderWhatsAppMessageOptions | undefined,
  paymentRef: string,
): string | null {
  if (!options?.storeSlug || !options.appOrigin) {
    return null;
  }
  const origin = options.appOrigin.replace(/\/$/, "");
  return `${origin}/s/${options.storeSlug}/order/${encodeURIComponent(paymentRef)}`;
}

export function buildOrderWhatsAppMessage(
  storeName: string,
  order: CustomerOrder,
  options?: OrderWhatsAppMessageOptions,
): string {
  const paymentLabel = resolvePaymentLabel(order);
  const statusLabel =
    ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const isPaid =
    order.paymentStatus === "paid" ||
    (order.paymentStatus !== "pending" && order.status !== "reserved");

  const lines = [
    `Hi ${storeName}, this is ${order.customerName}.`,
    "",
    isPaid
      ? "I have placed and paid for an order on CatalogHQ."
      : "I placed an order on CatalogHQ (payment is still pending).",
    "",
    "Please verify on your CatalogHQ dashboard:",
    `Order ref: ${order.paymentRef}`,
    `Customer name: ${order.customerName}`,
    `Customer phone: ${order.customerPhone}`,
    `Payment: ${paymentLabel}`,
    `Order status: ${statusLabel}`,
    "",
    `Product: ${order.productName}`,
  ];

  if (order.color) {
    lines.push(`Color: ${order.color}`);
  }

  if (order.size) {
    lines.push(`Size: ${order.size}`);
  }

  lines.push(`Quantity: ${order.quantity}`);
  lines.push(`Delivery: ${getDeliveryLabel(order.deliveryType)}`);

  if (order.deliveryAddress) {
    lines.push(`Delivery address: ${order.deliveryAddress}`);
  }

  lines.push(`Total: ${formatNaira(order.totalPaid)}`);
  lines.push(`Ordered: ${formatOrderDate(order.createdAt)}`);

  const trackUrl = buildTrackOrderUrl(options, order.paymentRef);
  if (trackUrl) {
    lines.push("");
    lines.push(`Track this order: ${trackUrl}`);
  }

  lines.push("");
  lines.push(
    isPaid
      ? "Search the order ref above in your dashboard to confirm. Thank you!"
      : "Search the order ref above in your dashboard. I will complete payment shortly. Thank you!",
  );

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
