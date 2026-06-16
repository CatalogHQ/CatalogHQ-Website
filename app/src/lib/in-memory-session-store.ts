/**
 * Tab-scoped in-memory store for checkout PII (phone, pending bank-transfer details).
 * Data is not written to sessionStorage/localStorage, so it survives SPA navigation
 * but clears on full page reload. Users re-enter phone via OrderPhoneGate after refresh.
 * Authorization and order access remain enforced by the API.
 */

const store = new Map<string, string>();

export function setInMemoryValue(key: string, value: string): void {
  store.set(key, value);
}

export function getInMemoryValue(key: string): string | null {
  return store.get(key) ?? null;
}

export function deleteInMemoryValue(key: string): void {
  store.delete(key);
}
