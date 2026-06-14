/** Flutterwave domestic Naira checkout (cards, bank transfer, USSD, OPay, etc.) */
export const FLUTTERWAVE_DOMESTIC_FEE_RATE = 0.02;
export const FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN = 2000;

export const FLUTTERWAVE_FEE_SUMMARY =
  "2% per successful payment, capped at ₦2,000 (domestic Naira methods)";

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

/** List price that yields approximately `targetNet` after Flutterwave fee. */
export function suggestListPriceForNet(targetNet: number): number {
  if (targetNet <= 0) return 0;

  const uncappedPrice = Math.ceil(
    targetNet / (1 - FLUTTERWAVE_DOMESTIC_FEE_RATE),
  );
  const uncappedFee = estimateFlutterwaveFee(uncappedPrice);

  if (uncappedFee < FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN) {
    return uncappedPrice;
  }

  return targetNet + FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN;
}
