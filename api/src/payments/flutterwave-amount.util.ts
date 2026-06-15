/** Compare Flutterwave amounts (NGN whole units or kobo) to an expected naira total. */
export function flutterwaveAmountMatchesNaira(
  expectedNaira: number,
  received?: number,
): boolean {
  if (received === undefined || Number.isNaN(received)) {
    return true;
  }

  const normalizedExpected = Math.round(expectedNaira);
  const normalizedReceived = Math.round(received);

  if (normalizedReceived === normalizedExpected) {
    return true;
  }

  if (normalizedReceived === normalizedExpected * 100) {
    return true;
  }

  return Math.abs(normalizedReceived - normalizedExpected) < 1;
}

/** Normalize Flutterwave charge/webhook amounts to whole naira. */
export function normalizeFlutterwaveAmountToNaira(
  amount: number | undefined,
  expectedNaira?: number,
): number | undefined {
  if (amount === undefined || Number.isNaN(amount)) {
    return undefined;
  }

  const rounded = Math.round(amount);

  if (expectedNaira !== undefined) {
    const expected = Math.round(expectedNaira);
    if (rounded === expected || rounded === expected * 100) {
      return rounded === expected * 100 ? expected : rounded;
    }
  }

  if (rounded >= 10_000 && rounded % 100 === 0) {
    return rounded / 100;
  }

  return rounded;
}
