import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '../../auth/csrf-cookie.util';
import { requiresBrowserSessionProtection } from '../request-auth.util';
import { IS_PUBLIC_KEY } from '../constants/metadata';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function safeTokenEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      cookies?: Record<string, string | undefined>;
      headers: Record<string, string | string[] | undefined>;
    }>();

    const method = request.method?.toUpperCase() ?? 'GET';
    if (!MUTATING_METHODS.has(method)) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (!requiresBrowserSessionProtection(request)) {
      return true;
    }

    const csrfCookie = request.cookies?.[CSRF_COOKIE_NAME]?.trim();
    const csrfHeaderRaw = request.headers[CSRF_HEADER_NAME];
    const csrfHeader = Array.isArray(csrfHeaderRaw)
      ? csrfHeaderRaw[0]?.trim()
      : csrfHeaderRaw?.trim();

    if (!csrfCookie || !csrfHeader || !safeTokenEqual(csrfCookie, csrfHeader)) {
      throw new ForbiddenException('Invalid or missing CSRF token.');
    }

    return true;
  }
}
