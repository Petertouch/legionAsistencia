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

// ── Documentos de contrato ────────────────────────────────────────
export interface DocumentoContrato {
  id: string;
  suscriptor_id: string;
  nombre: string;
  tipo: "contrato" | "anexo" | "identificacion" | "otro";
  archivo_url: string;      // in production: Supabase Storage URL
  tamano: string;            // display size e.g. "1.2 MB"
  subido_por: string;
  created_at: string;
}

export const MOCK_DOCUMENTOS: DocumentoContrato[] = [];

// ── Suscriptores ────────────────────────────────────────────────
export const MOCK_SUSCRIPTORES: Suscriptor[] = [
  {
    id: "s1",
    nombre: "Carlos Andrés Gómez",
    telefono: "3101234567",
    email: "carlos.gomez@mail.com",
    cedula: "80123456",
    plan: "Base",
    estado_pago: "Al dia",
    rama: "Ejército Nacional",
    rango: "Sargento Primero",
    fecha_inicio: "2025-11-15",
    notas: "",
    created_at: "2025-11-15T10:00:00Z",
    updated_at: "2025-11-15T10:00:00Z",
  },
  {
    id: "s2",
    nombre: "María Fernanda Rodríguez",
    telefono: "3209876543",
    email: "maria.rodriguez@mail.com",
    cedula: "52987654",
    plan: "Plus",
    estado_pago: "Al dia",
    rama: "Policía Nacional",
    rango: "Intendente",
    fecha_inicio: "2025-12-01",
    notas: "",
    created_at: "2025-12-01T10:00:00Z",
    updated_at: "2025-12-01T10:00:00Z",
  },
  {
    id: "s3",
    nombre: "Jorge Luis Martínez",
    telefono: "3155551234",
    email: "jorge.martinez@mail.com",
    cedula: "19876543",
    plan: "Elite",
    estado_pago: "Pendiente",
    rama: "Armada Nacional",
    rango: "Suboficial Primero",
    fecha_inicio: "2026-01-10",
    notas: "",
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-01-10T10:00:00Z",
  },
];

// ── Casos (Pipeline-based) ──────────────────────────────────────
export const MOCK_CASOS: Caso[] = [];

// ── Leads ───────────────────────────────────────────────────────
export const MOCK_LEADS: Lead[] = [];

// ── Seguimientos ────────────────────────────────────────────────
export const MOCK_SEGUIMIENTOS: Seguimiento[] = [];
