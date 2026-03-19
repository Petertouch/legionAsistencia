import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export interface Lanza {
  id: string;
  code: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  ciudad: string;
  rama: string;
  rango: string;
  suscriptor_id: string | null;
  status: "activo" | "inactivo";
  created_at: string;
}

export interface LanzaLead {
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

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface LanzaStore {
  lanzas: Lanza[];
  leads: LanzaLead[];
  loaded: boolean;

  // Data fetching
  fetchAll: () => Promise<void>;

  // Lanza actions
  registerLanza: (data: Omit<Lanza, "id" | "code" | "status" | "created_at">) => Promise<Lanza | null>;
  updateLanza: (id: string, data: Partial<Lanza>) => Promise<void>;
  toggleLanzaStatus: (id: string) => Promise<void>;
  getLanzaByCode: (code: string) => Lanza | undefined;
  getLanzaByCedula: (cedula: string) => Lanza | undefined;

  // Lead actions
  addLead: (data: Omit<LanzaLead, "id" | "status" | "created_at">) => Promise<LanzaLead | null>;
  updateLeadStatus: (id: string, status: LanzaLead["status"]) => Promise<void>;
  getLeadsByLanza: (lanzaId: string) => LanzaLead[];
}

export const useLanzaStore = create<LanzaStore>()((set, get) => ({
  lanzas: [],
  leads: [],
  loaded: false,

  fetchAll: async () => {
    const supabase = createClient();
    const [{ data: lanzas }, { data: leads }] = await Promise.all([
      supabase.from("lanzas").select("*").order("created_at", { ascending: false }),
      supabase.from("lanza_leads").select("*").order("created_at", { ascending: false }),
    ]);
    set({
      lanzas: (lanzas || []) as Lanza[],
      leads: (leads || []) as LanzaLead[],
      loaded: true,
    });
  },

  registerLanza: async (data) => {
    const supabase = createClient();
    const code = generateCode();
    const { data: row, error } = await supabase
      .from("lanzas")
      .insert({ ...data, code, status: "activo" })
      .select()
      .single();
    if (error || !row) return null;
    const lanza = row as Lanza;
    set((s) => ({ lanzas: [lanza, ...s.lanzas] }));
    return lanza;
  },

  updateLanza: async (id, data) => {
    const supabase = createClient();
    await supabase.from("lanzas").update(data).eq("id", id);
    set((s) => ({
      lanzas: s.lanzas.map((l) => (l.id === id ? { ...l, ...data } : l)),
    }));
  },

  toggleLanzaStatus: async (id) => {
    const supabase = createClient();
    const lanza = get().lanzas.find((l) => l.id === id);
    if (!lanza) return;
    const newStatus = lanza.status === "activo" ? "inactivo" : "activo";
    await supabase.from("lanzas").update({ status: newStatus }).eq("id", id);
    set((s) => ({
      lanzas: s.lanzas.map((l) =>
        l.id === id ? { ...l, status: newStatus as "activo" | "inactivo" } : l
      ),
    }));
  },

  getLanzaByCode: (code) => get().lanzas.find((l) => l.code === code),
  getLanzaByCedula: (cedula) => get().lanzas.find((l) => l.cedula === cedula),

  addLead: async (data) => {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("lanza_leads")
      .insert({ ...data, status: "nuevo" })
      .select()
      .single();
    if (error || !row) return null;
    const lead = row as LanzaLead;
    set((s) => ({ leads: [lead, ...s.leads] }));
    return lead;
  },

  updateLeadStatus: async (id, status) => {
    const supabase = createClient();
    await supabase.from("lanza_leads").update({ status }).eq("id", id);
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
  },

  getLeadsByLanza: (lanzaId) => get().leads.filter((l) => l.lanza_id === lanzaId),
}));