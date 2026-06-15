import {
  buildFlutterwavePayoutReference,
  buildFlutterwavePayoutRetryReference,
  isValidFlutterwaveTransferReference,
  resolveFlutterwavePayoutReference,
} from './flutterwave-payout-reference.util';

describe('flutterwave-payout-reference.util', () => {
  it('builds a Flutterwave-compliant payout reference from order id', () => {
    const reference = buildFlutterwavePayoutReference(
      '0dc72157-efdf-4429-1363-674dbf452faf',
    );

    expect(reference).toBe('po-0dc72157efdf44291363674dbf452faf');
    expect(reference.length).toBeLessThanOrEqual(42);
    expect(isValidFlutterwaveTransferReference(reference)).toBe(true);
  });

  it('builds a fresh reference when retrying a failed payout', () => {
    const reference = buildFlutterwavePayoutRetryReference(
      '0dc72157-efdf-4429-1363-674dbf452faf',
    );

    expect(reference).toMatch(/^po-0dc72157efdf44291363674dbf452faf-r/);
    expect(reference.length).toBeLessThanOrEqual(42);
    expect(isValidFlutterwaveTransferReference(reference)).toBe(true);
  });

  it('rejects legacy payout references that exceed 42 characters', () => {
    const legacy = 'payout-SHP-0dc72157efdf44291363674dbf452faf';

    expect(isValidFlutterwaveTransferReference(legacy)).toBe(false);
    expect(
      resolveFlutterwavePayoutReference({
        id: '0dc72157-efdf-4429-1363-674dbf452faf',
        flutterwavePayoutReference: legacy,
      }),
    ).toBe('po-0dc72157efdf44291363674dbf452faf');
  });
});
