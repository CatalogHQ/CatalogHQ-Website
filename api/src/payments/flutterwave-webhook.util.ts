export type FlutterwaveWebhookPayload = {
  type?: string;
  event?: string;
  data?: {
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
    status: data.status?.toLowerCase(),
    amount: data.amount,
    currency: data.currency,
  };
}

export function isChargeCompletedEvent(eventType: string): boolean {
  return eventType === 'charge.completed';
}

export function isChargeFailedEvent(eventType: string): boolean {
  return eventType === 'charge.failed';
}

export function isSuccessfulPaymentStatus(status?: string): boolean {
  return status === 'succeeded' || status === 'successful';
}
