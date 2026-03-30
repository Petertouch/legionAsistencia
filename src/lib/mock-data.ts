import type { CaseArea, Prioridad } from "./pipelines";

export interface Suscriptor {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  plan: string;
  estado_pago: string;
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
    id: "477f9b02-ad4c-4ecd-a680-f9cdf0565e0d",
    nombre: "Cliente Demo",
    telefono: "3001234567",
    email: "demo@legion.com",
    cedula: "123",
    plan: "Plus",
    estado_pago: "Al dia",
    rama: "Ejército Nacional",
    rango: "Cabo Primero",
    fecha_inicio: "2026-03-24",
    notas: "",
    created_at: "2026-03-24T17:36:00Z",
    updated_at: "2026-03-24T17:36:00Z",
  },
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
export const MOCK_CASOS: Caso[] = [
  {
    id: "c-demo-1",
    suscriptor_id: "477f9b02-ad4c-4ecd-a680-f9cdf0565e0d",
    suscriptor_nombre: "Cliente Demo",
    area: "Disciplinario",
    titulo: "Investigación disciplinaria por presunta inasistencia",
    etapa: "Pruebas",
    etapa_index: 3,
    prioridad: "alta",
    abogado: "Dr. Ramírez",
    descripcion: "Proceso disciplinario iniciado por presunta inasistencia injustificada a servicio. Se presentaron descargos argumentando licencia médica no registrada por error administrativo. Actualmente en etapa probatoria solicitando testimonios de compañeros y registro médico.",
    fecha_limite: "2026-04-15",
    fecha_ingreso_etapa: "2026-03-18T10:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "d-pru-1": true, "d-pru-2": false, "d-pru-3": false },
    notas_etapa: "Se solicitaron 3 testimonios. Pendiente respuesta del hospital militar.",
    created_at: "2026-02-10T10:00:00Z",
    updated_at: "2026-03-18T10:00:00Z",
  },
  {
    id: "c-demo-2",
    suscriptor_id: "477f9b02-ad4c-4ecd-a680-f9cdf0565e0d",
    suscriptor_nombre: "Cliente Demo",
    area: "Familia",
    titulo: "Demanda de custodia y regulación de visitas",
    etapa: "Conciliacion",
    etapa_index: 4,
    prioridad: "normal",
    abogado: "Dra. López",
    descripcion: "Demanda de custodia compartida del menor. Se busca regulación de visitas cada quince días y vacaciones alternas. Demanda admitida y notificada. Próxima audiencia de conciliación programada.",
    fecha_limite: "2026-05-01",
    fecha_ingreso_etapa: "2026-03-20T14:00:00Z",
    fecha_audiencia: "2026-04-02",
    fecha_cierre: null,
    checklist: { "f-con-1": true, "f-con-2": false },
    notas_etapa: "Audiencia de conciliación fijada para el 2 de abril. Preparar propuesta de custodia compartida.",
    created_at: "2026-01-20T08:00:00Z",
    updated_at: "2026-03-20T14:00:00Z",
  },
  {
    id: "c-andres-1",
    suscriptor_id: "54dac845-30ed-40d3-ae80-cb11d78a0f6d",
    suscriptor_nombre: "Andres Calvo",
    area: "Penal Militar",
    titulo: "Defensa en consejo verbal de guerra",
    etapa: "Descargos",
    etapa_index: 2,
    prioridad: "alta",
    abogado: "Dr. Ramirez",
    descripcion: "Proceso penal militar por presunta desobediencia en operación. Se presentaron descargos iniciales. Pendiente audiencia de pruebas.",
    fecha_limite: "2026-04-20",
    fecha_ingreso_etapa: "2026-03-25T09:00:00Z",
    fecha_audiencia: "2026-04-10",
    fecha_cierre: null,
    checklist: { "pm-des-1": true, "pm-des-2": false, "pm-des-3": false },
    notas_etapa: "Descargos presentados el 25 de marzo. Pendiente recolección de pruebas testimoniales.",
    created_at: "2026-03-15T08:00:00Z",
    updated_at: "2026-03-25T09:00:00Z",
  },
  {
    id: "c-andres-2",
    suscriptor_id: "54dac845-30ed-40d3-ae80-cb11d78a0f6d",
    suscriptor_nombre: "Andres Calvo",
    area: "Consumidor",
    titulo: "Reclamación por cobro indebido de seguro BEPS",
    etapa: "Reclamacion Directa",
    etapa_index: 1,
    prioridad: "normal",
    abogado: "Dr. Ramirez",
    descripcion: "Reclamación contra aseguradora por cobro indebido en póliza BEPS. Se envió reclamación directa y se espera respuesta en 15 días hábiles.",
    fecha_limite: "2026-05-01",
    fecha_ingreso_etapa: "2026-03-28T11:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "co-rec-1": true, "co-rec-2": false },
    notas_etapa: "Reclamación directa enviada el 28 de marzo. Plazo de respuesta: 15 días hábiles.",
    created_at: "2026-03-28T10:00:00Z",
    updated_at: "2026-03-28T11:00:00Z",
  },
];

// ── Leads ───────────────────────────────────────────────────────
export const MOCK_LEADS: Lead[] = [];

// ── Seguimientos ────────────────────────────────────────────────
export const MOCK_SEGUIMIENTOS: Seguimiento[] = [];
