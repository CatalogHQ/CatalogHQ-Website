import { buildFlutterwaveReference } from './flutterwave-reference.util';
import {
  coerceWebhookString,
  extractWebhookMetaValue,
  resolveWebhookGatewayReference,
} from './flutterwave-webhook-coerce.util';

describe('flutterwave-webhook-coerce.util', () => {
  it('coerces numeric webhook ids to strings', () => {
    expect(coerceWebhookString(9876543210)).toBe('9876543210');
  });

  it('prefers tx_ref for gateway reference lookup', () => {
    expect(
      resolveWebhookGatewayReference({
        tx_ref: 'flw-SHP-abc123',
        reference: '49c3c6f5-aedd-4443-9eb4-92c51758f04a',
      }),
    ).toBe('flw-SHP-abc123');
  });

  it('builds gateway reference from meta paymentRef', () => {
    expect(
      resolveWebhookGatewayReference({
        reference: '49c3c6f5-aedd-4443-9eb4-92c51758f04a',
        meta: { paymentRef: 'SHP-abc123', orderId: 'order-1' },
      }),
    ).toBe('flw-SHP-abc123');
  });

  it('extracts meta values safely', () => {
    expect(
      extractWebhookMetaValue({ paymentRef: 'SHP-abc123' }, 'paymentRef'),
    ).toBe('SHP-abc123');
  });
});
