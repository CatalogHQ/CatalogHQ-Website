import {
  mergeNigerianBanks,
  PAYSTACK_DIRECT_DEBIT_BANKS,
} from './nigerian-bank-list.util';

describe('nigerian-bank-list.util', () => {
  it('includes Paystack Direct Debit banks from official list', () => {
    const names = PAYSTACK_DIRECT_DEBIT_BANKS.map((bank) => bank.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Fidelity Bank',
        'Globus Bank',
        'Providus Bank',
        'Sterling Bank',
        'Titan Bank',
        'Heritage Bank',
      ]),
    );
  });

  it('merges bank lists without duplicate codes', () => {
    const merged = mergeNigerianBanks(
      [{ code: '044', name: 'Access Bank' }],
      [{ code: '044', name: 'Access Bank Plc' }],
      [{ code: '070', name: 'Fidelity Bank' }],
    );

    expect(merged).toHaveLength(2);
    expect(merged.find((bank) => bank.code === '044')?.name).toBe(
      'Access Bank Plc',
    );
  });
});
