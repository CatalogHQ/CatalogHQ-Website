import { createHash, randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export function createRefreshTokenValue(): string {
  return randomBytes(32).toString('hex');
}

export function hashRefreshTokenValue(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function getRefreshCookieOptions(configService: ConfigService): CookieOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: getRefreshCookieMaxAgeMs(configService),
    path: '/auth/refresh',
  };
}

export function getRefreshCookieMaxAgeMs(
  configService: ConfigService,
): number {
  const days = Number(configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? '7');
  const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
  return safeDays * 24 * 60 * 60 * 1000;
}

export function getRefreshTokenExpiresAt(
  configService: ConfigService,
): Date {
  return new Date(Date.now() + getRefreshCookieMaxAgeMs(configService));
}

export function setRefreshCookie(
  res: Response,
  token: string,
  configService: ConfigService,
): void {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions(configService));
}

export function clearRefreshCookie(
  res: Response,
  configService: ConfigService,
): void {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(configService));
}
