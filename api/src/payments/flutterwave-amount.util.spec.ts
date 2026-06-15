import {
  flutterwaveAmountMatchesNaira,
  normalizeFlutterwaveAmountToNaira,
} from './flutterwave-amount.util';

describe('flutterwave-amount.util', () => {
  it('matches whole naira amounts', () => {
    expect(flutterwaveAmountMatchesNaira(1020, 1020)).toBe(true);
  });

  it('matches kobo amounts from Flutterwave webhooks', () => {
    expect(flutterwaveAmountMatchesNaira(1020, 102_000)).toBe(true);
  });

  it('rejects mismatched amounts', () => {
    expect(flutterwaveAmountMatchesNaira(1020, 1019)).toBe(false);
  });

  it('normalizes kobo to naira when expected total is known', () => {
    expect(normalizeFlutterwaveAmountToNaira(102_000, 1020)).toBe(1020);
  });

  it('keeps naira amounts unchanged', () => {
    expect(normalizeFlutterwaveAmountToNaira(1020, 1020)).toBe(1020);
  });
});
