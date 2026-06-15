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
          reference: 'SHP-abc',
          status: 'succeeded',
          amount: 5100,
          currency: 'NGN',
          customer: { email: 'buyer@example.com' },
        },
      }),
    ).toEqual({
      eventType: 'charge.completed',
      reference: 'SHP-abc',
      transferId: 'chg_test123',
      status: 'succeeded',
      amount: 5100,
      currency: 'NGN',
    });
  });

  it('builds dedupe keys from webhook id when present', () => {
    expect(
      buildWebhookDedupeKey(
        {
          eventType: 'charge.completed',
          reference: 'SHP-abc',
          status: 'succeeded',
        },
        'wbk_test123',
      ),
    ).toBe('charge.completed:wbk_test123');
  });

  it('normalizes v3 charge.completed payloads', () => {
    expect(
      normalizeFlutterwaveWebhook({
        event: 'charge.completed',
        data: {
          tx_ref: 'sub_abc123',
          status: 'successful',
          amount: 3000,
          currency: 'NGN',
        },
      }),
    ).toEqual({
      eventType: 'charge.completed',
      reference: 'sub_abc123',
      status: 'successful',
      amount: 3000,
      currency: 'NGN',
    });
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
