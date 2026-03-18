import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Lanza {
  id: string;
  code: string; // unique shareable code
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  ciudad: string;
  rama: string; // Ejército, Policía, Armada, Fuerza Aérea, Civil, Otro
  rango: string;
  suscriptor_id: string | null; // if already a client
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

let lanzaIdCounter = 100;
let leadIdCounter = 100;

function nextLanzaId() { return `lz${++lanzaIdCounter}`; }
function nextLeadId() { return `ll${++leadIdCounter}`; }

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface LanzaStore {
  lanzas: Lanza[];
  leads: LanzaLead[];

  // Lanza actions
  registerLanza: (data: Omit<Lanza, "id" | "code" | "status" | "created_at">) => Lanza;
  updateLanza: (id: string, data: Partial<Lanza>) => void;
  toggleLanzaStatus: (id: string) => void;
  getLanzaByCode: (code: string) => Lanza | undefined;
  getLanzaByCedula: (cedula: string) => Lanza | undefined;

  // Lead actions
  addLead: (data: Omit<LanzaLead, "id" | "status" | "created_at">) => LanzaLead;
  updateLeadStatus: (id: string, status: LanzaLead["status"]) => void;
  getLeadsByLanza: (lanzaId: string) => LanzaLead[];
}

export const useLanzaStore = create<LanzaStore>()(
  persist(
    (set, get) => ({
      lanzas: [],
      leads: [],

      registerLanza: (data) => {
        const lanza: Lanza = {
          ...data,
          id: nextLanzaId(),
          code: generateCode(),
          status: "activo",
          created_at: new Date().toISOString(),
        };
        set((s) => ({ lanzas: [lanza, ...s.lanzas] }));
        return lanza;
      },

      updateLanza: (id, data) =>
        set((s) => ({
          lanzas: s.lanzas.map((l) => (l.id === id ? { ...l, ...data } : l)),
        })),

      toggleLanzaStatus: (id) =>
        set((s) => ({
          lanzas: s.lanzas.map((l) =>
            l.id === id ? { ...l, status: l.status === "activo" ? "inactivo" as const : "activo" as const } : l
          ),
        })),

      getLanzaByCode: (code) => get().lanzas.find((l) => l.code === code),
      getLanzaByCedula: (cedula) => get().lanzas.find((l) => l.cedula === cedula),

      addLead: (data) => {
        const lead: LanzaLead = {
          ...data,
          id: nextLeadId(),
          status: "nuevo",
          created_at: new Date().toISOString(),
        };
        set((s) => ({ leads: [lead, ...s.leads] }));
        return lead;
      },

      updateLeadStatus: (id, status) =>
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
        })),

      getLeadsByLanza: (lanzaId) => get().leads.filter((l) => l.lanza_id === lanzaId),
    }),
    { name: "legion-lanzas", version: 1 }
  )
);
