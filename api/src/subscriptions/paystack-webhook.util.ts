import { createHmac, timingSafeEqual } from 'crypto';

export type PaystackWebhookEvent = {
  event: string;
  data: Record<string, unknown>;
};

export type NormalizedPaystackCharge = {
  reference: string;
  amountKobo: number;
  currency: string;
  customerCode?: string;
  subscriptionCode?: string;
  planCode?: string;
  authorizationCode?: string;
  email?: string;
  successful: boolean;
};

export type NormalizedPaystackSubscription = {
  subscriptionCode: string;
  emailToken?: string;
  customerCode?: string;
  planCode?: string;
  authorizationCode?: string;
};

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | undefined,
  secret: string,
): void {
  if (!signature?.trim()) {
    throw new Error('Missing Paystack webhook signature');
  }

  const digest = createHmac('sha512', secret).update(rawBody).digest('hex');
  const expected = Buffer.from(digest, 'utf8');
  const received = Buffer.from(signature.trim(), 'utf8');

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error('Invalid Paystack webhook signature');
  }
}

export function buildPaystackWebhookDedupeKey(
  event: string,
  reference?: string,
  eventId?: string,
): string {
  const parts = ['paystack', event];
  if (reference) {
    parts.push(reference);
  }
  if (eventId) {
    parts.push(eventId);
  }
  return parts.join(':');
}

export function normalizePaystackChargeEvent(
  payload: PaystackWebhookEvent,
): NormalizedPaystackCharge | null {
  const data = readRecord(payload.data);
  if (!data) {
    return null;
  }

  const reference = readString(data.reference);
  const amountKobo = readNumber(data.amount);
  if (!reference || amountKobo === undefined) {
    return null;
  }

  const customer = readRecord(data.customer);
  const plan = readRecord(data.plan);
  const authorization = readRecord(data.authorization);
  const subscription = readRecord(data.subscription);
  const status = readString(data.status)?.toLowerCase();

  return {
    reference,
    amountKobo: Math.round(amountKobo),
    currency: readString(data.currency)?.toUpperCase() ?? 'NGN',
    customerCode: readString(customer?.customer_code),
    subscriptionCode:
      readString(subscription?.subscription_code) ??
      readString(subscription?.code),
    planCode: readString(plan?.plan_code) ?? readString(plan?.code),
    authorizationCode: readString(authorization?.authorization_code),
    email: readString(customer?.email) ?? readString(data.email),
    successful: payload.event === 'charge.success' || status === 'success',
  };
}

export function normalizePaystackSubscriptionEvent(
  payload: PaystackWebhookEvent,
): NormalizedPaystackSubscription | null {
  const data = readRecord(payload.data);
  if (!data) {
    return null;
  }

  const subscriptionCode =
    readString(data.subscription_code) ?? readString(data.code);
  if (!subscriptionCode) {
    return null;
  }

  const customer = readRecord(data.customer);
  const plan = readRecord(data.plan);
  const authorization = readRecord(data.authorization);

  return {
    subscriptionCode,
    emailToken: readString(data.email_token),
    customerCode: readString(customer?.customer_code),
    planCode: readString(plan?.plan_code) ?? readString(plan?.code),
    authorizationCode: readString(authorization?.authorization_code),
  };
}

export function isPaystackChargeEvent(event: string): boolean {
  return event === 'charge.success' || event === 'charge.failed';
}

export function isPaystackSubscriptionLifecycleEvent(event: string): boolean {
  return (
    event === 'subscription.create' ||
    event === 'subscription.disable' ||
    event === 'subscription.not_renew'
  );
}

export function isPaystackAuthorizationActiveEvent(event: string): boolean {
  return event === 'direct_debit.authorization.active';
}
