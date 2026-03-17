import type { CaseArea, Prioridad } from "./pipelines";

export interface Suscriptor {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  plan: "Base" | "Plus" | "Elite";
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
export const MOCK_SUSCRIPTORES: Suscriptor[] = [
  {
    id: "s1", nombre: "Sgto. Carlos Mendoza", telefono: "3176689001", email: "cmendoza@mail.com", cedula: "123",
    plan: "Plus", estado_pago: "Al dia", rama: "Ejercito", rango: "Sargento Segundo",
    fecha_inicio: "2025-08-15", notas: "Cliente desde 2025", created_at: "2025-08-15T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "s2", nombre: "SI. Maria Torres", telefono: "3176689002", email: "mtorres@mail.com", cedula: "52876543",
    plan: "Elite", estado_pago: "Al dia", rama: "Policia", rango: "Subintendente",
    fecha_inicio: "2025-11-01", notas: "Referida por Mendoza", created_at: "2025-11-01T10:00:00Z", updated_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "s3", nombre: "My. Andres Ruiz", telefono: "3176689003", email: "aruiz@mail.com", cedula: "79654321",
    plan: "Base", estado_pago: "Pendiente", rama: "Ejercito", rango: "Mayor",
    fecha_inicio: "2026-01-10", notas: "", created_at: "2026-01-10T10:00:00Z", updated_at: "2026-03-10T10:00:00Z",
  },
  {
    id: "s4", nombre: "SO2. Laura Gomez", telefono: "3176689004", email: "lgomez@mail.com", cedula: "1019876543",
    plan: "Plus", estado_pago: "Vencido", rama: "Fuerza Aerea", rango: "Suboficial Segundo",
    fecha_inicio: "2025-06-20", notas: "Pago vencido hace 2 meses", created_at: "2025-06-20T10:00:00Z", updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "s5", nombre: "Ss. Pedro Vargas", telefono: "3176689005", email: "pvargas@mail.com", cedula: "80543219",
    plan: "Elite", estado_pago: "Al dia", rama: "Armada", rango: "Suboficial Segundo",
    fecha_inicio: "2025-09-05", notas: "Plan familiar activo", created_at: "2025-09-05T10:00:00Z", updated_at: "2026-03-05T10:00:00Z",
  },
];

// ── Casos (Pipeline-based) ──────────────────────────────────────
export const MOCK_CASOS: Caso[] = [
  // Disciplinario
  {
    id: "c1", suscriptor_id: "s1", suscriptor_nombre: "Sgto. Carlos Mendoza",
    area: "Disciplinario", titulo: "Descargos falta en servicio",
    etapa: "Descargos", etapa_index: 2, prioridad: "urgente", abogado: "Dr. Ramirez",
    descripcion: "Proceso disciplinario por presunta falta en servicio nocturno. Citacion a descargos recibida el 1 de marzo.",
    fecha_limite: "2026-03-20", fecha_ingreso_etapa: "2026-03-10T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "d-des-1": true, "d-des-2": false, "d-des-3": false, "d-des-4": false },
    notas_etapa: "Memorial en borrador, pendiente revision",
    created_at: "2026-02-25T10:00:00Z", updated_at: "2026-03-10T10:00:00Z",
  },
  {
    id: "c2", suscriptor_id: "s3", suscriptor_nombre: "My. Andres Ruiz",
    area: "Disciplinario", titulo: "Investigacion por uso indebido de vehiculo",
    etapa: "Analisis", etapa_index: 1, prioridad: "alta", abogado: "Dr. Ramirez",
    descripcion: "Investigacion por presunto uso indebido de vehiculo oficial fuera de horario.",
    fecha_limite: "2026-03-25", fecha_ingreso_etapa: "2026-03-14T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "d-ana-1": true, "d-ana-2": false, "d-ana-3": false, "d-ana-4": false },
    notas_etapa: "Revisando expediente",
    created_at: "2026-03-12T10:00:00Z", updated_at: "2026-03-14T10:00:00Z",
  },
  {
    id: "c3", suscriptor_id: "s4", suscriptor_nombre: "SO2. Laura Gomez",
    area: "Disciplinario", titulo: "Proceso por inasistencia a formacion",
    etapa: "Recepcion", etapa_index: 0, prioridad: "normal", abogado: "Dra. Lopez",
    descripcion: "Proceso disciplinario por inasistencia a formacion matutina en dos ocasiones.",
    fecha_limite: null, fecha_ingreso_etapa: "2026-03-15T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "d-rec-1": true, "d-rec-2": false, "d-rec-3": false },
    notas_etapa: "Pendiente verificar terminos",
    created_at: "2026-03-15T10:00:00Z", updated_at: "2026-03-15T10:00:00Z",
  },
  // Penal Militar
  {
    id: "c4", suscriptor_id: "s1", suscriptor_nombre: "Sgto. Carlos Mendoza",
    area: "Penal Militar", titulo: "Investigacion lesiones en operacion",
    etapa: "Juicio", etapa_index: 4, prioridad: "urgente", abogado: "Dr. Ramirez",
    descripcion: "Investigacion penal militar por lesiones a civil durante operacion de control.",
    fecha_limite: "2026-03-25", fecha_ingreso_etapa: "2026-03-05T10:00:00Z",
    fecha_audiencia: "2026-03-25", fecha_cierre: null,
    checklist: { "pm-jui-1": false, "pm-jui-2": false, "pm-jui-3": false, "pm-jui-4": false },
    notas_etapa: "Audiencia programada para el 25 de marzo",
    created_at: "2025-10-01T10:00:00Z", updated_at: "2026-03-12T10:00:00Z",
  },
  {
    id: "c5", suscriptor_id: "s5", suscriptor_nombre: "Ss. Pedro Vargas",
    area: "Penal Militar", titulo: "Investigacion perdida de material",
    etapa: "Indagacion", etapa_index: 1, prioridad: "normal", abogado: "Dr. Martinez",
    descripcion: "Investigacion por perdida de material de intendencia durante traslado.",
    fecha_limite: "2026-04-10", fecha_ingreso_etapa: "2026-03-08T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "pm-ind-1": true, "pm-ind-2": true, "pm-ind-3": false },
    notas_etapa: "Identificados 3 testigos",
    created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-08T10:00:00Z",
  },
  // Familia
  {
    id: "c6", suscriptor_id: "s2", suscriptor_nombre: "SI. Maria Torres",
    area: "Familia", titulo: "Custodia compartida menor",
    etapa: "Demanda", etapa_index: 1, prioridad: "alta", abogado: "Dra. Lopez",
    descripcion: "Proceso de custodia compartida de menor de 5 anos. Padre solicita custodia completa.",
    fecha_limite: "2026-03-22", fecha_ingreso_etapa: "2026-03-12T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "f-dem-1": true, "f-dem-2": true, "f-dem-3": false },
    notas_etapa: "Demanda redactada, pendiente radicacion",
    created_at: "2026-03-05T10:00:00Z", updated_at: "2026-03-12T10:00:00Z",
  },
  {
    id: "c7", suscriptor_id: "s4", suscriptor_nombre: "SO2. Laura Gomez",
    area: "Familia", titulo: "Regulacion de alimentos",
    etapa: "Conciliacion", etapa_index: 4, prioridad: "normal", abogado: "Dra. Lopez",
    descripcion: "Solicitud de regulacion de cuota alimentaria para dos menores.",
    fecha_limite: "2026-03-28", fecha_ingreso_etapa: "2026-03-10T10:00:00Z",
    fecha_audiencia: "2026-03-28", fecha_cierre: null,
    checklist: { "f-con-1": true, "f-con-2": false },
    notas_etapa: "Audiencia de conciliacion programada",
    created_at: "2026-01-15T10:00:00Z", updated_at: "2026-03-10T10:00:00Z",
  },
  // Civil
  {
    id: "c8", suscriptor_id: "s5", suscriptor_nombre: "Ss. Pedro Vargas",
    area: "Civil", titulo: "Incumplimiento contrato arrendamiento",
    etapa: "Sentencia", etapa_index: 6, prioridad: "baja", abogado: "Dr. Martinez",
    descripcion: "Demanda por incumplimiento de contrato de arrendamiento. Arrendador no devuelve deposito.",
    fecha_limite: null, fecha_ingreso_etapa: "2026-03-01T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "ci-sen-1": true, "ci-sen-2": false },
    notas_etapa: "Sentencia favorable, evaluando si la contraparte apela",
    created_at: "2025-09-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "c9", suscriptor_id: "s3", suscriptor_nombre: "My. Andres Ruiz",
    area: "Civil", titulo: "Cobro ejecutivo pagare",
    etapa: "Admision", etapa_index: 2, prioridad: "normal", abogado: "Dr. Martinez",
    descripcion: "Cobro ejecutivo de pagare por $15.000.000 contra persona natural.",
    fecha_limite: "2026-04-05", fecha_ingreso_etapa: "2026-03-13T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "ci-adm-1": false, "ci-adm-2": false },
    notas_etapa: "Esperando auto admisorio del juzgado",
    created_at: "2026-03-05T10:00:00Z", updated_at: "2026-03-13T10:00:00Z",
  },
  // Consumidor
  {
    id: "c10", suscriptor_id: "s2", suscriptor_nombre: "SI. Maria Torres",
    area: "Consumidor", titulo: "Garantia electrodomestico defectuoso",
    etapa: "Reclamacion", etapa_index: 1, prioridad: "normal", abogado: "Dr. Ramirez",
    descripcion: "Electrodomestico defectuoso comprado hace 2 meses. Almacen se niega a cambiar.",
    fecha_limite: null, fecha_ingreso_etapa: "2026-03-14T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "co-rcl-1": true, "co-rcl-2": false },
    notas_etapa: "Reclamacion redactada, pendiente radicacion",
    created_at: "2026-03-10T10:00:00Z", updated_at: "2026-03-14T10:00:00Z",
  },
  // Documentos (fast-track)
  {
    id: "c11", suscriptor_id: "s1", suscriptor_nombre: "Sgto. Carlos Mendoza",
    area: "Documentos", titulo: "Derecho de peticion ascenso",
    etapa: "Radicacion", etapa_index: 3, prioridad: "normal", abogado: "Dra. Lopez",
    descripcion: "Derecho de peticion al Ministerio de Defensa por demora en proceso de ascenso.",
    fecha_limite: null, fecha_ingreso_etapa: "2026-03-15T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "doc-rad-1": false, "doc-rad-2": false },
    notas_etapa: "Listo para radicar manana",
    created_at: "2026-03-12T10:00:00Z", updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "c12", suscriptor_id: "s3", suscriptor_nombre: "My. Andres Ruiz",
    area: "Documentos", titulo: "Tutela prestaciones sociales",
    etapa: "Seguimiento", etapa_index: 4, prioridad: "alta", abogado: "Dr. Martinez",
    descripcion: "Accion de tutela por no pago oportuno de prestaciones sociales.",
    fecha_limite: "2026-03-20", fecha_ingreso_etapa: "2026-03-05T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "doc-seg-1": false, "doc-seg-2": false },
    notas_etapa: "Esperando respuesta del juzgado — 10 dias habiles",
    created_at: "2026-02-20T10:00:00Z", updated_at: "2026-03-05T10:00:00Z",
  },
  {
    id: "c13", suscriptor_id: "s5", suscriptor_nombre: "Ss. Pedro Vargas",
    area: "Documentos", titulo: "Contrato de compraventa",
    etapa: "Redaccion", etapa_index: 1, prioridad: "baja", abogado: "Dra. Lopez",
    descripcion: "Revision y redaccion de contrato de compraventa de inmueble.",
    fecha_limite: null, fecha_ingreso_etapa: "2026-03-14T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: null,
    checklist: { "doc-red-1": true, "doc-red-2": false },
    notas_etapa: "En proceso de redaccion",
    created_at: "2026-03-13T10:00:00Z", updated_at: "2026-03-14T10:00:00Z",
  },
  // Cerrado
  {
    id: "c14", suscriptor_id: "s4", suscriptor_nombre: "SO2. Laura Gomez",
    area: "Documentos", titulo: "Derecho de peticion traslado",
    etapa: "Cerrado", etapa_index: 6, prioridad: "normal", abogado: "Dr. Ramirez",
    descripcion: "Derecho de peticion solicitando traslado a ciudad de origen.",
    fecha_limite: null, fecha_ingreso_etapa: "2026-03-10T10:00:00Z",
    fecha_audiencia: null, fecha_cierre: "2026-03-10",
    checklist: { "doc-cer-1": true },
    notas_etapa: "Respuesta favorable recibida",
    created_at: "2026-02-01T10:00:00Z", updated_at: "2026-03-10T10:00:00Z",
  },
];

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
    notas: "Referido por Sgto Mendoza. Tiene citacion a descargos", created_at: "2026-03-12T11:00:00Z", updated_at: "2026-03-14T15:00:00Z",
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
export const MOCK_SEGUIMIENTOS: Seguimiento[] = [
  {
    id: "seg1", suscriptor_id: "s1", caso_id: "c1", lead_id: null,
    tipo: "llamada", descripcion: "Llamada para revisar estado de descargos. Se presento memorial.",
    fecha: "2026-03-14T15:00:00Z", suscriptor_nombre: "Sgto. Carlos Mendoza", caso_area: "Disciplinario",
    created_at: "2026-03-14T15:00:00Z",
  },
  {
    id: "seg2", suscriptor_id: null, caso_id: null, lead_id: "l2",
    tipo: "whatsapp", descripcion: "Se envio informacion de planes por WhatsApp. Quedo de confirmar.",
    fecha: "2026-03-15T10:00:00Z", lead_nombre: "Ana Castillo",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "seg3", suscriptor_id: "s2", caso_id: "c6", lead_id: null,
    tipo: "reunion", descripcion: "Reunion inicial para revisar documentos de custodia.",
    fecha: "2026-03-13T09:00:00Z", suscriptor_nombre: "SI. Maria Torres", caso_area: "Familia",
    created_at: "2026-03-13T09:00:00Z",
  },
  {
    id: "seg4", suscriptor_id: null, caso_id: null, lead_id: "l3",
    tipo: "llamada", descripcion: "Primera llamada. Tiene citacion para el 20 de marzo. Muy interesado.",
    fecha: "2026-03-12T14:00:00Z", lead_nombre: "Roberto Diaz",
    created_at: "2026-03-12T14:00:00Z",
  },
  {
    id: "seg5", suscriptor_id: "s1", caso_id: "c4", lead_id: null,
    tipo: "nota", descripcion: "Audiencia reprogramada para el 25 de marzo. Notificar al cliente.",
    fecha: "2026-03-11T11:00:00Z", suscriptor_nombre: "Sgto. Carlos Mendoza", caso_area: "Penal Militar",
    created_at: "2026-03-11T11:00:00Z",
  },
];
