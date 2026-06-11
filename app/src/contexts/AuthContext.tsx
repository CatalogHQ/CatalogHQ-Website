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
import type { StoredUser } from "@/types/domain";

type AuthContextValue = {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  initSignUp: (email: string, password: string) => Promise<void>;
  resendSignUpOtp: (email: string, password: string) => Promise<void>;
  verifySignUp: (email: string, code: string) => Promise<StoredUser>;
  signIn: (email: string, password: string) => Promise<StoredUser>;
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

  const signIn = useCallback(async (email: string, password: string) => {
    const current = await authRepository.signIn(email, password);
    setUser(current);
    return current;
  }, []);

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
