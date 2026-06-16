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
 * @param {{ allowDataImages?: boolean }} [options]
 * @returns {string}
 */
export function buildContentSecurityPolicy(apiUrl, options = {}) {
  const { allowDataImages = false } = options;
  const connectSrc = new Set(["'self'", FLUTTERWAVE_CONNECT]);

  if (apiUrl) {
    try {
      connectSrc.add(new URL(apiUrl).origin);
    } catch {
      // Ignore invalid URLs; production builds should validate env separately.
    }
  }

  const imgSrc = allowDataImages
    ? `'self' data: ${CLOUDINARY_IMG}`
    : `'self' ${CLOUDINARY_IMG}`;

  return [
    "default-src 'self'",
    "script-src 'self'",
    // Tailwind and component libraries inject inline styles; use nonces when migrating off unsafe-inline.
  "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `img-src ${imgSrc}`,
    `connect-src ${[...connectSrc].join(" ")}`,
    `frame-src ${FLUTTERWAVE_FRAME} ${PAYSTACK_FRAME}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export const DEPLOY_SECURITY_HEADERS = {
  hsts: "max-age=31536000; includeSubDomains",
  frameOptions: "DENY",
  contentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "camera=(), microphone=(), geolocation=()",
};

/**
 * @param {string | undefined} apiUrl
 * @param {{ allowDataImages?: boolean }} [options]
 * @returns {string}
 */
export function buildCspMetaTag(apiUrl, options = {}) {
  return `<meta http-equiv="Content-Security-Policy" content="${buildContentSecurityPolicy(apiUrl, options)}" />`;
}

/**
 * @param {string} csp
 * @returns {string}
 */
export function buildApacheHtaccess(csp) {
  const { hsts, frameOptions, contentTypeOptions, referrerPolicy, permissionsPolicy } =
    DEPLOY_SECURITY_HEADERS;

  return `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "${hsts}"
  Header always set X-Frame-Options "${frameOptions}"
  Header always set X-Content-Type-Options "${contentTypeOptions}"
  Header always set Referrer-Policy "${referrerPolicy}"
  Header always set Permissions-Policy "${permissionsPolicy}"
  Header always set Content-Security-Policy "${csp}"
</IfModule>
`;
}
