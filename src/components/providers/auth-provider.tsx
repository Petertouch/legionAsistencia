"use client";

import { createContext, useContext, useEffect } from "react";
import { useAuthStore, type AuthUser, type UserRole } from "@/lib/stores/auth-store";

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAbogado: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    isAdmin: user?.role === "admin",
    isAbogado: user?.role === "abogado",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
