const DEFAULT_ALLOWED_HOSTS = ['res.cloudinary.com'];

export function getAllowedProductImageHosts(
  cloudName?: string,
): Set<string> {
  const hosts = new Set(DEFAULT_ALLOWED_HOSTS);
  const trimmed = cloudName?.trim();
  if (trimmed) {
    hosts.add('res.cloudinary.com');
  }
  return hosts;
}

export function isAllowedProductImageUrl(
  url: string,
  allowedHosts: Set<string>,
): boolean {
  if (!url.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }

    return allowedHosts.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function assertAllowedProductImageUrls(
  urls: string[],
  allowedHosts: Set<string>,
): void {
  for (const url of urls) {
    if (!isAllowedProductImageUrl(url, allowedHosts)) {
      throw new Error(
        'Product images must be HTTPS URLs hosted on your configured image CDN.',
      );
    }
  }
}
