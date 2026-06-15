import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../constants/metadata';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeOrigins(raw: string): string[] {
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

function originMatchesAllowed(value: string, allowedOrigins: string[]): boolean {
  try {
    const url = new URL(value);
    const origin = url.origin.replace(/\/$/, '');
    return allowedOrigins.includes(origin);
  } catch {
    return false;
  }
}

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor(
    private readonly reflector: Reflector,
    configService: ConfigService,
  ) {
    const configured = normalizeOrigins(
      configService.get<string>(
        'CORS_ORIGIN',
        'http://localhost:3000,https://cataloghq.store,https://www.cataloghq.store',
      ),
    );
    this.allowedOrigins = [...new Set(configured)];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      cookies?: { session?: string };
      headers: {
        origin?: string;
        referer?: string;
        authorization?: string;
      };
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

    const hasSessionCookie = Boolean(request.cookies?.session);
    if (!hasSessionCookie) {
      return true;
    }

    const origin = request.headers.origin;
    const referer = request.headers.referer;
    if (
      (origin && originMatchesAllowed(origin, this.allowedOrigins)) ||
      (referer && originMatchesAllowed(referer, this.allowedOrigins))
    ) {
      return true;
    }

    throw new ForbiddenException('Cross-site request blocked.');
  }
}
