import { Prisma } from '@prisma/client';

/** Safe User fields for JWT-authenticated requests (no passwordHash or totpSecret). */
export const AUTHENTICATED_USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  planTier: true,
  subscriptionExempt: true,
  role: true,
  totpEnabled: true,
  totpVerifiedAt: true,
  sessionVersion: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof AUTHENTICATED_USER_SELECT;
}> & {
  adminSetupOnly?: boolean;
};
