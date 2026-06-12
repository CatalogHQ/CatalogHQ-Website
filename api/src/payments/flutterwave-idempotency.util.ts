import { createHash } from 'crypto';

/**
 * Deterministic UUID-shaped key per logical Flutterwave write.
 * Same scope + id on retries returns the cached Flutterwave response.
 */
export function flutterwaveIdempotencyKey(
  scope: string,
  uniqueId: string,
): string {
  const hash = createHash('sha256')
    .update(`${scope}:${uniqueId}`)
    .digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}
