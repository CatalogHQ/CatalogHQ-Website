import {
  isVendorPayoutAmountEligible,
  MIN_VENDOR_PAYOUT_NAIRA,
  vendorPayoutMinimumMessage,
} from './vendor-payout.constants';

describe('vendor-payout.constants', () => {
  it('defines a 300 NGN minimum payout', () => {
    expect(MIN_VENDOR_PAYOUT_NAIRA).toBe(300);
  });

  it('treats amounts at or above the minimum as eligible', () => {
    expect(isVendorPayoutAmountEligible(300)).toBe(true);
    expect(isVendorPayoutAmountEligible(301)).toBe(true);
  });

  it('rejects amounts below the minimum', () => {
    expect(isVendorPayoutAmountEligible(299)).toBe(false);
    expect(isVendorPayoutAmountEligible(0)).toBe(false);
  });

  it('describes the minimum in user-facing copy', () => {
    expect(vendorPayoutMinimumMessage()).toContain('300');
  });
});
