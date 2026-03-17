import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "abogado";

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
}

// Mock users — abogado names must match mock-data abogado field
export const MOCK_USERS: AuthUser[] = [
  { id: "u1", nombre: "Carlos Admin", email: "admin@legionjuridica.com", role: "admin" },
  { id: "u2", nombre: "Dr. Ramirez", email: "ramirez@legionjuridica.com", role: "abogado" },
  { id: "u3", nombre: "Dra. Lopez", email: "lopez@legionjuridica.com", role: "abogado" },
];

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
    { name: "legion-auth" }
  )
);
