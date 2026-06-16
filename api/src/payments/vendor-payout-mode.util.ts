export const FLUTTERWAVE_VENDOR_PAYOUT_MODE_ENV = 'FLUTTERWAVE_VENDOR_PAYOUT_MODE';

export type VendorPayoutMode = 'instant' | 'split';

export function parseVendorPayoutMode(raw?: string): VendorPayoutMode {
  const normalized = raw?.trim().toLowerCase();
  if (normalized === 'split') {
    return 'split';
  }
  return 'instant';
}

export function isInstantVendorPayoutMode(mode: VendorPayoutMode): boolean {
  return mode === 'instant';
}
