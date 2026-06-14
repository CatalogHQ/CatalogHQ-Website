export type SafeUser = {
  id: string;
  email: string;
  phone?: string;
  planTier: 'starter' | 'pro' | 'growth' | 'business';
  role: 'vendor' | 'admin';
  subscriptionExempt: boolean;
  createdAt: string;
  totpEnabled?: boolean;
  subscription?: {
    status: string;
    planTier: string;
    paidPlanTier?: 'starter' | 'pro' | 'growth' | 'business';
    currentPeriodEnd?: string;
    graceEndsAt?: string;
    isHardBlocked: boolean;
    hasActiveAccess: boolean;
  };
};

export type AuthResponse = {
  user: SafeUser;
};
