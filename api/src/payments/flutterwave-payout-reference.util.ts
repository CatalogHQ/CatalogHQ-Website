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

/** Fresh reference for retrying a failed payout (Flutterwave references are one-time). */
export function buildFlutterwavePayoutRetryReference(orderId: string): string {
  const suffix = `-r${Date.now().toString(36).slice(-4)}`;
  const compactOrderId = orderId.replace(/-/g, '');
  const base = `po-${compactOrderId}`.slice(0, 42 - suffix.length);
  const reference = `${base}${suffix}`;
  if (!isValidFlutterwaveTransferReference(reference)) {
    throw new Error('Could not build a valid Flutterwave payout retry reference.');
  }
  return reference;
}

export function resolveFlutterwavePayoutReference(order: {
  id: string;
  flutterwavePayoutReference?: string | null;
  payoutStatus?: string;
}): string {
  const existing = order.flutterwavePayoutReference?.trim();
  if (
    existing &&
    isValidFlutterwaveTransferReference(existing) &&
    order.payoutStatus !== 'failed'
  ) {
    return existing;
  }

  if (order.payoutStatus === 'failed') {
    return buildFlutterwavePayoutRetryReference(order.id);
  }

  return buildFlutterwavePayoutReference(order.id);
}
