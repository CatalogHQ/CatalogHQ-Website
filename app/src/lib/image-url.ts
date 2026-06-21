const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_TRANSFORM = "f_webp,q_auto:good";

/**
 * Serves Cloudinary product images as WebP with automatic quality.
 * Non-CDN URLs (e.g. local data URLs) are returned unchanged.
 */
export function optimizeProductImageUrl(url: string): string {
  if (!url || url.startsWith("data:")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== CLOUDINARY_HOST) {
      return url;
    }

    const segments = parsed.pathname.split("/");
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex === -1) {
      return url;
    }

    const transformSegment = segments[uploadIndex + 1] ?? "";
    if (transformSegment.includes("f_webp")) {
      return url;
    }

    segments.splice(uploadIndex + 1, 0, CLOUDINARY_TRANSFORM);
    parsed.pathname = segments.join("/");
    return parsed.toString();
  } catch {
    return url;
  }
}
