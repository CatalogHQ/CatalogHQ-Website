import {
  computeCheckoutPricing,
  customerPriceForVendorNet,
  estimateVendorNetFromCustomerTotal,
  FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
  roundCustomerPayAmount,
} from './flutterwave-fees.util';

describe('flutterwave-fees.util', () => {
  it('adds fee on top so vendor receives the listed amount', () => {
    const pricing = computeCheckoutPricing(5000);
    expect(pricing.vendorNet).toBe(5000);
    expect(pricing.customerTotal).toBe(5150);
    expect(pricing.processingFee).toBe(150);
    expect(estimateVendorNetFromCustomerTotal(pricing.customerTotal)).toBeGreaterThanOrEqual(
      5000,
    );
  });

  it('scales fee for multi-item vendor totals', () => {
    const pricing = computeCheckoutPricing(5000);
    expect(pricing.customerTotal).toBe(
      roundCustomerPayAmount(customerPriceForVendorNet(5000)),
    );
    expect(pricing.processingFee).toBe(pricing.customerTotal - 5000);
  });

  it('rounds customer totals ending below 50 naira up to the next 50', () => {
    expect(roundCustomerPayAmount(1020)).toBe(1050);
    expect(roundCustomerPayAmount(1049)).toBe(1050);
    expect(roundCustomerPayAmount(1050)).toBe(1050);
    expect(roundCustomerPayAmount(5102)).toBe(5150);
    expect(roundCustomerPayAmount(152000)).toBe(152000);
  });

  it('caps processing fee at NGN 2000', () => {
    const pricing = computeCheckoutPricing(150_000);
    expect(pricing.processingFee).toBe(
      FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
    );
    expect(pricing.customerTotal).toBe(152_000);
    expect(estimateVendorNetFromCustomerTotal(pricing.customerTotal)).toBeGreaterThanOrEqual(
      150_000,
    );
  });
});
