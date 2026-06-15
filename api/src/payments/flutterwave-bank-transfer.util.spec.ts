import {
  extractV3BankTransferAuthorization,
  formatFlutterwaveV3PhoneNumber,
} from './flutterwave-bank-transfer.util';

describe('flutterwave-bank-transfer.util', () => {
  it('formats Nigerian phone numbers for Flutterwave v3', () => {
    expect(formatFlutterwaveV3PhoneNumber('08012345678')).toBe('+2348012345678');
    expect(formatFlutterwaveV3PhoneNumber('2348012345678')).toBe(
      '+2348012345678',
    );
  });

  it('extracts bank transfer authorization from v3 charge responses', () => {
    expect(
      extractV3BankTransferAuthorization({
        status: 'success',
        data: {
          meta: {
            authorization: {
              transfer_account: '0123456789',
              transfer_bank: 'WEMA BANK',
            },
          },
        },
      }),
    ).toEqual({
      transfer_account: '0123456789',
      transfer_bank: 'WEMA BANK',
    });
  });
});
