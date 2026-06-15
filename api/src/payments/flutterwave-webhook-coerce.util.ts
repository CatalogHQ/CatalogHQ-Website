import { buildFlutterwaveReference } from './flutterwave-reference.util';

export function coerceWebhookString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return undefined;
}

export function extractWebhookMetaValue(
  meta: unknown,
  key: string,
): string | undefined {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return undefined;
  }

  return coerceWebhookString((meta as Record<string, unknown>)[key]);
}

export function resolveWebhookGatewayReference(data: {
  reference?: unknown;
  tx_ref?: unknown;
  meta?: unknown;
}): string | undefined {
  const txRef = coerceWebhookString(data.tx_ref);
  if (txRef) {
    return txRef;
  }

  const metaPaymentRef = extractWebhookMetaValue(data.meta, 'paymentRef');
  if (metaPaymentRef) {
    return buildFlutterwaveReference(metaPaymentRef);
  }

  const reference = coerceWebhookString(data.reference);
  if (!reference) {
    return undefined;
  }

  if (reference.startsWith('SHP-')) {
    return buildFlutterwaveReference(reference);
  }

  return reference;
}
