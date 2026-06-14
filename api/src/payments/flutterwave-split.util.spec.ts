import { buildCheckoutSplitPayload } from './flutterwave-split.util';

describe('buildCheckoutSplitPayload', () => {
  it('builds flat commission split for vendor subaccount', () => {
    expect(buildCheckoutSplitPayload('RS_VENDOR_1', 200)).toEqual([
      {
        id: 'RS_VENDOR_1',
        transaction_charge_type: 'flat',
        transaction_charge: 200,
      },
    ]);
  });

  it('returns empty array when subaccount id is missing', () => {
    expect(buildCheckoutSplitPayload('', 200)).toEqual([]);
  });
});
