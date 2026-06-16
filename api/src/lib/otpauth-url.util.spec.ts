import { assertValidOtpauthUrl } from './otpauth-url.util';

describe('assertValidOtpauthUrl', () => {
  it('accepts a valid otpauth totp URL', () => {
    const url =
      'otpauth://totp/CatalogHQ?secret=JBSWY3DPEHPK3PXP&issuer=CatalogHQ';
    expect(assertValidOtpauthUrl(url)).toBe(url);
  });

  it('rejects non-otpauth URLs', () => {
    expect(() => assertValidOtpauthUrl('https://evil.example/phish')).toThrow(
      'Invalid otpauth URL',
    );
  });
});
