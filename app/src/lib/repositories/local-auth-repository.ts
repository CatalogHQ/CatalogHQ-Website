import { ApiError, SIGNUP_VERIFICATION_PENDING_CODE } from "@/lib/api-error";
import { readJson, writeJson } from "@/lib/local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AuthRepository } from "@/lib/repositories/auth-repository";
import type { AuthSession, StoredUser, UserRole } from "@/types/domain";

function normalizeUser(user: StoredUser): StoredUser {
  return { ...user, role: user.role ?? "vendor" };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string): string {
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateId(): string {
  return crypto.randomUUID();
}

export class LocalAuthRepository implements AuthRepository {
  private getUsers(): StoredUser[] {
    return readJson<StoredUser[]>(STORAGE_KEYS.users, []).map(normalizeUser);
  }

  private saveUsers(users: StoredUser[]): void {
    writeJson(STORAGE_KEYS.users, users);
  }

  getSession(): AuthSession | null {
    return readJson<AuthSession | null>(STORAGE_KEYS.session, null);
  }

  async getCurrentUser(): Promise<StoredUser | null> {
    const session = this.getSession();
    if (!session) return null;
    return this.getUserById(session.userId);
  }

  getUserById(userId: string): StoredUser | null {
    return this.getUsers().find((user) => user.id === userId) ?? null;
  }

  async initSignUp(email: string, password: string): Promise<void> {
    const normalized = normalizeEmail(email);
    const users = this.getUsers();

    if (users.some((user) => normalizeEmail(user.email) === normalized)) {
      throw new Error("An account with this email already exists.");
    }

    writeJson(`cataloghq:signup-pending:${normalized}`, {
      email: normalized,
      passwordHash: hashPassword(password),
    });
  }

  async resendSignUpOtp(_email: string, _password: string): Promise<void> {
    return;
  }

  async verifySignUp(email: string, code: string): Promise<StoredUser> {
    const normalized = normalizeEmail(email);
    const pending = readJson<{ email: string; passwordHash: string } | null>(
      `cataloghq:signup-pending:${normalized}`,
      null,
    );

    if (!pending || code !== "123456") {
      throw new Error("Invalid or expired code. Use 123456 in local dev mode.");
    }

    const users = this.getUsers();
    const user: StoredUser = {
      id: generateId(),
      email: normalized,
      passwordHash: pending.passwordHash,
      planTier: "starter",
      role: "vendor" satisfies UserRole,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    this.saveUsers(users);
    localStorage.removeItem(`cataloghq:signup-pending:${normalized}`);

    const session: AuthSession = { userId: user.id, token: "local-dev" };
    writeJson(STORAGE_KEYS.session, session);

    return user;
  }

  async signIn(email: string, password: string): Promise<StoredUser> {
    const normalized = normalizeEmail(email);
    const user = this.getUsers().find(
      (entry) => normalizeEmail(entry.email) === normalized,
    );

    if (!user) {
      const pending = readJson<{ email: string; passwordHash: string } | null>(
        `cataloghq:signup-pending:${normalized}`,
        null,
      );

      if (pending && verifyPassword(password, pending.passwordHash)) {
        throw new ApiError(
          "Your sign-up is not complete. Request a new verification code to finish creating your account.",
          401,
          SIGNUP_VERIFICATION_PENDING_CODE,
        );
      }

      throw new Error("Invalid email or password.");
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid email or password.");
    }

    const session: AuthSession = { userId: user.id, token: "local-dev" };
    writeJson(STORAGE_KEYS.session, session);

    return user;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  async forgotPassword(_email: string): Promise<void> {
    throw new Error("Password reset requires API mode (VITE_USE_API=true).");
  }

  async resetPassword(
    _email: string,
    _code: string,
    _newPassword: string,
  ): Promise<void> {
    throw new Error("Password reset requires API mode (VITE_USE_API=true).");
  }
}

export const authRepository: LocalAuthRepository = new LocalAuthRepository();
