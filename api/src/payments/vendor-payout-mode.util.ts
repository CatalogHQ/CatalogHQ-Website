export const FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV = 'FLUTTERWAVE_VENDOR_PAYOUT_MODE';

export type VendorPayoutMode = 'instant' | 'split';

export function parseVendorPayoutMode(raw?: string): VendorPayoutMode {
  const normalized = raw?.trim().toLowerCase();
  if (normalized === 'instant') {
    return 'instant';
  }
  return 'split';
}

export function isInstantVendorPayoutMode(mode: VendorPayoutMode): boolean {
  return mode === 'instant';
}
