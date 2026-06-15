export function buildFlutterwavePayoutReference(paymentRef: string): string {
  return `payout-${paymentRef}`;
}
