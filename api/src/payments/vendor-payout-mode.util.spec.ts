import {
  FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV,
  isInstantVendorPayoutMode,
  parseVendorPayoutMode,
} from './vendor-payout-mode.util';

describe('vendor-payout-mode.util', () => {
  it('defaults to instant when unset or unknown', () => {
    expect(parseVendorPayoutMode(undefined)).toBe('instant');
    expect(parseVendorPayoutMode('')).toBe('instant');
    expect(parseVendorPayoutMode('legacy')).toBe('instant');
  });

  it('parses instant and split modes', () => {
    expect(parseVendorPayoutMode('instant')).toBe('instant');
    expect(parseVendorPayoutMode(' INSTANT ')).toBe('instant');
    expect(parseVendorPayoutMode('split')).toBe('split');
    expect(parseVendorPayoutMode(' SPLIT ')).toBe('split');
    expect(isInstantVendorPayoutMode('instant')).toBe(true);
    expect(isInstantVendorPayoutMode('split')).toBe(false);
  });

  it('exports env key constant', () => {
    expect(FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV).toBe(
      'FLUTTERWAVE_VENDOR_PAYOUT_MODE',
    );
  });
});
