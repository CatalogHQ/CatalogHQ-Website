/** Flutterwave v4 reference: alphanumeric and hyphens only, 6-42 chars. */
export function buildFlutterwaveReference(paymentRef: string): string {
  const ref = `flw-${paymentRef}`;
  if (!/^[a-zA-Z0-9-]{6,42}$/.test(ref)) {
    return crypto.randomUUID();
  }
  return ref;
}
