const HANDLE_PATTERN = /^@?[a-zA-Z0-9._]{1,30}$/;

export function isValidSocialHandle(value: string): boolean {
  return HANDLE_PATTERN.test(value.trim());
}

export function normalizeSocialHandle(value?: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(/^@+/, '').toLowerCase();
  return normalized || null;
}
