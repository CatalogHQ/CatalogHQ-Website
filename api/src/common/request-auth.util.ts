type RequestLike = {
  cookies?: Record<string, string | undefined>;
  headers: {
    authorization?: string;
    origin?: string;
    referer?: string;
  };
};

export function hasBearerAuthorization(request: RequestLike): boolean {
  const authorization = request.headers.authorization;
  return (
    typeof authorization === 'string' &&
    authorization.trim().toLowerCase().startsWith('bearer ')
  );
}

export function hasBrowserOriginHint(request: RequestLike): boolean {
  return Boolean(
    request.headers.origin?.trim() || request.headers.referer?.trim(),
  );
}

/** Cookie session or browser-originated Bearer must pass CSRF / Origin guards. */
export function requiresBrowserSessionProtection(
  request: RequestLike,
): boolean {
  const hasSessionCookie = Boolean(request.cookies?.session);
  if (hasSessionCookie) {
    return true;
  }

  return hasBearerAuthorization(request) && hasBrowserOriginHint(request);
}
