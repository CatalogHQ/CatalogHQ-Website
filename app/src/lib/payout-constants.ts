/** Flutterwave minimum NGN amount per bank transfer payout. */
export const MIN_VENDOR_PAYOUT_NAIRA = 300;

export function isVendorPayoutAmountEligible(amountNaira: number): boolean {
  return amountNaira >= MIN_VENDOR_PAYOUT_NAIRA;
}

export function getPayoutStatusLabel(
  order: {
    payoutStatus?: string;
    vendorNet?: number;
  },
  labels: Record<string, string>,
): string {
  const status = order.payoutStatus ?? "pending";
  const vendorNet = order.vendorNet ?? 0;

  if (
    status === "pending" &&
    vendorNet > 0 &&
    vendorNet < MIN_VENDOR_PAYOUT_NAIRA
  ) {
    return `Below ₦${MIN_VENDOR_PAYOUT_NAIRA.toLocaleString("en-NG")} minimum`;
  }

  return labels[status] ?? status;
}
