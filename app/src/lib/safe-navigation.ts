const ALLOWED_PAYMENT_HOSTS = new Set([
  "checkout.flutterwave.com",
  "api.flutterwave.com",
  "standard.paystack.co",
  "checkout.paystack.com",
]);

function hasEncodedTraversal(value: string): boolean {
  return /%2f|%5c|%00|%40/i.test(value);
}

export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (hasEncodedTraversal(value)) {
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

  if (
    decoded.includes("\\") ||
    decoded.includes("\0") ||
    decoded.includes("@") ||
    decoded.includes(":")
  ) {
    return null;
  }

  if (hasEncodedTraversal(decoded)) {
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
