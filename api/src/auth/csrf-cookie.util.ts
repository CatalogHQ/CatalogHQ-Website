import { randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

function getCsrfCookieOptions(configService: ConfigService): CookieOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export function createCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function setCsrfCookie(
  res: Response,
  token: string,
  configService: ConfigService,
): void {
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions(configService));
}

export function clearCsrfCookie(
  res: Response,
  configService: ConfigService,
): void {
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieOptions(configService));
}
