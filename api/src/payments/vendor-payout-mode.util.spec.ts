import {
  FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV,
  isInstantVendorPayoutMode,
  parseVendorPayoutMode,
} from './vendor-payout-mode.util';

describe('vendor-payout-mode.util', () => {
  it('defaults to split when unset or unknown', () => {
    expect(parseVendorPayoutMode(undefined)).toBe('split');
    expect(parseVendorPayoutMode('')).toBe('split');
    expect(parseVendorPayoutMode('legacy')).toBe('split');
  });

  it('parses instant mode', () => {
    expect(parseVendorPayoutMode('instant')).toBe('instant');
    expect(parseVendorPayoutMode(' INSTANT ')).toBe('instant');
    expect(isInstantVendorPayoutMode('instant')).toBe(true);
  });

  it('exports env key constant', () => {
    expect(FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV).toBe(
      'FLUTTERWAVE_VENDOR_PAYOUT_MODE',
    );
  });
});
