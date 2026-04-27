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
  caso_id?: string;
  nombre: string;
  tipo: "contrato" | "anexo" | "identificacion" | "otro";
  archivo_url: string;
  tamano: string;
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
  // ── Pedro Tobar ──
  {
    id: "c-pedro-1",
    suscriptor_id: "b477e960-a644-4baa-84e8-612b237eb7fe",
    suscriptor_nombre: "Pedro Tobar",
    area: "Penal Militar",
    titulo: "Defensa por presunta negligencia en custodia de armamento",
    etapa: "Investigación Previa",
    etapa_index: 1,
    prioridad: "urgente",
    abogado: "Dr. Ramirez",
    descripcion: "Se inició investigación penal militar por presunta negligencia en custodia de armamento asignado durante turno nocturno. Se alega pérdida de un fusil Galil del inventario. El procesado argumenta que el arma fue trasladada sin registro por el oficial de turno anterior.",
    fecha_limite: "2026-05-05",
    fecha_ingreso_etapa: "2026-04-10T08:00:00Z",
    fecha_audiencia: "2026-04-28",
    fecha_cierre: null,
    checklist: { "pm-inv-1": true, "pm-inv-2": true, "pm-inv-3": false },
    notas_etapa: "Se solicitó video de cámaras del depósito. Pendiente declaración del oficial de turno anterior.",
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-10T08:00:00Z",
  },
  {
    id: "c-pedro-2",
    suscriptor_id: "b477e960-a644-4baa-84e8-612b237eb7fe",
    suscriptor_nombre: "Pedro Tobar",
    area: "Disciplinario",
    titulo: "Sanción por uso indebido de vehículo oficial",
    etapa: "Descargos",
    etapa_index: 2,
    prioridad: "alta",
    abogado: "Dr. Ramirez",
    descripcion: "Proceso disciplinario por presunto uso de vehículo oficial para diligencias personales el 15 de marzo. Se presentaron descargos indicando que el desplazamiento fue autorizado verbalmente por el comandante directo para una diligencia médica de urgencia.",
    fecha_limite: "2026-05-15",
    fecha_ingreso_etapa: "2026-04-05T14:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "d-des-1": true, "d-des-2": false },
    notas_etapa: "Descargos presentados. Se busca declaración escrita del comandante que autorizó el desplazamiento.",
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-04-05T14:00:00Z",
  },
  {
    id: "c-pedro-3",
    suscriptor_id: "b477e960-a644-4baa-84e8-612b237eb7fe",
    suscriptor_nombre: "Pedro Tobar",
    area: "Consulta",
    titulo: "Consulta sobre pensión de invalidez por lesión en servicio",
    etapa: "Pendiente",
    etapa_index: 0,
    prioridad: "normal",
    abogado: "Dr. Ramirez",
    descripcion: "El suscriptor consulta sobre el proceso para solicitar pensión de invalidez tras sufrir lesión en rodilla durante ejercicio de entrenamiento. Requiere orientación sobre documentación necesaria y plazos ante la junta médica.",
    fecha_limite: null,
    fecha_ingreso_etapa: "2026-04-18T09:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: {},
    notas_etapa: "",
    created_at: "2026-04-18T09:00:00Z",
    updated_at: "2026-04-18T09:00:00Z",
  },
  // ── Carlos Gómez ──
  {
    id: "c-carlos-1",
    suscriptor_id: "s1",
    suscriptor_nombre: "Carlos Andrés Gómez",
    area: "Disciplinario",
    titulo: "Investigación por presunta embriaguez en servicio",
    etapa: "Auto de Apertura",
    etapa_index: 1,
    prioridad: "alta",
    abogado: "Dr. Ramirez",
    descripcion: "Se abrió investigación disciplinaria por presunta embriaguez durante turno de guardia. El suscriptor niega los hechos y afirma que el test de alcoholemia fue realizado con equipo sin calibración vigente.",
    fecha_limite: "2026-05-10",
    fecha_ingreso_etapa: "2026-04-12T10:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "d-aut-1": true, "d-aut-2": false },
    notas_etapa: "Se solicitó certificado de calibración del equipo. Auto de apertura notificado el 12 de abril.",
    created_at: "2026-04-05T08:00:00Z",
    updated_at: "2026-04-12T10:00:00Z",
  },
  {
    id: "c-carlos-2",
    suscriptor_id: "s1",
    suscriptor_nombre: "Carlos Andrés Gómez",
    area: "Documentos",
    titulo: "Revisión de acta de calificación de servicios 2025",
    etapa: "Revisión",
    etapa_index: 1,
    prioridad: "baja",
    abogado: "Dr. Ramirez",
    descripcion: "Revisión del acta de calificación de servicios del segundo semestre 2025. El suscriptor considera que la calificación no refleja su desempeño real y desea interponer recurso de reposición.",
    fecha_limite: "2026-06-01",
    fecha_ingreso_etapa: "2026-04-15T11:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "doc-rev-1": false },
    notas_etapa: "Pendiente recibir copia del acta original y soportes de calificación.",
    created_at: "2026-04-14T10:00:00Z",
    updated_at: "2026-04-15T11:00:00Z",
  },
  {
    id: "c-carlos-3",
    suscriptor_id: "s1",
    suscriptor_nombre: "Carlos Andrés Gómez",
    area: "Penal Militar",
    titulo: "Investigación por presunto abandono de puesto de centinela",
    etapa: "Descargos",
    etapa_index: 2,
    prioridad: "urgente",
    abogado: "Dr. Ramirez",
    descripcion: "Se abrió investigación penal militar por presunto abandono de puesto de centinela durante operación nocturna el 2 de abril. El suscriptor alega que fue relevado verbalmente por el cabo de guardia y se retiró a enfermería por fuerte dolor abdominal. Se requiere historia clínica y declaración del cabo.",
    fecha_limite: "2026-05-02",
    fecha_ingreso_etapa: "2026-04-18T08:00:00Z",
    fecha_audiencia: "2026-04-30",
    fecha_cierre: null,
    checklist: { "pm-des-1": true, "pm-des-2": true, "pm-des-3": false },
    notas_etapa: "Descargos presentados el 18 de abril. Historia clínica solicitada al dispensario militar. Audiencia fijada para el 30 de abril.",
    created_at: "2026-04-08T10:00:00Z",
    updated_at: "2026-04-18T08:00:00Z",
  },
  {
    id: "c-carlos-4",
    suscriptor_id: "s1",
    suscriptor_nombre: "Carlos Andrés Gómez",
    area: "Familia",
    titulo: "Regulación de visitas con hijos menores",
    etapa: "Conciliacion",
    etapa_index: 4,
    prioridad: "alta",
    abogado: "Dra. López",
    descripcion: "Proceso de regulación de régimen de visitas tras separación de hecho. La ex pareja impide el contacto con los dos hijos menores (8 y 11 años). Se agotó etapa de conciliación prejudicial sin acuerdo. Se presentó demanda y fue admitida.",
    fecha_limite: "2026-05-20",
    fecha_ingreso_etapa: "2026-04-14T10:00:00Z",
    fecha_audiencia: "2026-05-05",
    fecha_cierre: null,
    checklist: { "f-con-1": true, "f-con-2": false },
    notas_etapa: "Audiencia de conciliación judicial programada para el 5 de mayo. Preparar propuesta de visitas quincenales y vacaciones alternas.",
    created_at: "2026-03-15T09:00:00Z",
    updated_at: "2026-04-14T10:00:00Z",
  },
  {
    id: "c-carlos-5",
    suscriptor_id: "s1",
    suscriptor_nombre: "Carlos Andrés Gómez",
    area: "Consumidor",
    titulo: "Reclamación por descuentos no autorizados en nómina militar",
    etapa: "Reclamacion Directa",
    etapa_index: 1,
    prioridad: "normal",
    abogado: "Dr. Ramirez",
    descripcion: "Desde enero de 2026 aparecen descuentos mensuales de $180.000 por concepto de seguro de vida que el suscriptor nunca autorizó. La aseguradora alega consentimiento mediante firma digital, pero el suscriptor niega haber firmado. Se envió reclamación directa exigiendo devolución de $720.000 (4 meses).",
    fecha_limite: "2026-05-30",
    fecha_ingreso_etapa: "2026-04-20T11:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "co-rec-1": true, "co-rec-2": false },
    notas_etapa: "Reclamación directa enviada a la aseguradora el 20 de abril. Plazo de respuesta: 15 días hábiles. Se adjuntaron desprendibles de nómina y declaración juramentada.",
    created_at: "2026-04-19T10:00:00Z",
    updated_at: "2026-04-20T11:00:00Z",
  },
  // ── María Rodríguez ──
  {
    id: "c-maria-1",
    suscriptor_id: "s2",
    suscriptor_nombre: "María Fernanda Rodríguez",
    area: "Familia",
    titulo: "Demanda de alimentos para menor de edad",
    etapa: "Demanda",
    etapa_index: 2,
    prioridad: "urgente",
    abogado: "Dra. López",
    descripcion: "Demanda de fijación de cuota alimentaria para hija menor de 5 años. El padre no ha cumplido con aportes desde hace 4 meses. Se busca fijación provisional de cuota equivalente al 30% del salario.",
    fecha_limite: "2026-04-30",
    fecha_ingreso_etapa: "2026-04-08T09:00:00Z",
    fecha_audiencia: "2026-04-25",
    fecha_cierre: null,
    checklist: { "f-dem-1": true, "f-dem-2": true, "f-dem-3": false },
    notas_etapa: "Demanda radicada. Pendiente auto admisorio y notificación al demandado.",
    created_at: "2026-03-25T10:00:00Z",
    updated_at: "2026-04-08T09:00:00Z",
  },
  {
    id: "c-maria-2",
    suscriptor_id: "s2",
    suscriptor_nombre: "María Fernanda Rodríguez",
    area: "Civil",
    titulo: "Reclamación por daños en vivienda fiscal",
    etapa: "Revisión Legal",
    etapa_index: 1,
    prioridad: "normal",
    abogado: "Dr. Ramirez",
    descripcion: "Reclamación contra el Ministerio de Defensa por daños estructurales en vivienda fiscal asignada. Filtración de agua afectó enseres personales. Se busca indemnización y reparación de la vivienda.",
    fecha_limite: "2026-06-15",
    fecha_ingreso_etapa: "2026-04-16T14:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "ci-rev-1": false, "ci-rev-2": false },
    notas_etapa: "Se requiere avalúo de daños y registro fotográfico. Pendiente concepto de perito.",
    created_at: "2026-04-10T10:00:00Z",
    updated_at: "2026-04-16T14:00:00Z",
  },
  // ── Jorge Martínez ──
  {
    id: "c-jorge-1",
    suscriptor_id: "s3",
    suscriptor_nombre: "Jorge Luis Martínez",
    area: "Penal Militar",
    titulo: "Defensa en proceso por lesiones personales entre compañeros",
    etapa: "Audiencia",
    etapa_index: 3,
    prioridad: "urgente",
    abogado: "Dr. Ramirez",
    descripcion: "Proceso penal militar por presuntas lesiones personales a un compañero durante altercado en base naval. El procesado alega legítima defensa. Hay dos testigos presenciales y registro de enfermería.",
    fecha_limite: "2026-04-28",
    fecha_ingreso_etapa: "2026-04-14T08:00:00Z",
    fecha_audiencia: "2026-04-26",
    fecha_cierre: null,
    checklist: { "pm-aud-1": true, "pm-aud-2": true, "pm-aud-3": false },
    notas_etapa: "Audiencia programada para el 26 de abril. Preparar alegatos de legítima defensa con testimonios.",
    created_at: "2026-03-10T10:00:00Z",
    updated_at: "2026-04-14T08:00:00Z",
  },
  {
    id: "c-jorge-2",
    suscriptor_id: "s3",
    suscriptor_nombre: "Jorge Luis Martínez",
    area: "Consumidor",
    titulo: "Queja ante SIC por cobro abusivo de crédito militar",
    etapa: "Queja SIC",
    etapa_index: 2,
    prioridad: "normal",
    abogado: "Dr. Ramirez",
    descripcion: "Queja ante la Superintendencia de Industria y Comercio por cobro de intereses por encima de la tasa de usura en crédito de libranza militar. El banco ha cobrado $2.3M en intereses no pactados.",
    fecha_limite: "2026-05-20",
    fecha_ingreso_etapa: "2026-04-11T10:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: { "co-sic-1": true, "co-sic-2": false },
    notas_etapa: "Queja radicada ante SIC. Se adjuntaron extractos bancarios y tabla de amortización original.",
    created_at: "2026-04-02T10:00:00Z",
    updated_at: "2026-04-11T10:00:00Z",
  },
  // ── Caso cerrado (para stats) ──
  {
    id: "c-demo-cerrado",
    suscriptor_id: "477f9b02-ad4c-4ecd-a680-f9cdf0565e0d",
    suscriptor_nombre: "Cliente Demo",
    area: "Consulta",
    titulo: "Consulta sobre traslado a otra guarnición",
    etapa: "Respondida",
    etapa_index: 1,
    prioridad: "baja",
    abogado: "Dr. Ramirez",
    descripcion: "Consulta sobre requisitos y procedimiento para solicitar traslado a guarnición en Bogotá por motivos familiares.",
    fecha_limite: null,
    fecha_ingreso_etapa: "2026-03-10T09:00:00Z",
    fecha_audiencia: null,
    fecha_cierre: "2026-03-12",
    checklist: {},
    notas_etapa: "",
    respuesta: "Se orientó sobre el procedimiento de solicitud de traslado ante la Dirección de Personal. Se requiere carta motivada, soportes familiares y concepto favorable del comandante directo. Plazo: antes del 30 de abril para el ciclo de traslados del segundo semestre.",
    respondido_por: "Dr. Ramirez",
    respondido_at: "2026-03-12T15:00:00Z",
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-12T15:00:00Z",
  },
];

// ── Leads ───────────────────────────────────────────────────────
export const MOCK_LEADS: Lead[] = [];

// ── Seguimientos ────────────────────────────────────────────────
export const MOCK_SEGUIMIENTOS: Seguimiento[] = [];
