import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authRepository } from "@/lib/repositories";
import { onSessionExpired } from "@/lib/api-client";
import type { StoredUser } from "@/types/domain";

type AuthContextValue = {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  initSignUp: (email: string, password: string) => Promise<void>;
  resendSignUpOtp: (email: string, password: string) => Promise<void>;
  verifySignUp: (email: string, code: string) => Promise<StoredUser>;
  signIn: (email: string, password: string, totpCode?: string) => Promise<StoredUser>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const current = await authRepository.getCurrentUser();
    setUser(current);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const current = await authRepository.getCurrentUser();
        if (!cancelled) {
          setUser(current);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const initSignUp = useCallback(async (email: string, password: string) => {
    await authRepository.initSignUp(email, password);
  }, []);

  const resendSignUpOtp = useCallback(async (email: string, password: string) => {
    await authRepository.resendSignUpOtp(email, password);
  }, []);

  const verifySignUp = useCallback(async (email: string, code: string) => {
    const created = await authRepository.verifySignUp(email, code);
    setUser(created);
    return created;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, totpCode?: string) => {
      const current = await authRepository.signIn(email, password, totpCode);
      setUser(current);
      return current;
    },
    [],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await authRepository.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await authRepository.resetPassword(email, code, newPassword);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authRepository.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isLoading,
      initSignUp,
      resendSignUpOtp,
      verifySignUp,
      signIn,
      forgotPassword,
      resetPassword,
      signOut,
      refreshUser,
    }),
    [
      user,
      isLoading,
      initSignUp,
      resendSignUpOtp,
      verifySignUp,
      signIn,
      forgotPassword,
      resetPassword,
      signOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
