import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';
import {
  REQUIRE_FEATURE_KEY,
  SKIP_SUBSCRIPTION_GUARD_KEY,
} from '../decorators/plan-access.decorator';
import { IS_PUBLIC_KEY } from '../constants/metadata';
import { PlanEntitlementService } from '../../plans/plan-entitlement.service';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
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

    const featureId = this.reflector.getAllAndOverride<string>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!featureId) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;
    if (!user || user.role === 'admin') {
      return true;
    }

    await this.planEntitlementService.assertFeature(user.id, featureId);
    return true;
  }
}
