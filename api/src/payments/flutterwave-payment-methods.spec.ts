import {
  buildFlutterwavePaymentMethod,
  normalizeNigerianPhoneForFlutterwave,
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

  it('builds opay payment method payload', () => {
    expect(
      buildFlutterwavePaymentMethod({
        paymentMethod: 'opay',
        phone: '08012345678',
      }),
    ).toEqual({ type: 'opay' });
  });

  it('builds ussd payment method payload', () => {
    expect(
      buildFlutterwavePaymentMethod({
        paymentMethod: 'ussd',
        phone: '08012345678',
        ussdBankCode: '044',
      }),
    ).toEqual({
      type: 'ussd',
      ussd: { account_bank: '044' },
    });
  });
});
