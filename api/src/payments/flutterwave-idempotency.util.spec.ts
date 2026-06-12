import { flutterwaveIdempotencyKey } from './flutterwave-idempotency.util';

describe('flutterwaveIdempotencyKey', () => {
  it('is stable for the same scope and id', () => {
    const a = flutterwaveIdempotencyKey('charge', 'flw-SHP-20260612-ABCD');
    const b = flutterwaveIdempotencyKey('charge', 'flw-SHP-20260612-ABCD');
    expect(a).toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('differs across scopes or ids', () => {
    const charge = flutterwaveIdempotencyKey('charge', 'flw-ref-1');
    const customer = flutterwaveIdempotencyKey('customer', 'flw-ref-1');
    expect(charge).not.toBe(customer);
  });
});
