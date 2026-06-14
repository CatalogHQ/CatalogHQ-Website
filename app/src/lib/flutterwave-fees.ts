/** Flutterwave domestic Naira checkout (cards, bank transfer, USSD, OPay, etc.) */
export const FLUTTERWAVE_DOMESTIC_FEE_RATE = 0.02;
export const FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN = 2000;

export const FLUTTERWAVE_FEE_SUMMARY =
  "2% per successful payment, capped at ₦2,000 (domestic Naira methods)";

export type CheckoutPricing = {
  vendorNet: number;
  processingFee: number;
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
  return Math.max(0, customerTotalNgn - estimateFlutterwaveFee(customerTotalNgn));
}

/** Smallest customer total so the vendor receives at least `vendorNet` after fees. */
export function customerPriceForVendorNet(vendorNet: number): number {
  if (vendorNet <= 0) return 0;

  let low = vendorNet;
  let high =
    vendorNet +
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
  const customerTotal = customerPriceForVendorNet(normalizedVendorNet);

  return {
    vendorNet: normalizedVendorNet,
    processingFee: customerTotal - normalizedVendorNet,
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

export function customerUnitDisplayPrice(vendorUnitPrice: number): number {
  return customerPriceForVendorNet(vendorUnitPrice);
}
