import type { AuthSession, StoredUser } from "@/types/domain";

export interface AuthRepository {
  signUp(phone: string, password: string, email?: string): Promise<StoredUser>;
  signIn(phone: string, password: string): Promise<StoredUser>;
  signOut(): Promise<void>;
  forgotPassword(phone: string): Promise<void>;
  resetPassword(phone: string, code: string, newPassword: string): Promise<void>;
  getSession(): AuthSession | null;
  getCurrentUser(): Promise<StoredUser | null>;
  getUserById(userId: string): StoredUser | null;
}
