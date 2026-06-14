import {
  estimateFlutterwaveFee,
  estimateVendorNet,
  FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
} from './flutterwave-fees.util';

describe('flutterwave-fees.util', () => {
  it('charges 2% on small amounts', () => {
    expect(estimateFlutterwaveFee(5000)).toBe(100);
    expect(estimateVendorNet(5000)).toBe(4900);
  });

  it('caps fee at NGN 2000', () => {
    expect(estimateFlutterwaveFee(150_000)).toBe(
      FLUTTERWAVE_DOMESTIC_FEE_CAP_NGN,
    );
    expect(estimateVendorNet(150_000)).toBe(148_000);
  });
});
