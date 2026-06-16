import {
  computeCheckoutPricing,
  CATALOGHQ_SERVICE_FEE_NGN,
  customerTotalForVendorNet,
  estimateFlutterwaveFee,
  estimateVendorNetFromCustomerTotal,
  FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
} from './flutterwave-fees.util';

describe('flutterwave-fees.util', () => {
  it('adds Flutterwave fee and service fee so vendor receives the listed amount', () => {
    const pricing = computeCheckoutPricing(5000);
    expect(pricing.vendorNet).toBe(5000);
    expect(pricing.serviceFee).toBe(CATALOGHQ_SERVICE_FEE_NGN);
    expect(pricing.paymentProcessingFee).toBe(
      estimateFlutterwaveFee(pricing.customerTotal),
    );
    expect(pricing.customerTotal).toBe(
      pricing.vendorNet +
        pricing.paymentProcessingFee +
        pricing.serviceFee,
    );
    expect(estimateVendorNetFromCustomerTotal(pricing.customerTotal)).toBe(
      5000,
    );
  });

  it('uses minimum customer total for multi-item vendor totals', () => {
    const pricing = computeCheckoutPricing(5000);
    expect(pricing.customerTotal).toBe(customerTotalForVendorNet(5000));
    expect(pricing.processingFee).toBe(
      pricing.paymentProcessingFee + pricing.serviceFee,
    );
    expect(pricing.platformFee).toBe(CATALOGHQ_SERVICE_FEE_NGN);
  });

  it('charges a fixed service fee on a 300 naira item', () => {
    const pricing = computeCheckoutPricing(300);
    expect(pricing.serviceFee).toBe(20);
    expect(pricing.paymentProcessingFee).toBe(7);
    expect(pricing.customerTotal).toBe(327);
    expect(pricing.vendorNet).toBe(300);
  });

  it('caps Flutterwave fee at NGN 2000', () => {
    const pricing = computeCheckoutPricing(150_000);
    expect(pricing.paymentProcessingFee).toBe(
      FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
    );
    expect(pricing.serviceFee).toBe(CATALOGHQ_SERVICE_FEE_NGN);
    expect(pricing.customerTotal).toBe(152_020);
    expect(estimateVendorNetFromCustomerTotal(pricing.customerTotal)).toBe(
      150_000,
    );
  });
});
