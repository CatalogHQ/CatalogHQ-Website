/**
 * Shared Content-Security-Policy builder for deploy headers and build output.
 * connect-src includes VITE_API_URL so staging/preview hosts are not blocked.
 */

const FLUTTERWAVE_CONNECT = "https://api.flutterwave.com";
const FLUTTERWAVE_FRAME = "https://checkout.flutterwave.com";
const PAYSTACK_FRAME = "https://checkout.paystack.com";
const CLOUDINARY_IMG = "https://res.cloudinary.com";

/**
 * @param {string | undefined} apiUrl VITE_API_URL (e.g. https://api.cataloghq.store)
 * @returns {string}
 */
export function buildContentSecurityPolicy(apiUrl) {
  const connectSrc = new Set(["'self'", FLUTTERWAVE_CONNECT]);

  if (apiUrl) {
    try {
      connectSrc.add(new URL(apiUrl).origin);
    } catch {
      // Ignore invalid URLs; production builds should validate env separately.
    }
  }

  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `img-src 'self' data: ${CLOUDINARY_IMG}`,
    `connect-src ${[...connectSrc].join(" ")}`,
    `frame-src ${FLUTTERWAVE_FRAME} ${PAYSTACK_FRAME}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * @param {string | undefined} apiUrl
 * @returns {string}
 */
export function buildCspMetaTag(apiUrl) {
  return `<meta http-equiv="Content-Security-Policy" content="${buildContentSecurityPolicy(apiUrl)}" />`;
}
