/** Flutterwave domestic Naira checkout (cards, bank transfer, USSD, OPay, etc.) */
export const FLUTTERWAVE_DOMESTIC_FEE_RATE = 0.02;
export const FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN = 2000;

export function estimateFlutterwaveFee(amountNgn: number): number {
  if (amountNgn <= 0) return 0;
  return Math.min(
    Math.round(amountNgn * FLUTTERWAVE_DOMESTIC_FEE_RATE),
    FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
  );
}

export function estimateVendorNet(amountNgn: number): number {
  return Math.max(0, amountNgn - estimateFlutterwaveFee(amountNgn));
}
