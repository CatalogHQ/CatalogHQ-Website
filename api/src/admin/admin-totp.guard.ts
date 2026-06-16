import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '@prisma/client';
import { ADMIN_TOTP_OPTIONAL_KEY } from '../common/constants/metadata';

@Injectable()
export class AdminTotpGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const optional = this.reflector.getAllAndOverride<boolean>(
      ADMIN_TOTP_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (optional) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    if (!user || user.role !== UserRole.admin) {
      return true;
    }

    if (!user.totpEnabled) {
      throw new ForbiddenException(
        'Admin 2FA setup is required. Complete setup in Settings.',
      );
    }

    return true;
  }
}
