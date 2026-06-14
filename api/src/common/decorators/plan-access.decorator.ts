import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const REQUIRE_ACTIVE_SUBSCRIPTION_KEY = 'requireActiveSubscription';
export const SKIP_SUBSCRIPTION_GUARD_KEY = 'skipSubscriptionGuard';

export const RequireFeature = (featureId: string) =>
  SetMetadata(REQUIRE_FEATURE_KEY, featureId);

export const RequireActiveSubscription = () =>
  SetMetadata(REQUIRE_ACTIVE_SUBSCRIPTION_KEY, true);

export const SkipSubscriptionGuard = () =>
  SetMetadata(SKIP_SUBSCRIPTION_GUARD_KEY, true);
