import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseArea } from "@/lib/pipelines";

export type MemberRole = "abogado" | "profesor" | "vendedor";
export type MemberEstado = "activo" | "inactivo" | "vacaciones";

export interface TeamMember {
  id: string;
  role: MemberRole;
  nombre: string;
  email: string;
  telefono: string;
  cedula: string;
  estado: MemberEstado;
  fecha_ingreso: string;
  password: string;
  color: string;
  notas: string;
  created_at: string;
  updated_at: string;
  // Abogado-specific
  areas_habilitadas: CaseArea[];
  especialidad: CaseArea;
  max_casos: number;
  // Profesor-specific
  especialidad_academica: string;
  bio: string;
  avatar_url: string;
  // Vendedor-specific
  comision_porcentaje: number;
  vendedor_code: string;
  ciudad: string;
}

// Keep backward compat
export type Abogado = TeamMember;
export type AbogadoEstado = MemberEstado;

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "ab1",
    role: "abogado",
    nombre: "Dr. Ramirez",
    email: "ramirez@legionjuridica.com",
    telefono: "3176689010",
    cedula: "80123456",
    areas_habilitadas: ["Disciplinario", "Penal Militar", "Consumidor"],
    especialidad: "Penal Militar",
    estado: "activo",
    fecha_ingreso: "2024-06-01",
    password: "",
    color: "#3b82f6",
    notas: "Abogado senior. 8 años de experiencia en justicia penal militar.",
    max_casos: 15,
    especialidad_academica: "",
    bio: "",
    avatar_url: "",
    comision_porcentaje: 0,
    vendedor_code: "",
    ciudad: "",
    created_at: "2024-06-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "prof1",
    role: "profesor",
    nombre: "Pedro Tobar",
    email: "pedrotobarcaldas@gmail.com",
    telefono: "3124426783",
    cedula: "1110448098",
    areas_habilitadas: [],
    especialidad: "Disciplinario",
    estado: "activo",
    fecha_ingreso: "2026-03-30",
    password: "",
    color: "#a855f7",
    notas: "",
    max_casos: 0,
    especialidad_academica: "Finanzas personales y educación financiera",
    bio: "Especialista en finanzas personales para servidores públicos",
    avatar_url: "",
    comision_porcentaje: 0,
    vendedor_code: "",
    ciudad: "",
    created_at: "2026-03-30T10:00:00Z",
    updated_at: "2026-03-30T10:00:00Z",
  },
];

interface TeamStore {
  abogados: TeamMember[];
  idCounter: number;
  getAbogado: (id: string) => TeamMember | undefined;
  getMember: (id: string) => TeamMember | undefined;
  getByRole: (role: MemberRole) => TeamMember[];
  getProfesores: () => TeamMember[];
  getVendedores: () => TeamMember[];
  getVendedorByCode: (code: string) => TeamMember | undefined;
  addAbogado: (data: Omit<TeamMember, "id" | "created_at" | "updated_at">) => void;
  addMember: (data: Omit<TeamMember, "id" | "created_at" | "updated_at">) => void;
  updateAbogado: (id: string, data: Partial<TeamMember>) => void;
  toggleArea: (id: string, area: CaseArea) => void;
  changePassword: (id: string, newPassword: string) => void;
  setEstado: (id: string, estado: MemberEstado) => void;
  deleteAbogado: (id: string) => void;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      abogados: INITIAL_MEMBERS,
      idCounter: 10,

      getAbogado: (id) => get().abogados.find((a) => a.id === id),
      getMember: (id) => get().abogados.find((a) => a.id === id),
      getByRole: (role) => get().abogados.filter((a) => a.role === role),
      getProfesores: () => get().abogados.filter((a) => a.role === "profesor"),
      getVendedores: () => get().abogados.filter((a) => a.role === "vendedor"),
      getVendedorByCode: (code) => get().abogados.find((a) => a.role === "vendedor" && a.vendedor_code === code),

      addAbogado: (data) => {
        const now = new Date().toISOString();
        set((s) => ({
          abogados: [...s.abogados, { ...data, id: `mb${s.idCounter}`, created_at: now, updated_at: now }],
          idCounter: s.idCounter + 1,
        }));
      },

      addMember: (data) => {
        const now = new Date().toISOString();
        set((s) => ({
          abogados: [...s.abogados, { ...data, id: `mb${s.idCounter}`, created_at: now, updated_at: now }],
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
    {
      name: "legion-team",
      version: 4,
      migrate: (state: unknown) => {
        const old = state as { abogados?: TeamMember[]; idCounter?: number };
        return {
          abogados: (old.abogados || INITIAL_MEMBERS).map((a) => ({
            ...a,
            role: a.role || "abogado" as MemberRole,
            especialidad_academica: a.especialidad_academica || "",
            bio: a.bio || "",
            avatar_url: a.avatar_url || "",
            comision_porcentaje: a.comision_porcentaje || 0,
            vendedor_code: a.vendedor_code || "",
            ciudad: a.ciudad || "",
          })),
          idCounter: old.idCounter || 10,
        };
      },
    }
  )
);
