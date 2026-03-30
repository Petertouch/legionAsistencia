import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "abogado" | "profesor" | "cliente";

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  suscriptor_id?: string; // only for clients
  cedula?: string;
}

// Credentials: email → { password, user }
export const MOCK_CREDENTIALS: Record<string, { password: string; user: AuthUser }> = {
  "a@a.com": {
    password: "123",
    user: { id: "u1", nombre: "Admin", email: "a@a.com", role: "admin" },
  },
};

// Helper for login page
export const MOCK_USERS: AuthUser[] = Object.values(MOCK_CREDENTIALS).map((c) => c.user);

export function authenticate(email: string, password: string): AuthUser | null {
  const entry = MOCK_CREDENTIALS[email.toLowerCase().trim()];
  if (!entry) return null;
  if (entry.password !== password) return null;
  return entry.user;
}

interface AuthStore {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "legion-auth", skipHydration: true }
  )
);