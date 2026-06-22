import { PlanTier } from '@prisma/client';
import { hasPlanFeature, PLAN_FEATURE_IDS } from './plan-features';

describe('plan-features', () => {
  it('includes features on every paid plan tier', () => {
    for (const tier of [
      PlanTier.starter,
      PlanTier.pro,
      PlanTier.growth,
      PlanTier.business,
    ]) {
      expect(hasPlanFeature(tier, 'discount-codes')).toBe(true);
      expect(hasPlanFeature(tier, 'staff-roles')).toBe(true);
      expect(hasPlanFeature(tier, 'analytics-dashboard')).toBe(true);
    }
  });

  it('blocks coming soon features', () => {
    expect(hasPlanFeature(PlanTier.pro, 'referral-links')).toBe(false);
  });

  it('exports stable feature ids', () => {
    expect(PLAN_FEATURE_IDS).toContain('analytics-dashboard');
    expect(PLAN_FEATURE_IDS).toContain('payment-links');
    expect(PLAN_FEATURE_IDS).toContain('discount-codes');
    expect(PLAN_FEATURE_IDS).toContain('staff-roles');
    expect(PLAN_FEATURE_IDS).toContain('nin-verified-vendors');
  });
});
