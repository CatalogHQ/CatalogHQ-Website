import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { getRefreshCookieMaxAgeMs } from './refresh-token-cookie.util';

export function getSessionCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: getRefreshCookieMaxAgeMs(configService),
    path: '/',
  };
}

export function setSessionCookie(
  res: Response,
  token: string,
  configService: ConfigService,
): void {
  res.cookie('session', token, getSessionCookieOptions(configService));
}

export function clearSessionCookie(
  res: Response,
  configService: ConfigService,
): void {
  res.clearCookie('session', getSessionCookieOptions(configService));
}
