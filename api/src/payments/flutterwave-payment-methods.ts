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

export function sanitizeFlutterwaveNamePart(value: string): string {
  const cleaned = value
    .replace(/[^A-Za-z ,.'-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (cleaned.length >= 2) {
    return cleaned.slice(0, 50);
  }

  return 'Customer';
}

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
    const only = sanitizeFlutterwaveNamePart(parts[0]);
    return { first: only, last: only };
  }

  const first = sanitizeFlutterwaveNamePart(parts[0]);
  const last = sanitizeFlutterwaveNamePart(parts[parts.length - 1]);
  const middle =
    parts.length > 2
      ? sanitizeFlutterwaveNamePart(parts.slice(1, -1).join(' '))
      : undefined;

  return {
    first,
    ...(middle && middle !== first ? { middle } : {}),
    last,
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

export function isFlutterwaveCustomerExistsMessage(
  message: string | undefined,
): boolean {
  if (!message) {
    return false;
  }

  const lower = message.toLowerCase();
  return (
    lower.includes('customer already exists') ||
    lower.includes('customer exists') ||
    (lower.includes('already exists') && lower.includes('customer'))
  );
}

export function buildFlutterwaveCheckoutEmail(phone: string): string {
  const digits = normalizeNigerianPhoneForFlutterwave(phone);
  return `buyer${digits}@cataloghq.ng`;
}

export function buildFlutterwaveOrchestratorCustomer(input: {
  email: string;
  name: string;
  phone: string;
}): Record<string, unknown> {
  const nameParts = splitCustomerName(input.name);
  const phoneNumber = normalizeNigerianPhoneForFlutterwave(input.phone);
  const email = buildFlutterwaveCheckoutEmail(input.phone);

  return {
    email,
    name: nameParts,
    phone: {
      country_code: '234',
      number: phoneNumber,
    },
  };
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
