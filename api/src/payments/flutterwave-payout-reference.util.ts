const FLUTTERWAVE_TRANSFER_REFERENCE_PATTERN = /^[a-zA-Z0-9-]{6,42}$/;

export function isValidFlutterwaveTransferReference(reference: string): boolean {
  return FLUTTERWAVE_TRANSFER_REFERENCE_PATTERN.test(reference);
}

/** Flutterwave transfer references: 6-42 alphanumeric/hyphen chars, unique per transfer. */
export function buildFlutterwavePayoutReference(orderId: string): string {
  const compactOrderId = orderId.replace(/-/g, '');
  const reference = `po-${compactOrderId}`;
  if (!isValidFlutterwaveTransferReference(reference)) {
    throw new Error('Could not build a valid Flutterwave payout reference.');
  }
  return reference;
}

export function resolveFlutterwavePayoutReference(order: {
  id: string;
  flutterwavePayoutReference?: string | null;
}): string {
  const existing = order.flutterwavePayoutReference?.trim();
  if (existing && isValidFlutterwaveTransferReference(existing)) {
    return existing;
  }
  return buildFlutterwavePayoutReference(order.id);
}
