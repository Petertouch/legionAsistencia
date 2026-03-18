import type { CaseArea, Prioridad } from "./pipelines";

export interface Suscriptor {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  plan: "Gratuito" | "Base" | "Plus" | "Elite";
  estado_pago: "Al dia" | "Pendiente" | "Vencido";
  rama: string;
  rango: string;
  fecha_inicio: string;
  notas: string;
  created_at: string;
  updated_at: string;
}

export interface Caso {
  id: string;
  suscriptor_id: string;
  suscriptor_nombre?: string;
  suscriptor_nombre_real?: string;
  suscriptor_cedula?: string;
  suscriptor_email?: string;
  area: CaseArea;
  titulo: string;
  etapa: string;
  etapa_index: number;
  prioridad: Prioridad;
  abogado: string;
  descripcion: string;
  fecha_limite: string | null;
  fecha_ingreso_etapa: string;
  fecha_audiencia: string | null;
  fecha_cierre: string | null;
  checklist: Record<string, boolean>;
  notas_etapa: string;
  respuesta?: string;
  respondido_por?: string;
  respondido_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  area_interes: string;
  fuente: "chatbot" | "web" | "referido" | "whatsapp";
  estado: "Nuevo" | "Contactado" | "Interesado" | "Convertido" | "Perdido";
  notas: string;
  created_at: string;
  updated_at: string;
}

export interface Seguimiento {
  id: string;
  suscriptor_id: string | null;
  caso_id: string | null;
  lead_id: string | null;
  tipo: "llamada" | "reunion" | "whatsapp" | "nota";
  descripcion: string;
  fecha: string;
  suscriptor_nombre?: string;
  caso_area?: string;
  lead_nombre?: string;
  created_at: string;
}

// ── Suscriptores ────────────────────────────────────────────────
export const MOCK_SUSCRIPTORES: Suscriptor[] = [];

// ── Casos (Pipeline-based) ──────────────────────────────────────
export const MOCK_CASOS: Caso[] = [];

// ── Leads ───────────────────────────────────────────────────────
export const MOCK_LEADS: Lead[] = [
  {
    id: "l1", nombre: "Juan Perez", telefono: "3181234567", email: "jperez@mail.com",
    area_interes: "Penal Militar", fuente: "whatsapp", estado: "Nuevo",
    notas: "Pregunto por proceso disciplinario", created_at: "2026-03-15T14:00:00Z", updated_at: "2026-03-15T14:00:00Z",
  },
  {
    id: "l2", nombre: "Ana Castillo", telefono: "3187654321", email: "acastillo@mail.com",
    area_interes: "Familia", fuente: "chatbot", estado: "Contactado",
    notas: "Interesada en plan Plus para tema de custodia", created_at: "2026-03-14T09:00:00Z", updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "l3", nombre: "Roberto Diaz", telefono: "3209876543", email: "rdiaz@mail.com",
    area_interes: "Disciplinario", fuente: "referido", estado: "Interesado",
    notas: "Referido por Sgto Mendoza. Tiene citación a descargos", created_at: "2026-03-12T11:00:00Z", updated_at: "2026-03-14T15:00:00Z",
  },
  {
    id: "l4", nombre: "Sofia Herrera", telefono: "3001112233", email: "sherrera@mail.com",
    area_interes: "Consumidor", fuente: "web", estado: "Convertido",
    notas: "Afiliada al plan Base", created_at: "2026-03-01T08:00:00Z", updated_at: "2026-03-10T10:00:00Z",
  },
  {
    id: "l5", nombre: "Diego Morales", telefono: "3114455667", email: "dmorales@mail.com",
    area_interes: "Documentos", fuente: "whatsapp", estado: "Perdido",
    notas: "No respondio despues del segundo contacto", created_at: "2026-02-20T10:00:00Z", updated_at: "2026-03-05T10:00:00Z",
  },
];

// ── Seguimientos ────────────────────────────────────────────────
export const MOCK_SEGUIMIENTOS: Seguimiento[] = [];
