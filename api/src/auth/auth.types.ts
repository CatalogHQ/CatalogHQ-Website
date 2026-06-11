export type SafeUser = {
  id: string;
  email: string;
  phone?: string;
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
