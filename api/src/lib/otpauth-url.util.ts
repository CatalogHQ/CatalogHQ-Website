/** Validates TOTP provisioning URLs before returning them to clients. */
export function assertValidOtpauthUrl(url: string): string {
  if (!url.startsWith('otpauth://totp/')) {
    throw new Error('Invalid otpauth URL');
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'otpauth:') {
      throw new Error('Invalid otpauth URL');
    }
  } catch {
    throw new Error('Invalid otpauth URL');
  }

  return url;
}
