export const FLUTTERWAVE_PAYMENT_METHODS = [
  'opay',
  'mobile_money',
  'ussd',
  'bank_transfer',
] as const;

export type FlutterwavePaymentMethod =
  (typeof FLUTTERWAVE_PAYMENT_METHODS)[number];

export type FlutterwavePaymentMethodInput = {
  paymentMethod: FlutterwavePaymentMethod;
  phone: string;
  ussdBankCode?: string;
};

export function splitCustomerName(fullName: string): {
  first: string;
  middle?: string;
  last: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first: 'Customer', last: 'Customer' };
  }
  if (parts.length === 1) {
    return { first: parts[0], last: parts[0] };
  }
  return {
    first: parts[0],
    middle: parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined,
    last: parts[parts.length - 1],
  };
}

export function normalizeNigerianPhoneForFlutterwave(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) {
    return digits.slice(3);
  }
  if (digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function buildFlutterwavePaymentMethod(
  input: FlutterwavePaymentMethodInput,
): Record<string, unknown> {
  const phoneNumber = normalizeNigerianPhoneForFlutterwave(input.phone);

  switch (input.paymentMethod) {
    case 'opay':
      return { type: 'opay' };
    case 'mobile_money':
      return {
        type: 'mobile_money',
        mobile_money: {
          country_code: '234',
          network: 'MTN',
          phone_number: phoneNumber,
        },
      };
    case 'ussd':
      if (!input.ussdBankCode) {
        throw new Error('USSD bank code is required.');
      }
      return {
        type: 'ussd',
        ussd: { account_bank: input.ussdBankCode },
      };
    case 'bank_transfer':
      return { type: 'bank_transfer' };
    default:
      return { type: 'opay' };
  }
}
