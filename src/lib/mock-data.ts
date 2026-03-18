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
export const MOCK_LEADS: Lead[] = [];

// ── Seguimientos ────────────────────────────────────────────────
export const MOCK_SEGUIMIENTOS: Seguimiento[] = [];
