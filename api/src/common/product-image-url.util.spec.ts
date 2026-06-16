import {
  assertAllowedProductImageUrls,
  getAllowedProductImageHosts,
  isAllowedProductImageUrl,
} from './product-image-url.util';

describe('product-image-url.util', () => {
  const allowedHosts = getAllowedProductImageHosts('demo');

  it('allows Cloudinary HTTPS URLs', () => {
    expect(
      isAllowedProductImageUrl(
        'https://res.cloudinary.com/demo/image/upload/v1/product.jpg',
        allowedHosts,
      ),
    ).toBe(true);
  });

  it('rejects non-HTTPS URLs', () => {
    expect(
      isAllowedProductImageUrl('http://res.cloudinary.com/demo/x.jpg', allowedHosts),
    ).toBe(false);
  });

  it('rejects untrusted hosts', () => {
    expect(() =>
      assertAllowedProductImageUrls(
        ['https://evil.example/photo.jpg'],
        allowedHosts,
      ),
    ).toThrow();
  });
});
