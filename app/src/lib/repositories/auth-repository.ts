import type { AuthSession, StoredUser } from "@/types/domain";

export interface AuthRepository {
  initSignUp(email: string, password: string): Promise<void>;
  verifySignUp(email: string, code: string): Promise<StoredUser>;
  signIn(email: string, password: string): Promise<StoredUser>;
  signOut(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;
  getSession(): AuthSession | null;
  getCurrentUser(): Promise<StoredUser | null>;
  getUserById(userId: string): StoredUser | null;
}
