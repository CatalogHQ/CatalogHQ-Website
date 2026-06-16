export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTimeEnNg(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return dateTimeFormatter.format(date);
}

export function maskNin(nin: string): string {
  if (nin.length <= 4) return nin;
  return `${"*".repeat(nin.length - 4)}${nin.slice(-4)}`;
}

export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.startsWith("234")) return digits;
  return digits;
}
