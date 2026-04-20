import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import type { AuthUser } from "@/types";
import { api } from "@/lib/api";
import { getCookieHeader, clearTokens } from "@/lib/auth/token";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refreshUser: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    setLoading(true);
    try {
      // Check if we have stored cookies before attempting the request
      const cookie = await getCookieHeader();
      if (!cookie) {
        setUser(null);
        return null;
      }
      const data = await api.get("/api/auth/me");
      if (data.user) {
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {}
    await clearTokens();
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}