export type SafeUser = {
  id: string;
  phone: string;
  email?: string;
  planTier: 'starter' | 'pro' | 'growth' | 'business';
  role: 'vendor' | 'admin';
  createdAt: string;
};

export type AuthResponse = {
  user: SafeUser;
  session: {
    userId: string;
    token: string;
  };
};
