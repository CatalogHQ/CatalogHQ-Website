export function normalizeOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) =>
      origin
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\/$/, ''),
    )
    .filter(Boolean);
}

export function originMatchesAllowed(
  value: string,
  allowedOrigins: string[],
): boolean {
  try {
    const url = new URL(value);
    const origin = url.origin.replace(/\/$/, '');
    return allowedOrigins.includes(origin);
  } catch {
    return false;
  }
}
