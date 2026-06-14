export const FLUTTERWAVE_SANDBOX_BANK_CODE = '044';

export const FLUTTERWAVE_SANDBOX_TEST_ACCOUNT_NUMBERS = [
  '0690000032',
  '0690000034',
  '0690000037',
] as const;

export function isFlutterwaveSandbox(env: string | undefined): boolean {
  return env !== 'production';
}

export function normalizeNigerianBankCode(code: string | number): string {
  const digits = String(code).replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.length <= 3) {
    return digits.padStart(3, '0');
  }

  return digits;
}

export function isFlutterwaveSandboxBankRestrictionMessage(
  message: string | undefined,
): boolean {
  if (!message) {
    return false;
  }

  return message.toLowerCase().includes('only 044 is allowed');
}
