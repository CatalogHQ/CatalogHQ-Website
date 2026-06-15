import { buildCheckoutSplitPayload } from './flutterwave-split.util';

describe('buildCheckoutSplitPayload', () => {
  it('routes vendor net to subaccount via flat_subaccount split', () => {
    expect(buildCheckoutSplitPayload('RS_VENDOR_1', 1000)).toEqual([
      {
        id: 'RS_VENDOR_1',
        transaction_charge_type: 'flat_subaccount',
        transaction_charge: 1000,
      },
    ]);
  });

  it('returns empty array when subaccount id is missing', () => {
    expect(buildCheckoutSplitPayload('', 1000)).toEqual([]);
  });
});
