import { apiClient } from "@/lib/api-client";
import { applyCsrfTokenFromResponse, clearCsrfToken } from "@/lib/csrf-token";
import type { AuthRepository } from "@/lib/repositories/auth-repository";
import type { StoredUser } from "@/types/domain";

type AuthApiUser = Omit<StoredUser, "passwordHash">;

type AuthResponse = {
  user: AuthApiUser;
  csrfToken?: string;
};

type MeResponse = {
  user: AuthApiUser;
  csrfToken?: string;
};

function toStoredUser(user: AuthApiUser): StoredUser {
  return { ...user, passwordHash: "" };
}

export class ApiAuthRepository implements AuthRepository {
  getSession(): null {
    return null;
  }

  async getCurrentUser(): Promise<StoredUser | null> {
    try {
      const response = await apiClient<MeResponse>("/auth/me");
      applyCsrfTokenFromResponse(response);
      return toStoredUser(response.user);
    } catch {
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
    applyCsrfTokenFromResponse(response);
    return toStoredUser(response.user);
  }

  async signIn(
    email: string,
    password: string,
    totpCode?: string,
  ): Promise<StoredUser> {
    const response = await apiClient<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password, totpCode }),
    });
    applyCsrfTokenFromResponse(response);
    return toStoredUser(response.user);
  }

  async signOut(): Promise<void> {
    try {
      await apiClient("/auth/signout", { method: "POST" });
    } catch {
      // Cookie cleared server-side when request succeeds.
    } finally {
      clearCsrfToken();
    }
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
