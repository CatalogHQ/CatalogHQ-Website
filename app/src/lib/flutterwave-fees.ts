/** Flutterwave domestic Naira checkout (cards, bank transfer, USSD, OPay, etc.) */
export const FLUTTERWAVE_DOMESTIC_FEE_RATE = 0.02;
export const FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN = 2000;

/** Fixed CatalogHQ fee added to every checkout (platform commission). */
export const CATALOGHQ_SERVICE_FEE_NGN = 20;

export const FLUTTERWAVE_FEE_SUMMARY =
  "2% per successful payment, capped at ₦2,000 (domestic Naira methods)";

export const SECURE_PAYMENT_FEE_LABEL =
  "Secure payment & buyer protection fee";

export const CATALOGHQ_SERVICE_FEE_LABEL = "Service fee";

export type CheckoutPricing = {
  vendorNet: number;
  paymentProcessingFee: number;
  serviceFee: number;
  /** Flutterwave fee + CatalogHQ service fee (customer-facing fees above vendor net). */
  processingFee: number;
  /** Platform commission kept from checkout (same as serviceFee). */
  platformFee: number;
  customerTotal: number;
};

export function estimateFlutterwaveFee(customerTotalNgn: number): number {
  if (customerTotalNgn <= 0) return 0;
  return Math.min(
    Math.round(customerTotalNgn * FLUTTERWAVE_DOMESTIC_FEE_RATE),
    FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
  );
}

export function estimateVendorNetFromCustomerTotal(
  customerTotalNgn: number,
): number {
  if (customerTotalNgn <= 0) return 0;
  return Math.max(
    0,
    customerTotalNgn -
      estimateFlutterwaveFee(customerTotalNgn) -
      CATALOGHQ_SERVICE_FEE_NGN,
  );
}

/** Smallest customer total so the vendor receives at least `vendorNet` after fees. */
export function customerTotalForVendorNet(vendorNet: number): number {
  if (vendorNet <= 0) return 0;

  const serviceFee = CATALOGHQ_SERVICE_FEE_NGN;
  let low = vendorNet + serviceFee;
  let high =
    vendorNet +
    serviceFee +
    FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN +
    Math.max(100, Math.ceil(vendorNet * 0.05));

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (estimateVendorNetFromCustomerTotal(mid) >= vendorNet) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}

export function computeCheckoutPricing(vendorNet: number): CheckoutPricing {
  const normalizedVendorNet = Math.max(0, vendorNet);
  const customerTotal = customerTotalForVendorNet(normalizedVendorNet);
  const paymentProcessingFee = estimateFlutterwaveFee(customerTotal);
  const serviceFee =
    normalizedVendorNet > 0 ? CATALOGHQ_SERVICE_FEE_NGN : 0;

  return {
    vendorNet: normalizedVendorNet,
    paymentProcessingFee,
    serviceFee,
    processingFee: paymentProcessingFee + serviceFee,
    platformFee: serviceFee,
    customerTotal,
  };
}

export function vendorNetFromOrderLine(input: {
  unitPrice: number;
  quantity: number;
  deliveryFee?: number;
  discountAmount?: number;
}): number {
  return Math.max(
    0,
    input.unitPrice * input.quantity +
      (input.deliveryFee ?? 0) -
      (input.discountAmount ?? 0),
  );
}
