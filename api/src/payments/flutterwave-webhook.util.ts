export type FlutterwaveWebhookPayload = {
  type?: string;
  event?: string;
  data?: {
    id?: string;
    reference?: string;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

export type NormalizedFlutterwaveWebhook = {
  eventType: string;
  reference: string;
  transferId?: string;
  status?: string;
  amount?: number;
  currency?: string;
};

export function normalizeFlutterwaveWebhook(
  body: FlutterwaveWebhookPayload,
): NormalizedFlutterwaveWebhook | null {
  const data = body.data;
  if (!data) {
    return null;
  }

  const reference = data.reference?.trim() || data.tx_ref?.trim();
  if (!reference) {
    return null;
  }

  return {
    eventType: body.type ?? body.event ?? '',
    reference,
    transferId: data.id?.trim(),
    status: data.status?.toLowerCase(),
    amount: data.amount,
    currency: data.currency,
  };
}

export function buildWebhookDedupeKey(
  normalized: NormalizedFlutterwaveWebhook,
): string {
  if (normalized.transferId) {
    return `${normalized.eventType}:${normalized.transferId}`;
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
