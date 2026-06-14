import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';

export function getSessionCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
