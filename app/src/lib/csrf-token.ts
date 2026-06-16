import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";

export { CSRF_HEADER_NAME };

let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token?.trim() ? token.trim() : null;
}

export function clearCsrfToken(): void {
  inMemoryCsrfToken = null;
}

export function readCsrfTokenFromDocument(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${CSRF_COOKIE_NAME}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }

  return null;
}

/** Prefer in-memory token (cross-origin SPA); fall back to document.cookie (same-origin). */
export function readCsrfToken(): string | null {
  return inMemoryCsrfToken ?? readCsrfTokenFromDocument();
}

export function applyCsrfTokenFromResponse(payload: unknown): void {
  if (
    payload &&
    typeof payload === "object" &&
    "csrfToken" in payload &&
    typeof payload.csrfToken === "string"
  ) {
    setCsrfToken(payload.csrfToken);
  }
}
