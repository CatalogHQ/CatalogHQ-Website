import { User } from '@prisma/client';

export type AuthenticatedUser = User & {
  adminSetupOnly?: boolean;
};
