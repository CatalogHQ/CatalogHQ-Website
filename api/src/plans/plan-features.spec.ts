import { PlanTier } from '@prisma/client';
import {
  hasPlanFeature,
  PLAN_FEATURE_IDS,
  tierIncludes,
} from './plan-features';

describe('plan-features', () => {
  it('includes higher tiers for lower feature tiers', () => {
    expect(tierIncludes(PlanTier.pro, PlanTier.starter)).toBe(true);
    expect(tierIncludes(PlanTier.starter, PlanTier.pro)).toBe(false);
  });

  it('gates pro features correctly', () => {
    expect(hasPlanFeature(PlanTier.starter, 'discount-codes')).toBe(false);
    expect(hasPlanFeature(PlanTier.pro, 'discount-codes')).toBe(true);
    expect(hasPlanFeature(PlanTier.business, 'staff-roles')).toBe(true);
  });

  it('blocks coming soon features', () => {
    expect(hasPlanFeature(PlanTier.pro, 'referral-links')).toBe(false);
  });

  it('exports stable feature ids', () => {
    expect(PLAN_FEATURE_IDS).toContain('analytics-dashboard');
    expect(PLAN_FEATURE_IDS).toContain('payment-links');
    expect(PLAN_FEATURE_IDS).toContain('discount-codes');
    expect(PLAN_FEATURE_IDS).toContain('staff-roles');
  });
});
