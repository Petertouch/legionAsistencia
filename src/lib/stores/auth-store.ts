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
