import { readJson, writeJson } from "@/lib/local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AuthRepository } from "@/lib/repositories/auth-repository";
import type { AuthSession, StoredUser, UserRole } from "@/types/domain";

function normalizeUser(user: StoredUser): StoredUser {
  return { ...user, role: user.role ?? "vendor" };
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Dev-only placeholder — replace with bcrypt on the NestJS backend.
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

  async signUp(phone: string, password: string, _email?: string): Promise<StoredUser> {
    const normalized = normalizePhone(phone);
    const users = this.getUsers();

    if (users.some((user) => normalizePhone(user.phone) === normalized)) {
      throw new Error("An account with this phone number already exists.");
    }

    const user: StoredUser = {
      id: generateId(),
      phone: normalized,
      passwordHash: hashPassword(password),
      planTier: "starter",
      role: "vendor" satisfies UserRole,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    this.saveUsers(users);

    const session: AuthSession = { userId: user.id, token: "local-dev" };
    writeJson(STORAGE_KEYS.session, session);

    return user;
  }

  async signIn(phone: string, password: string): Promise<StoredUser> {
    const normalized = normalizePhone(phone);
    const user = this.getUsers().find(
      (entry) => normalizePhone(entry.phone) === normalized,
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid phone number or password.");
    }

    const session: AuthSession = { userId: user.id, token: "local-dev" };
    writeJson(STORAGE_KEYS.session, session);

    return user;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  async forgotPassword(_phone: string): Promise<void> {
    throw new Error("Password reset requires API mode (VITE_USE_API=true).");
  }

  async resetPassword(
    _phone: string,
    _code: string,
    _newPassword: string,
  ): Promise<void> {
    throw new Error("Password reset requires API mode (VITE_USE_API=true).");
  }
}

export const authRepository: AuthRepository = new LocalAuthRepository();
