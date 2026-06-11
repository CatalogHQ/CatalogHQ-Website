import { apiClient } from "@/lib/api-client";
import { readJson, writeJson } from "@/lib/local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AuthRepository } from "@/lib/repositories/auth-repository";
import type { AuthSession, StoredUser } from "@/types/domain";

type AuthApiUser = Omit<StoredUser, "passwordHash">;

type AuthResponse = {
  user: AuthApiUser;
  session: AuthSession;
};

type MeResponse = {
  user: AuthApiUser;
};

function toStoredUser(user: AuthApiUser): StoredUser {
  return { ...user, passwordHash: "" };
}

function saveSession(session: AuthSession): void {
  writeJson(STORAGE_KEYS.session, session);
}

export class ApiAuthRepository implements AuthRepository {
  getSession(): AuthSession | null {
    return readJson<AuthSession | null>(STORAGE_KEYS.session, null);
  }

  async getCurrentUser(): Promise<StoredUser | null> {
    const session = this.getSession();
    if (!session?.token) return null;

    try {
      const response = await apiClient<MeResponse>("/auth/me");
      return toStoredUser(response.user);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.session);
      return null;
    }
  }

  getUserById(_userId: string): StoredUser | null {
    return null;
  }

  async initSignUp(email: string, password: string): Promise<void> {
    await apiClient("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async resendSignUpOtp(email: string, password: string): Promise<void> {
    await apiClient("/auth/signup/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async verifySignUp(email: string, code: string): Promise<StoredUser> {
    const response = await apiClient<AuthResponse>("/auth/signup/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    saveSession(response.session);
    return toStoredUser(response.user);
  }

  async signIn(email: string, password: string): Promise<StoredUser> {
    const response = await apiClient<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveSession(response.session);
    return toStoredUser(response.user);
  }

  async signOut(): Promise<void> {
    const session = this.getSession();
    if (session?.token) {
      try {
        await apiClient("/auth/signout", { method: "POST" });
      } catch {
        // Client clears session regardless.
      }
    }
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    await apiClient("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
  }
}

export const apiAuthRepository = new ApiAuthRepository();
