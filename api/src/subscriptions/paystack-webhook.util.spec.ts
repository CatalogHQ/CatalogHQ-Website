import { createHmac } from 'crypto';
import {
  normalizePaystackChargeEvent,
  verifyPaystackWebhookSignature,
} from './paystack-webhook.util';

describe('paystack-webhook.util', () => {
  it('verifies Paystack webhook signatures', () => {
    const rawBody = '{"event":"charge.success"}';
    const secret = 'test-secret';
    const signature = createHmac('sha512', secret).update(rawBody).digest('hex');

    expect(() =>
      verifyPaystackWebhookSignature(rawBody, signature, secret),
    ).not.toThrow();

    expect(() =>
      verifyPaystackWebhookSignature(rawBody, 'invalid', secret),
    ).toThrow('Invalid Paystack webhook signature');
  });

  it('normalizes charge.success payloads', () => {
    const normalized = normalizePaystackChargeEvent({
      event: 'charge.success',
      data: {
        reference: 'sub_abc123',
        amount: 300000,
        currency: 'NGN',
        status: 'success',
        customer: { customer_code: 'CUS_123', email: 'vendor@example.com' },
        plan: { plan_code: 'PLN_test' },
        subscription: { subscription_code: 'SUB_test' },
        authorization: { authorization_code: 'AUTH_test' },
      },
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        reference: 'sub_abc123',
        amountKobo: 300000,
        currency: 'NGN',
        successful: true,
        customerCode: 'CUS_123',
        subscriptionCode: 'SUB_test',
      }),
    );
  });
});
