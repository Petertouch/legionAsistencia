import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseArea } from "@/lib/pipelines";

export type AbogadoEstado = "activo" | "inactivo" | "vacaciones";

export interface Abogado {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  cedula: string;
  areas_habilitadas: CaseArea[];
  especialidad: CaseArea;
  estado: AbogadoEstado;
  fecha_ingreso: string;
  password: string;
  color: string; // avatar color
  notas: string;
  max_casos: number; // max active cases
  created_at: string;
  updated_at: string;
}

const INITIAL_ABOGADOS: Abogado[] = [
  {
    id: "ab1",
    nombre: "Dr. Ramirez",
    email: "ramirez@legionjuridica.com",
    telefono: "3176689010",
    cedula: "80123456",
    areas_habilitadas: ["Disciplinario", "Penal Militar", "Consumidor"],
    especialidad: "Penal Militar",
    estado: "activo",
    fecha_ingreso: "2024-06-01",
    password: "legion2026",
    color: "#3b82f6",
    notas: "Abogado senior. 8 años de experiencia en justicia penal militar.",
    max_casos: 15,
    created_at: "2024-06-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "ab2",
    nombre: "Dra. Lopez",
    email: "lopez@legionjuridica.com",
    telefono: "3176689011",
    cedula: "52987654",
    areas_habilitadas: ["Familia", "Disciplinario", "Documentos"],
    especialidad: "Familia",
    estado: "activo",
    fecha_ingreso: "2025-01-15",
    password: "legion2026",
    color: "#a855f7",
    notas: "Especialista en derecho de familia y documentos legales.",
    max_casos: 12,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "ab3",
    nombre: "Dr. Martinez",
    email: "martinez@legionjuridica.com",
    telefono: "3176689012",
    cedula: "79456123",
    areas_habilitadas: ["Civil", "Penal Militar", "Documentos"],
    especialidad: "Civil",
    estado: "activo",
    fecha_ingreso: "2025-04-01",
    password: "legion2026",
    color: "#22c55e",
    notas: "Enfocado en civil y cobros ejecutivos.",
    max_casos: 10,
    created_at: "2025-04-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
];

interface TeamStore {
  abogados: Abogado[];
  idCounter: number;
  getAbogado: (id: string) => Abogado | undefined;
  addAbogado: (data: Omit<Abogado, "id" | "created_at" | "updated_at">) => void;
  updateAbogado: (id: string, data: Partial<Abogado>) => void;
  toggleArea: (id: string, area: CaseArea) => void;
  changePassword: (id: string, newPassword: string) => void;
  setEstado: (id: string, estado: AbogadoEstado) => void;
  deleteAbogado: (id: string) => void;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      abogados: INITIAL_ABOGADOS,
      idCounter: 10,

      getAbogado: (id) => get().abogados.find((a) => a.id === id),

      addAbogado: (data) => {
        const now = new Date().toISOString();
        set((s) => ({
          abogados: [...s.abogados, { ...data, id: `ab${s.idCounter}`, created_at: now, updated_at: now }],
          idCounter: s.idCounter + 1,
        }));
      },

      updateAbogado: (id, data) =>
        set((s) => ({
          abogados: s.abogados.map((a) =>
            a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
          ),
        })),

      toggleArea: (id, area) =>
        set((s) => ({
          abogados: s.abogados.map((a) => {
            if (a.id !== id) return a;
            const has = a.areas_habilitadas.includes(area);
            return {
              ...a,
              areas_habilitadas: has
                ? a.areas_habilitadas.filter((ar) => ar !== area)
                : [...a.areas_habilitadas, area],
              updated_at: new Date().toISOString(),
            };
          }),
        })),

      changePassword: (id, newPassword) =>
        set((s) => ({
          abogados: s.abogados.map((a) =>
            a.id === id ? { ...a, password: newPassword, updated_at: new Date().toISOString() } : a
          ),
        })),

      setEstado: (id, estado) =>
        set((s) => ({
          abogados: s.abogados.map((a) =>
            a.id === id ? { ...a, estado, updated_at: new Date().toISOString() } : a
          ),
        })),

      deleteAbogado: (id) =>
        set((s) => ({ abogados: s.abogados.filter((a) => a.id !== id) })),
    }),
    { name: "legion-team", version: 1 }
  )
);
