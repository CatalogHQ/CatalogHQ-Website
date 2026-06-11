import { getDeliveryLabel } from "@/lib/delivery-types";
import { formatNaira } from "@/lib/format";
import type { CustomerOrder } from "@/types/orders";

export function buildOrderWhatsAppMessage(
  storeName: string,
  order: CustomerOrder,
): string {
  const lines = [
    `Hi ${storeName},`,
    "",
    "I've paid for my order on CatalogHQ.",
    "",
    `Order ref: ${order.paymentRef}`,
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
    lines.push(`Deliver to: ${order.deliveryAddress}`);
    lines.push(`Reachable mobile: ${order.customerPhone}`);
  }

  lines.push(`Total paid: ${formatNaira(order.totalPaid)}`);
  lines.push("");
  lines.push("Please confirm receipt. Thank you!");

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
