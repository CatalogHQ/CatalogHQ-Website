/** Flutterwave minimum NGN amount per bank transfer payout. */
export const MIN_VENDOR_PAYOUT_NAIRA = 300;

export function isVendorPayoutAmountEligible(amountNaira: number): boolean {
  return amountNaira >= MIN_VENDOR_PAYOUT_NAIRA;
}

export function vendorPayoutMinimumMessage(): string {
  return `Minimum payout amount is ${MIN_VENDOR_PAYOUT_NAIRA} NGN.`;
}
