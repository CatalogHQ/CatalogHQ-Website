import {
  coerceWebhookString,
  extractWebhookMetaValue,
  resolveWebhookGatewayReference,
} from './flutterwave-webhook-coerce.util';

export type FlutterwaveWebhookPayload = {
  id?: unknown;
  timestamp?: unknown;
  type?: string;
  event?: string;
  data?: {
    id?: unknown;
    reference?: unknown;
    tx_ref?: unknown;
    status?: unknown;
    amount?: unknown;
    currency?: unknown;
    meta?: unknown;
    [key: string]: unknown;
  };
};

export type NormalizedFlutterwaveWebhook = {
  eventType: string;
  reference: string;
  chargeId?: string;
  paymentRefHint?: string;
  orderIdHint?: string;
  status?: string;
  amount?: number;
  currency?: string;
};

function coerceWebhookAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function normalizeFlutterwaveWebhook(
  body: FlutterwaveWebhookPayload,
): NormalizedFlutterwaveWebhook | null {
  const data = body.data;
  if (!data) {
    return null;
  }

  const reference = resolveWebhookGatewayReference(data);
  if (!reference) {
    return null;
  }

  const status = coerceWebhookString(data.status)?.toLowerCase();

  return {
    eventType: body.type ?? body.event ?? '',
    reference,
    chargeId: coerceWebhookString(data.id),
    paymentRefHint: extractWebhookMetaValue(data.meta, 'paymentRef'),
    orderIdHint: extractWebhookMetaValue(data.meta, 'orderId'),
    status,
    amount: coerceWebhookAmount(data.amount),
    currency: coerceWebhookString(data.currency),
  };
}

export function buildWebhookDedupeKey(
  normalized: NormalizedFlutterwaveWebhook,
  webhookId?: unknown,
): string {
  const webhookKey = coerceWebhookString(webhookId);
  if (webhookKey) {
    return `${normalized.eventType}:${webhookKey}`;
  }
  if (normalized.chargeId) {
    return `${normalized.eventType}:${normalized.chargeId}`;
  }
  return `${normalized.eventType}:${normalized.reference}`;
}

export function isChargeCompletedEvent(eventType: string): boolean {
  return eventType === 'charge.completed';
}

export function isChargeFailedEvent(eventType: string): boolean {
  return eventType === 'charge.failed';
}

export function isTransferDisburseEvent(eventType: string): boolean {
  return eventType === 'transfer.disburse';
}

export function isSuccessfulPaymentStatus(status?: string): boolean {
  return status === 'succeeded' || status === 'successful';
}

export function isSuccessfulTransferStatus(status?: string): boolean {
  return status === 'successful';
}

export function isFailedTransferStatus(status?: string): boolean {
  return status === 'failed';
}
