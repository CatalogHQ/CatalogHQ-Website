import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../auth/authenticated-user.type';
import { IS_PUBLIC_KEY } from '../constants/metadata';

const ADMIN_SETUP_ALLOWED: Array<{ method: string; path: string }> = [
  { method: 'GET', path: '/auth/me' },
  { method: 'POST', path: '/auth/signout' },
  { method: 'POST', path: '/admin/totp/setup' },
  { method: 'POST', path: '/admin/totp/enable' },
];

function normalizeRequestPath(url: string | undefined): string {
  if (!url) {
    return '/';
  }

  const withoutQuery = url.split('?')[0] ?? url;
  return withoutQuery.replace(/\/$/, '') || '/';
}

@Injectable()
export class AdminSetupGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      method?: string;
      originalUrl?: string;
      url?: string;
    }>();

    const user = request.user;
    if (!user || user.role !== UserRole.admin || user.totpEnabled) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const method = request.method?.toUpperCase() ?? 'GET';
    const path = normalizeRequestPath(request.originalUrl ?? request.url);
    const allowed = ADMIN_SETUP_ALLOWED.some(
      (route) => route.method === method && route.path === path,
    );

    if (allowed) {
      return true;
    }

    throw new ForbiddenException(
      'Complete admin 2FA setup before using the dashboard.',
    );
  }
}
