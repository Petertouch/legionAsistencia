import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClientSession {
  suscriptor_id: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  plan: string;
  estado_pago: string;
  rama: string;
  rango: string;
}

interface ClientStore {
  session: ClientSession | null;
  login: (session: ClientSession) => void;
  logout: () => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      session: null,
      login: (session) => set({ session }),
      logout: () => set({ session: null }),
    }),
    { name: "legion-client", version: 1, skipHydration: true }
  )
);
