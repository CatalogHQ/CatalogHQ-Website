/** Validates TOTP QR provisioning URLs from the API before rendering. */
export function isValidOtpauthUrl(url: string): boolean {
  if (!url.startsWith("otpauth://totp/")) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "otpauth:";
  } catch {
    return false;
  }
}
