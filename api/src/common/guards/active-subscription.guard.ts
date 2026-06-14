import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';
import {
  REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
  REQUIRE_FEATURE_KEY,
  SKIP_SUBSCRIPTION_GUARD_KEY,
} from '../decorators/plan-access.decorator';
import { IS_PUBLIC_KEY } from '../constants/metadata';
import { PlanEntitlementService } from '../../plans/plan-entitlement.service';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planEntitlementService: PlanEntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const skipGuard = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipGuard) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: User;
      originalUrl?: string;
      url?: string;
    }>();
    const user = request.user;
    if (!user || user.role === 'admin') {
      return true;
    }

    const path = request.originalUrl ?? request.url ?? '';

    if (isAuthRoute(path) || path.includes('/subscriptions')) {
      return true;
    }

    const featureRequired = this.reflector.getAllAndOverride<string>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const subscriptionRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!featureRequired && !subscriptionRequired && !isVendorScopedRoute(path)) {
      return true;
    }

    await this.planEntitlementService.assertActiveSubscription(user.id);
    return true;
  }
}

function isVendorScopedRoute(path: string): boolean {
  return path.includes('/stores/me') || path.includes('/uploads');
}

function isAuthRoute(path: string): boolean {
  return path.includes('/auth/');
}
