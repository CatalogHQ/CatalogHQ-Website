import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { PlanEntitlementService } from './plan-entitlement.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlanEntitlementService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  let service: PlanEntitlementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlanEntitlementService(prisma as unknown as PrismaService);
  });

  it('allows exempt vendors regardless of subscription status', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'vendor-1',
      planTier: PlanTier.pro,
      subscriptionExempt: true,
      subscription: {
        status: SubscriptionStatus.expired,
        graceEndsAt: null,
        currentPeriodEnd: null,
      },
    });

    const state = await service.getAccessState('vendor-1');
    expect(state.hasActiveAccess).toBe(true);
    expect(state.isHardBlocked).toBe(false);
  });

  it('hard blocks expired subscriptions', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'vendor-1',
      planTier: PlanTier.pro,
      subscriptionExempt: false,
      subscription: {
        status: SubscriptionStatus.expired,
        graceEndsAt: null,
        currentPeriodEnd: null,
      },
    });

    const state = await service.getAccessState('vendor-1');
    expect(state.isHardBlocked).toBe(true);
  });

  it('checks feature access against effective tier', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'vendor-1',
      planTier: PlanTier.pro,
      subscriptionExempt: false,
      subscription: {
        status: SubscriptionStatus.active,
        graceEndsAt: null,
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      },
    });

    await expect(
      service.assertFeature('vendor-1', 'discount-codes'),
    ).resolves.toBeUndefined();
  });
});
