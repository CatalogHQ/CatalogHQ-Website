import {
  FLUTTERWAVE_SANDBOX_BANK_CODE,
  isFlutterwaveSandbox,
  isFlutterwaveSandboxBankRestrictionMessage,
  isFlutterwaveStaleSubaccountMessage,
  normalizeNigerianBankCode,
} from './flutterwave-bank.util';

describe('flutterwave-bank.util', () => {
  it('normalizes bank codes to numeric 3-digit strings', () => {
    expect(normalizeNigerianBankCode('44')).toBe('044');
    expect(normalizeNigerianBankCode('044')).toBe('044');
    expect(normalizeNigerianBankCode(58)).toBe('058');
  });

  it('detects sandbox bank restriction errors', () => {
    expect(
      isFlutterwaveSandboxBankRestrictionMessage(
        'destbankcode/account_bank must be numberic and only 044 is allowed',
      ),
    ).toBe(true);
  });

  it('treats non-production env as sandbox', () => {
    expect(isFlutterwaveSandbox('sandbox')).toBe(true);
    expect(isFlutterwaveSandbox('production')).toBe(false);
  });

  it('detects stale subaccount errors after env or account switch', () => {
    expect(isFlutterwaveStaleSubaccountMessage('Merchant not found')).toBe(
      true,
    );
    expect(isFlutterwaveStaleSubaccountMessage('Subaccount not found')).toBe(
      true,
    );
    expect(isFlutterwaveStaleSubaccountMessage('Invalid bank')).toBe(false);
  });

  it('uses 044 as sandbox bank code constant', () => {
    expect(FLUTTERWAVE_SANDBOX_BANK_CODE).toBe('044');
  });
});
