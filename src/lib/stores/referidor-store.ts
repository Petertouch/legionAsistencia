import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ─────────────────────────────────────────────────────────────────
export type ReferidorTipo = "vendedor" | "lanza" | "esposa" | string;
export type ReferidorEstado = "activo" | "inactivo" | "vacaciones";

export interface Referidor {
  id: string;
  code: string;
  tipo: ReferidorTipo;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  ciudad: string;
  status: ReferidorEstado;
  created_at: string;
  // Military/aliado-specific
  rama: string;
  rango: string;
  suscriptor_id: string | null;
  // Commission
  comision_personalizada: number | null;
  meta_bono: number | null;
  monto_bono: number | null;
  bono_pagado_at: string | null;
  // Vendedor-specific (optional)
  color: string | null;
  notas: string | null;
}

export interface ReferidorLead {
  id: string;
  lanza_id: string;
  lanza_code: string;
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  area_interes: string;
  plan_interes: string;
  mensaje: string;
  status: "nuevo" | "contactado" | "convertido" | "perdido";
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
export function generateReferidorCode(tipo: ReferidorTipo): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const prefixMap: Record<string, string> = { vendedor: "V-", lanza: "L-", esposa: "E-" };
  const prefix = prefixMap[tipo] || `${tipo[0].toUpperCase()}-`;
  return `${prefix}${code}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────
interface ReferidorStore {
  referidores: Referidor[];
  leads: ReferidorLead[];
  loaded: boolean;

  fetchAll: () => Promise<void>;

  // CRUD referidores
  createReferidor: (
    data: Omit<Referidor, "id" | "code" | "status" | "created_at"> & { status?: ReferidorEstado }
  ) => Promise<Referidor | null>;
  updateReferidor: (id: string, data: Partial<Referidor>) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  deleteReferidor: (id: string) => Promise<void>;

  // Queries
  getByCode: (code: string) => Referidor | undefined;
  getByCedula: (cedula: string) => Referidor | undefined;
  getByTipo: (tipo: ReferidorTipo) => Referidor[];
  getVendedores: () => Referidor[];

  // Leads
  addLead: (data: Omit<ReferidorLead, "id" | "status" | "created_at">) => Promise<ReferidorLead | null>;
  updateLeadStatus: (id: string, status: ReferidorLead["status"]) => Promise<void>;
  getLeadsByReferidor: (referidorId: string) => ReferidorLead[];
  getLeadsByCode: (code: string) => ReferidorLead[];
}

export const useReferidorStore = create<ReferidorStore>()((set, get) => ({
  referidores: [],
  leads: [],
  loaded: false,

  fetchAll: async () => {
    const [refRes, leadsRes] = await Promise.all([
      fetch("/api/referidores"),
      fetch("/api/referidores/leads?all=true"),
    ]);
    const referidores = refRes.ok ? await refRes.json() : [];
    // Fallback: if /api/referidores/leads?all=true returns error, try supabase direct for leads
    let leads: ReferidorLead[] = [];
    if (leadsRes.ok) {
      leads = await leadsRes.json();
    } else {
      const supabase = createClient();
      const { data } = await supabase.from("lanza_leads").select("*").order("created_at", { ascending: false });
      leads = (data || []) as ReferidorLead[];
    }
    set({
      referidores: (referidores || []) as Referidor[],
      leads,
      loaded: true,
    });
  },

  createReferidor: async (data) => {
    const code = generateReferidorCode(data.tipo);
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("lanzas")
      .insert({ ...data, code, status: data.status || "activo" })
      .select()
      .single();
    if (error || !row) return null;
    const referidor = row as Referidor;
    set((s) => ({ referidores: [referidor, ...s.referidores] }));
    return referidor;
  },

  updateReferidor: async (id, data) => {
    const res = await fetch("/api/referidores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al actualizar");
    }
    set((s) => ({
      referidores: s.referidores.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  toggleStatus: async (id) => {
    const ref = get().referidores.find((r) => r.id === id);
    if (!ref) return;
    const newStatus = ref.status === "activo" ? "inactivo" : "activo";
    const res = await fetch("/api/referidores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    set((s) => ({
      referidores: s.referidores.map((r) =>
        r.id === id ? { ...r, status: newStatus as ReferidorEstado } : r
      ),
    }));
  },

  deleteReferidor: async (id) => {
    const res = await fetch("/api/referidores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Error al eliminar");
    set((s) => ({ referidores: s.referidores.filter((r) => r.id !== id) }));
  },

  getByCode: (code) => get().referidores.find((r) => r.code === code),
  getByCedula: (cedula) => get().referidores.find((r) => r.cedula === cedula),
  getByTipo: (tipo) => get().referidores.filter((r) => r.tipo === tipo),
  getVendedores: () => get().referidores.filter((r) => r.tipo === "vendedor"),

  addLead: async (data) => {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("lanza_leads")
      .insert({ ...data, status: "nuevo" })
      .select()
      .single();
    if (error || !row) return null;
    const lead = row as ReferidorLead;
    set((s) => ({ leads: [lead, ...s.leads] }));
    return lead;
  },

  updateLeadStatus: async (id, status) => {
    const supabase = createClient();
    const { error } = await supabase.from("lanza_leads").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
  },

  getLeadsByReferidor: (referidorId) => get().leads.filter((l) => l.lanza_id === referidorId),
  getLeadsByCode: (code) => get().leads.filter((l) => l.lanza_code === code),
}));

// ─── Backwards-compat re-exports ──────────────────────────────────────────
// So existing code that imports from lanza-store can work with minimal changes.
export type Lanza = Referidor;
export type LanzaLead = ReferidorLead;
export type AliadoTipo = ReferidorTipo;
export const generateAliadoCode = generateReferidorCode;
export const useLanzaStore = useReferidorStore;
