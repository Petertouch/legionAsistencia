import { create } from "zustand";
import type { CaseArea } from "@/lib/pipelines";

export type MemberRole = "abogado" | "profesor" | "admin";
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

// Normaliza una fila de Supabase a TeamMember (el password NUNCA viaja al cliente).
function normalize(row: Record<string, unknown>): TeamMember {
  return {
    id: String(row.id),
    role: (row.role as MemberRole) || "abogado",
    nombre: (row.nombre as string) || "",
    email: (row.email as string) || "",
    telefono: (row.telefono as string) || "",
    cedula: (row.cedula as string) || "",
    estado: (row.estado as MemberEstado) || "activo",
    fecha_ingreso: (row.fecha_ingreso as string) || "",
    password: "",
    color: (row.color as string) || "#3b82f6",
    notas: (row.notas as string) || "",
    created_at: (row.created_at as string) || "",
    updated_at: (row.updated_at as string) || "",
    areas_habilitadas: Array.isArray(row.areas_habilitadas) ? (row.areas_habilitadas as CaseArea[]) : [],
    especialidad: (row.especialidad as CaseArea) || "Disciplinario",
    max_casos: typeof row.max_casos === "number" ? row.max_casos : 0,
    especialidad_academica: (row.especialidad_academica as string) || "",
    bio: (row.bio as string) || "",
    avatar_url: (row.avatar_url as string) || "",
    comision_porcentaje: typeof row.comision_porcentaje === "number" ? row.comision_porcentaje : 0,
    vendedor_code: (row.vendedor_code as string) || "",
    ciudad: (row.ciudad as string) || "",
  };
}

interface TeamStore {
  abogados: TeamMember[];
  loaded: boolean;
  loading: boolean;
  loadEquipo: (force?: boolean) => Promise<void>;
  getAbogado: (id: string) => TeamMember | undefined;
  getMember: (id: string) => TeamMember | undefined;
  getByRole: (role: MemberRole) => TeamMember[];
  getProfesores: () => TeamMember[];
  addAbogado: (data: Omit<TeamMember, "id" | "created_at" | "updated_at">) => Promise<void>;
  addMember: (data: Omit<TeamMember, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateAbogado: (id: string, data: Partial<TeamMember>) => Promise<void>;
  toggleArea: (id: string, area: CaseArea) => Promise<void>;
  changePassword: (id: string, newPassword: string) => Promise<void>;
  setEstado: (id: string, estado: MemberEstado) => Promise<void>;
  deleteAbogado: (id: string) => Promise<void>;
}

export const useTeamStore = create<TeamStore>()((set, get) => ({
  abogados: [],
  loaded: false,
  loading: false,

  loadEquipo: async (force) => {
    if (get().loading) return;
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/equipo");
      if (res.ok) {
        const rows = (await res.json()) as Record<string, unknown>[];
        set({ abogados: rows.map(normalize), loaded: true });
      }
    } catch {
      // silencioso: la UI mostrará lista vacía hasta el próximo intento
    } finally {
      set({ loading: false });
    }
  },

  getAbogado: (id) => get().abogados.find((a) => a.id === id),
  getMember: (id) => get().abogados.find((a) => a.id === id),
  getByRole: (role) => get().abogados.filter((a) => a.role === role),
  getProfesores: () => get().abogados.filter((a) => a.role === "profesor"),

  addMember: async (data) => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic = normalize({ ...data, id: tempId, created_at: now, updated_at: now } as Record<string, unknown>);
    set((s) => ({ abogados: [...s.abogados, optimistic] }));
    try {
      const res = await fetch("/api/equipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const row = await res.json();
        set((s) => ({ abogados: s.abogados.map((a) => (a.id === tempId ? normalize(row) : a)) }));
      } else {
        set((s) => ({ abogados: s.abogados.filter((a) => a.id !== tempId) }));
      }
    } catch {
      set((s) => ({ abogados: s.abogados.filter((a) => a.id !== tempId) }));
    }
  },

  addAbogado: async (data) => get().addMember(data),

  updateAbogado: async (id, data) => {
    set((s) => ({
      abogados: s.abogados.map((a) =>
        a.id === id ? { ...a, ...data, password: a.password, updated_at: new Date().toISOString() } : a
      ),
    }));
    try {
      await fetch(`/api/equipo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // mantenemos el cambio optimista; el siguiente loadEquipo reconcilia
    }
  },

  toggleArea: async (id, area) => {
    const member = get().abogados.find((a) => a.id === id);
    if (!member) return;
    const has = member.areas_habilitadas.includes(area);
    const areas_habilitadas = has
      ? member.areas_habilitadas.filter((ar) => ar !== area)
      : [...member.areas_habilitadas, area];
    await get().updateAbogado(id, { areas_habilitadas });
  },

  changePassword: async (id, newPassword) => {
    // No se guarda el password en el estado del cliente.
    set((s) => ({
      abogados: s.abogados.map((a) => (a.id === id ? { ...a, updated_at: new Date().toISOString() } : a)),
    }));
    try {
      await fetch(`/api/equipo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
    } catch {
      // noop
    }
  },

  setEstado: async (id, estado) => {
    await get().updateAbogado(id, { estado });
  },

  deleteAbogado: async (id) => {
    set((s) => ({ abogados: s.abogados.filter((a) => a.id !== id) }));
    try {
      await fetch(`/api/equipo/${id}`, { method: "DELETE" });
    } catch {
      // noop
    }
  },
}));
