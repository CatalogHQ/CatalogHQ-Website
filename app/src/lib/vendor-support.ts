import { buildWhatsAppUrl } from "@/lib/order-message";
import { normalizePhoneForWhatsApp } from "@/lib/format";

export const SUPPORT_CONTACT = {
  whatsapp: "07019062597",
  email: "support@shopease.ng",
  hours: "Mon–Sat, 9am–6pm WAT",
} as const;

/** @deprecated Use SUPPORT_CONTACT */
export const VENDOR_SUPPORT = SUPPORT_CONTACT;

export function buildVendorSupportWhatsAppUrl(storeName?: string): string {
  const lines = [
    "Hi ShopEase support,",
    "",
    "I need help with my vendor account.",
    "",
  ];

  if (storeName) {
    lines.push(`Store: ${storeName}`);
    lines.push("");
  }

  lines.push("Issue: ");

  return buildWhatsAppUrl(
    normalizePhoneForWhatsApp(SUPPORT_CONTACT.whatsapp),
    lines.join("\n"),
  );
}

export function buildVendorSupportEmailUrl(
  storeName?: string,
  subject = "Vendor support request",
): string {
  const body = storeName
    ? `Store: ${storeName}\n\nDescribe your issue:\n`
    : "Describe your issue:\n";

  return `mailto:${SUPPORT_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildCustomerSupportWhatsAppUrl(options?: {
  storeName?: string;
  orderRef?: string;
}): string {
  const lines = [
    "Hi ShopEase support,",
    "",
    "I need help with a purchase or order.",
    "",
  ];

  if (options?.storeName) {
    lines.push(`Store: ${options.storeName}`);
  }

  if (options?.orderRef) {
    lines.push(`Order ref: ${options.orderRef}`);
  }

  if (options?.storeName || options?.orderRef) {
    lines.push("");
  }

  lines.push("Issue: ");

  return buildWhatsAppUrl(
    normalizePhoneForWhatsApp(SUPPORT_CONTACT.whatsapp),
    lines.join("\n"),
  );
}

export function buildCustomerSupportEmailUrl(options?: {
  storeName?: string;
  orderRef?: string;
  subject?: string;
}): string {
  const lines = ["Describe your issue:", ""];

  if (options?.storeName) {
    lines.unshift(`Store: ${options.storeName}`, "");
  }

  if (options?.orderRef) {
    lines.unshift(`Order ref: ${options.orderRef}`, "");
  }

  return `mailto:${SUPPORT_CONTACT.email}?subject=${encodeURIComponent(
    options?.subject ?? "Customer support request",
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}
