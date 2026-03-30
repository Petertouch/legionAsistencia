"use client";

import { createContext, useContext, useEffect, useCallback } from "react";
import { useAuthStore, type AuthUser, type UserRole } from "@/lib/stores/auth-store";

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAbogado: boolean;
  isProfesor: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  const user = useAuthStore((s) => s.user);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  const logout = useCallback(() => {
    // Limpiar cookie server-side
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Limpiar Zustand
    storeLogout();
  }, [storeLogout]);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    isAdmin: user?.role === "admin",
    isAbogado: user?.role === "abogado",
    isProfesor: user?.role === "profesor",
    login: storeLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
