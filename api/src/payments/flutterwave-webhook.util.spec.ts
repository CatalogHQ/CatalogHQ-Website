import {
  buildWebhookDedupeKey,
  isChargeCompletedEvent,
  isSuccessfulPaymentStatus,
  normalizeFlutterwaveWebhook,
} from './flutterwave-webhook.util';

describe('flutterwave-webhook.util', () => {
  it('normalizes v4 charge.completed payloads', () => {
    expect(
      normalizeFlutterwaveWebhook({
        id: 'wbk_test123',
        timestamp: 1735116884019,
        type: 'charge.completed',
        data: {
          id: 'chg_test123',
          reference: '49c3c6f5-aedd-4443-9eb4-92c51758f04a',
          status: 'succeeded',
          amount: 5100,
          currency: 'NGN',
          meta: { paymentRef: 'SHP-abc', orderId: 'order-1' },
          customer: { email: 'buyer@example.com' },
        },
      }),
    ).toEqual({
      eventType: 'charge.completed',
      reference: 'flw-SHP-abc',
      chargeId: 'chg_test123',
      paymentRefHint: 'SHP-abc',
      orderIdHint: 'order-1',
      status: 'succeeded',
      amount: 5100,
      currency: 'NGN',
    });
  });

  it('normalizes v3 charge.completed payloads with numeric data.id', () => {
    expect(
      normalizeFlutterwaveWebhook({
        event: 'charge.completed',
        data: {
          id: 9876543210,
          tx_ref: 'flw-SHP-legacy',
          status: 'successful',
          amount: 3000,
          currency: 'NGN',
        },
      }),
    ).toEqual({
      eventType: 'charge.completed',
      reference: 'flw-SHP-legacy',
      chargeId: '9876543210',
      orderIdHint: undefined,
      paymentRefHint: undefined,
      status: 'successful',
      amount: 3000,
      currency: 'NGN',
    });
  });

  it('builds dedupe keys from webhook id when present', () => {
    expect(
      buildWebhookDedupeKey(
        {
          eventType: 'charge.completed',
          reference: 'flw-SHP-abc',
          status: 'succeeded',
        },
        'wbk_test123',
      ),
    ).toBe('charge.completed:wbk_test123');
  });

  it('detects successful payment statuses across v3 and v4', () => {
    expect(isSuccessfulPaymentStatus('succeeded')).toBe(true);
    expect(isSuccessfulPaymentStatus('successful')).toBe(true);
    expect(isSuccessfulPaymentStatus('failed')).toBe(false);
  });

  it('detects charge.completed events', () => {
    expect(isChargeCompletedEvent('charge.completed')).toBe(true);
    expect(isChargeCompletedEvent('transfer.completed')).toBe(false);
  });
});
