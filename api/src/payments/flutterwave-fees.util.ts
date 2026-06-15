/** Flutterwave domestic Naira checkout (cards, bank transfer, USSD, OPay, etc.) */
export const FLUTTERWAVE_DOMESTIC_FEE_RATE = 0.02;
export const FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN = 2000;

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

/** If the last two naira digits are below 50, round the amount up to the next 50. */
export function roundCustomerPayAmount(amount: number): number {
  if (amount <= 0) {
    return 0;
  }

  const lastTwoDigits = amount % 100;
  if (lastTwoDigits === 0 || lastTwoDigits >= 50) {
    return amount;
  }

  return amount + (50 - lastTwoDigits);
}

export function computeCheckoutPricing(vendorNet: number): CheckoutPricing {
  const normalizedVendorNet = Math.max(0, vendorNet);
  const rawCustomerTotal = customerPriceForVendorNet(normalizedVendorNet);
  const customerTotal = roundCustomerPayAmount(rawCustomerTotal);

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
