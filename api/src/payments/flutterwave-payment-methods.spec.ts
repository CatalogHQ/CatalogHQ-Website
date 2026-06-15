import {
  buildFlutterwaveCheckoutEmail,
  buildFlutterwaveOrchestratorCustomer,
  buildFlutterwavePaymentMethod,
  isFlutterwaveCustomerExistsMessage,
  normalizeNigerianPhoneForFlutterwave,
  sanitizeFlutterwaveNamePart,
  splitCustomerName,
} from './flutterwave-payment-methods';

describe('flutterwave-payment-methods', () => {
  it('splits customer names', () => {
    expect(splitCustomerName('Ada Lovelace')).toEqual({
      first: 'Ada',
      last: 'Lovelace',
    });
  });

  it('normalizes Nigerian phone numbers', () => {
    expect(normalizeNigerianPhoneForFlutterwave('08012345678')).toBe(
      '8012345678',
    );
    expect(normalizeNigerianPhoneForFlutterwave('2348012345678')).toBe(
      '8012345678',
    );
  });

  it('builds a valid Flutterwave customer without partial address', () => {
    expect(
      buildFlutterwaveOrchestratorCustomer({
        email: 'buyer8012345678@cataloghq.ng',
        name: 'Ada Lovelace',
        phone: '08012345678',
      }),
    ).toEqual({
      email: 'buyer8012345678@cataloghq.ng',
      name: { first: 'Ada', last: 'Lovelace' },
      phone: { country_code: '234', number: '8012345678' },
    });
  });

  it('sanitizes short customer names for Flutterwave', () => {
    expect(sanitizeFlutterwaveNamePart('A')).toBe('Customer');
    expect(splitCustomerName('Chidi')).toEqual({
      first: 'Chidi',
      last: 'Chidi',
    });
  });

  it('builds checkout email from phone', () => {
    expect(buildFlutterwaveCheckoutEmail('08012345678')).toBe(
      'buyer8012345678@cataloghq.ng',
    );
  });

  it('detects Flutterwave customer already exists errors', () => {
    expect(isFlutterwaveCustomerExistsMessage('Customer already exists')).toBe(
      true,
    );
    expect(isFlutterwaveCustomerExistsMessage('Invalid amount')).toBe(false);
  });

  it('builds bank transfer payment method payload', () => {
    expect(
      buildFlutterwavePaymentMethod({
        paymentMethod: 'bank_transfer',
        phone: '08012345678',
      }),
    ).toEqual({ type: 'bank_transfer' });
  });
});
