export const FLUTTERWAVE_TOKEN_URL =
  'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

export const FLUTTERWAVE_SANDBOX_BASE_URL =
  'https://developersandbox-api.flutterwave.com';

export const FLUTTERWAVE_PRODUCTION_BASE_URL =
  'https://f4bexperience.flutterwave.com';

export type FlutterwaveEnv = 'sandbox' | 'production';

export function resolveFlutterwaveBaseUrl(env: string | undefined): string {
  return env === 'production'
    ? FLUTTERWAVE_PRODUCTION_BASE_URL
    : FLUTTERWAVE_SANDBOX_BASE_URL;
}

export function newFlutterwaveTraceId(): string {
  return crypto.randomUUID();
}
