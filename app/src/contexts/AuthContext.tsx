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
  signUp: (phone: string, password: string, email?: string) => Promise<StoredUser>;
  signIn: (phone: string, password: string) => Promise<StoredUser>;
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

  const signUp = useCallback(async (phone: string, password: string, email?: string) => {
    const created = await authRepository.signUp(phone, password, email);
    setUser(created);
    return created;
  }, []);

  const signIn = useCallback(async (phone: string, password: string) => {
    const current = await authRepository.signIn(phone, password);
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
      signUp,
      signIn,
      signOut,
      refreshUser,
    }),
    [user, isLoading, signUp, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
