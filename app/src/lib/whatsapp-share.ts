import { formatNaira } from "@/lib/format";

export function buildProductShareMessage(input: {
  productName: string;
  price: number;
  storeName: string;
  productUrl: string;
}): string {
  return [
    `🛍️ ${input.productName}`,
    `💰 ${formatNaira(input.price)}`,
    `🏪 ${input.storeName}`,
    "",
    "Shop now:",
    input.productUrl,
  ].join("\n");
}

export function buildStoreShareMessage(input: {
  storeName: string;
  storeUrl: string;
  bio?: string;
}): string {
  const lines = [`🏪 ${input.storeName}`, ""];
  if (input.bio?.trim()) {
    lines.push(input.bio.trim(), "");
  }
  lines.push("Browse and pay securely:", input.storeUrl);
  return lines.join("\n");
}

export function buildWhatsAppShareUrl(phone: string, message: string): string {
  const normalized = phone.replace(/\D/g, "");
  const withCountry =
    normalized.startsWith("234") || normalized.length > 10
      ? normalized
      : `234${normalized.replace(/^0/, "")}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppShare(phone: string, message: string): void {
  window.open(buildWhatsAppShareUrl(phone, message), "_blank", "noopener,noreferrer");
}

export function shareToWhatsAppStatus(message: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
