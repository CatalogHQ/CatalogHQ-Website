const ALLOWED_PAYMENT_HOSTS = new Set([
  "checkout.flutterwave.com",
  "api.flutterwave.com",
  "standard.paystack.co",
  "checkout.paystack.com",
]);

export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return null;
  }

  if (decoded.includes("\\") || decoded.includes("\0")) {
    return null;
  }

  return decoded;
}

export function isAllowedPaymentRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    if (import.meta.env.PROD && parsed.protocol !== "https:") {
      return false;
    }

    return ALLOWED_PAYMENT_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}
