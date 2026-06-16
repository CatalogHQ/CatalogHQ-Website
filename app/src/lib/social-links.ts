export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "x";

export type StoreSocialHandles = {
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookHandle?: string;
  xHandle?: string;
};

export function normalizeSocialHandle(value?: string | null): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = value.trim().replace(/^@+/, "").toLowerCase();
  if (!normalized || !/^[a-z0-9._]{1,30}$/.test(normalized)) {
    return undefined;
  }

  return normalized;
}

export function buildInstagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}

export function buildTikTokUrl(handle: string): string {
  return `https://tiktok.com/@${handle}`;
}

export function buildFacebookUrl(handle: string): string {
  return `https://facebook.com/${handle}`;
}

export function buildXUrl(handle: string): string {
  return `https://x.com/${handle}`;
}

export type SocialLink = {
  platform: SocialPlatform;
  handle: string;
  href: string;
  label: string;
};

export function getStoreSocialLinks(handles: StoreSocialHandles): SocialLink[] {
  const links: SocialLink[] = [];

  const instagram = normalizeSocialHandle(handles.instagramHandle);
  if (instagram) {
    links.push({
      platform: "instagram",
      handle: instagram,
      href: buildInstagramUrl(instagram),
      label: "Instagram",
    });
  }

  const tiktok = normalizeSocialHandle(handles.tiktokHandle);
  if (tiktok) {
    links.push({
      platform: "tiktok",
      handle: tiktok,
      href: buildTikTokUrl(tiktok),
      label: "TikTok",
    });
  }

  const facebook = normalizeSocialHandle(handles.facebookHandle);
  if (facebook) {
    links.push({
      platform: "facebook",
      handle: facebook,
      href: buildFacebookUrl(facebook),
      label: "Facebook",
    });
  }

  const xHandle = normalizeSocialHandle(handles.xHandle);
  if (xHandle) {
    links.push({
      platform: "x",
      handle: xHandle,
      href: buildXUrl(xHandle),
      label: "X",
    });
  }

  return links;
}
