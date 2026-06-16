import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  REQUIRE_ORIGIN_KEY,
} from '../constants/metadata';
import { originMatchesAllowed, normalizeOrigins } from '../origin.util';
import { requiresBrowserSessionProtection } from '../request-auth.util';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
    const requireOrigin = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ORIGIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic && !requireOrigin) {
      return true;
    }

    if (!requireOrigin && !requiresBrowserSessionProtection(request)) {
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
