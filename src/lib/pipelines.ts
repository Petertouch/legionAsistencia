// ── Types ───────────────────────────────────────────────────────
export type CaseArea = "Penal Militar" | "Disciplinario" | "Familia" | "Civil" | "Consumidor" | "Documentos";
export type Prioridad = "urgente" | "alta" | "normal" | "baja";

export interface ChecklistItem {
  key: string;
  label: string;
  required: boolean;
}

export interface PipelineStage {
  name: string;
  checklist: ChecklistItem[];
  expectedDays: number;
  color: string; // tailwind color for column accent
}

export interface Pipeline {
  area: CaseArea;
  icon: string; // lucide icon name
  stages: PipelineStage[];
}

// ── Helpers ─────────────────────────────────────────────────────
export function getStaleLevel(
  fechaIngreso: string,
  expectedDays: number
): "fresh" | "warning" | "danger" {
  const days = Math.floor(
    (Date.now() - new Date(fechaIngreso).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days > expectedDays * 2) return "danger";
  if (days > expectedDays) return "warning";
  return "fresh";
}

export function getDaysInStage(fechaIngreso: string): number {
  return Math.floor(
    (Date.now() - new Date(fechaIngreso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getDaysUntilDeadline(fechaLimite: string | null): number | null {
  if (!fechaLimite) return null;
  return Math.ceil(
    (new Date(fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export const AREAS: CaseArea[] = [
  "Disciplinario",
  "Penal Militar",
  "Familia",
  "Civil",
  "Consumidor",
  "Documentos",
];

// ── Pipeline Definitions ────────────────────────────────────────
export const PIPELINES: Record<CaseArea, Pipeline> = {
  Disciplinario: {
    area: "Disciplinario",
    icon: "Shield",
    stages: [
      {
        name: "Recepcion",
        expectedDays: 2,
        color: "bg-blue-500",
        checklist: [
          { key: "d-rec-1", label: "Recibir documentacion del cliente", required: true },
          { key: "d-rec-2", label: "Verificar terminos legales", required: true },
          { key: "d-rec-3", label: "Asignar abogado responsable", required: true },
        ],
      },
      {
        name: "Analisis",
        expectedDays: 3,
        color: "bg-indigo-500",
        checklist: [
          { key: "d-ana-1", label: "Revisar expediente completo", required: true },
          { key: "d-ana-2", label: "Identificar cargos y normas aplicables", required: true },
          { key: "d-ana-3", label: "Evaluar pruebas existentes", required: true },
          { key: "d-ana-4", label: "Definir estrategia de defensa", required: false },
        ],
      },
      {
        name: "Descargos",
        expectedDays: 5,
        color: "bg-yellow-500",
        checklist: [
          { key: "d-des-1", label: "Redactar memorial de descargos", required: true },
          { key: "d-des-2", label: "Revision interna del memorial", required: true },
          { key: "d-des-3", label: "Firma del disciplinado", required: true },
          { key: "d-des-4", label: "Radicar descargos en termino", required: true },
        ],
      },
      {
        name: "Pruebas",
        expectedDays: 10,
        color: "bg-orange-500",
        checklist: [
          { key: "d-pru-1", label: "Solicitar pruebas a favor", required: true },
          { key: "d-pru-2", label: "Preparar testigos", required: false },
          { key: "d-pru-3", label: "Controvertir pruebas en contra", required: true },
        ],
      },
      {
        name: "Alegatos",
        expectedDays: 5,
        color: "bg-purple-500",
        checklist: [
          { key: "d-ale-1", label: "Redactar alegatos de conclusion", required: true },
          { key: "d-ale-2", label: "Radicar alegatos en termino", required: true },
        ],
      },
      {
        name: "Fallo",
        expectedDays: 15,
        color: "bg-red-500",
        checklist: [
          { key: "d-fal-1", label: "Recibir notificacion del fallo", required: true },
          { key: "d-fal-2", label: "Analizar fallo con cliente", required: true },
          { key: "d-fal-3", label: "Decidir si recurrir", required: true },
        ],
      },
      {
        name: "Recurso",
        expectedDays: 5,
        color: "bg-pink-500",
        checklist: [
          { key: "d-rec2-1", label: "Redactar recurso de apelacion", required: true },
          { key: "d-rec2-2", label: "Radicar recurso en termino", required: true },
          { key: "d-rec2-3", label: "Hacer seguimiento a segunda instancia", required: false },
        ],
      },
      {
        name: "Cerrado",
        expectedDays: 0,
        color: "bg-gray-500",
        checklist: [
          { key: "d-cer-1", label: "Archivar expediente", required: false },
          { key: "d-cer-2", label: "Informar resultado final al cliente", required: true },
        ],
      },
    ],
  },

  "Penal Militar": {
    area: "Penal Militar",
    icon: "Swords",
    stages: [
      {
        name: "Recepcion",
        expectedDays: 2,
        color: "bg-blue-500",
        checklist: [
          { key: "pm-rec-1", label: "Recibir documentacion y citacion", required: true },
          { key: "pm-rec-2", label: "Verificar competencia del juez", required: true },
          { key: "pm-rec-3", label: "Asignar abogado defensor", required: true },
        ],
      },
      {
        name: "Indagacion",
        expectedDays: 10,
        color: "bg-indigo-500",
        checklist: [
          { key: "pm-ind-1", label: "Revisar informe de hechos", required: true },
          { key: "pm-ind-2", label: "Identificar testigos", required: true },
          { key: "pm-ind-3", label: "Evaluar elementos materiales", required: true },
        ],
      },
      {
        name: "Formulacion",
        expectedDays: 5,
        color: "bg-yellow-500",
        checklist: [
          { key: "pm-for-1", label: "Asistir a audiencia de formulacion", required: true },
          { key: "pm-for-2", label: "Solicitar medidas cautelares si aplica", required: false },
          { key: "pm-for-3", label: "Revisar cargos formulados", required: true },
        ],
      },
      {
        name: "Preparatoria",
        expectedDays: 10,
        color: "bg-orange-500",
        checklist: [
          { key: "pm-pre-1", label: "Solicitar descubrimiento probatorio", required: true },
          { key: "pm-pre-2", label: "Preparar teoria del caso", required: true },
          { key: "pm-pre-3", label: "Estipular hechos no controvertidos", required: false },
        ],
      },
      {
        name: "Juicio",
        expectedDays: 15,
        color: "bg-red-500",
        checklist: [
          { key: "pm-jui-1", label: "Asistir a audiencia de juicio oral", required: true },
          { key: "pm-jui-2", label: "Presentar pruebas de defensa", required: true },
          { key: "pm-jui-3", label: "Contrainterrogar testigos", required: true },
          { key: "pm-jui-4", label: "Presentar alegatos finales", required: true },
        ],
      },
      {
        name: "Sentencia",
        expectedDays: 10,
        color: "bg-purple-500",
        checklist: [
          { key: "pm-sen-1", label: "Recibir sentencia", required: true },
          { key: "pm-sen-2", label: "Analizar sentencia con cliente", required: true },
          { key: "pm-sen-3", label: "Decidir recurso de apelacion", required: true },
        ],
      },
      {
        name: "Recurso",
        expectedDays: 5,
        color: "bg-pink-500",
        checklist: [
          { key: "pm-rec2-1", label: "Interponer recurso", required: true },
          { key: "pm-rec2-2", label: "Sustentar recurso", required: true },
        ],
      },
      {
        name: "Cerrado",
        expectedDays: 0,
        color: "bg-gray-500",
        checklist: [
          { key: "pm-cer-1", label: "Archivar expediente", required: false },
          { key: "pm-cer-2", label: "Informar resultado al cliente", required: true },
        ],
      },
    ],
  },

  Familia: {
    area: "Familia",
    icon: "Heart",
    stages: [
      {
        name: "Recepcion",
        expectedDays: 2,
        color: "bg-blue-500",
        checklist: [
          { key: "f-rec-1", label: "Entrevista inicial con cliente", required: true },
          { key: "f-rec-2", label: "Recopilar documentos (registro civil, etc)", required: true },
          { key: "f-rec-3", label: "Evaluar viabilidad del caso", required: true },
        ],
      },
      {
        name: "Demanda",
        expectedDays: 5,
        color: "bg-indigo-500",
        checklist: [
          { key: "f-dem-1", label: "Redactar demanda", required: true },
          { key: "f-dem-2", label: "Adjuntar anexos y pruebas", required: true },
          { key: "f-dem-3", label: "Presentar demanda ante juzgado", required: true },
        ],
      },
      {
        name: "Admision",
        expectedDays: 10,
        color: "bg-cyan-500",
        checklist: [
          { key: "f-adm-1", label: "Verificar auto admisorio", required: true },
          { key: "f-adm-2", label: "Subsanar si es inadmitida", required: false },
        ],
      },
      {
        name: "Notificacion",
        expectedDays: 10,
        color: "bg-yellow-500",
        checklist: [
          { key: "f-not-1", label: "Verificar notificacion al demandado", required: true },
          { key: "f-not-2", label: "Gestionar emplazamiento si necesario", required: false },
        ],
      },
      {
        name: "Conciliacion",
        expectedDays: 5,
        color: "bg-green-500",
        checklist: [
          { key: "f-con-1", label: "Preparar propuesta de conciliacion", required: true },
          { key: "f-con-2", label: "Asistir a audiencia de conciliacion", required: true },
        ],
      },
      {
        name: "Audiencia",
        expectedDays: 15,
        color: "bg-orange-500",
        checklist: [
          { key: "f-aud-1", label: "Preparar alegatos", required: true },
          { key: "f-aud-2", label: "Asistir a audiencia de pruebas", required: true },
          { key: "f-aud-3", label: "Presentar alegatos de conclusion", required: true },
        ],
      },
      {
        name: "Sentencia",
        expectedDays: 10,
        color: "bg-purple-500",
        checklist: [
          { key: "f-sen-1", label: "Recibir sentencia", required: true },
          { key: "f-sen-2", label: "Evaluar recurso si desfavorable", required: true },
        ],
      },
      {
        name: "Cerrado",
        expectedDays: 0,
        color: "bg-gray-500",
        checklist: [
          { key: "f-cer-1", label: "Archivar expediente", required: false },
          { key: "f-cer-2", label: "Informar resultado al cliente", required: true },
        ],
      },
    ],
  },

  Civil: {
    area: "Civil",
    icon: "Building",
    stages: [
      {
        name: "Recepcion",
        expectedDays: 2,
        color: "bg-blue-500",
        checklist: [
          { key: "ci-rec-1", label: "Revisar documentacion del caso", required: true },
          { key: "ci-rec-2", label: "Evaluar pretensiones y cuantia", required: true },
        ],
      },
      {
        name: "Demanda",
        expectedDays: 5,
        color: "bg-indigo-500",
        checklist: [
          { key: "ci-dem-1", label: "Redactar demanda", required: true },
          { key: "ci-dem-2", label: "Presentar ante juzgado competente", required: true },
        ],
      },
      {
        name: "Admision",
        expectedDays: 10,
        color: "bg-cyan-500",
        checklist: [
          { key: "ci-adm-1", label: "Verificar auto admisorio", required: true },
          { key: "ci-adm-2", label: "Subsanar si es inadmitida", required: false },
        ],
      },
      {
        name: "Contestacion",
        expectedDays: 10,
        color: "bg-yellow-500",
        checklist: [
          { key: "ci-con-1", label: "Revisar contestacion de la contraparte", required: true },
          { key: "ci-con-2", label: "Preparar replica si aplica", required: false },
        ],
      },
      {
        name: "Audiencia Inicial",
        expectedDays: 10,
        color: "bg-orange-500",
        checklist: [
          { key: "ci-aui-1", label: "Asistir a audiencia inicial", required: true },
          { key: "ci-aui-2", label: "Fijar hechos y pretensiones", required: true },
          { key: "ci-aui-3", label: "Decretar pruebas", required: true },
        ],
      },
      {
        name: "Instruccion",
        expectedDays: 15,
        color: "bg-red-500",
        checklist: [
          { key: "ci-ins-1", label: "Practicar pruebas decretadas", required: true },
          { key: "ci-ins-2", label: "Presentar alegatos", required: true },
        ],
      },
      {
        name: "Sentencia",
        expectedDays: 10,
        color: "bg-purple-500",
        checklist: [
          { key: "ci-sen-1", label: "Recibir sentencia", required: true },
          { key: "ci-sen-2", label: "Evaluar recurso", required: true },
        ],
      },
      {
        name: "Cerrado",
        expectedDays: 0,
        color: "bg-gray-500",
        checklist: [
          { key: "ci-cer-1", label: "Archivar expediente", required: false },
          { key: "ci-cer-2", label: "Informar resultado al cliente", required: true },
        ],
      },
    ],
  },

  Consumidor: {
    area: "Consumidor",
    icon: "ShoppingCart",
    stages: [
      {
        name: "Recepcion",
        expectedDays: 2,
        color: "bg-blue-500",
        checklist: [
          { key: "co-rec-1", label: "Documentar el problema del consumidor", required: true },
          { key: "co-rec-2", label: "Reunir facturas y soportes", required: true },
        ],
      },
      {
        name: "Reclamacion",
        expectedDays: 3,
        color: "bg-indigo-500",
        checklist: [
          { key: "co-rcl-1", label: "Redactar reclamacion ante empresa", required: true },
          { key: "co-rcl-2", label: "Radicar reclamacion", required: true },
        ],
      },
      {
        name: "Respuesta Empresa",
        expectedDays: 15,
        color: "bg-yellow-500",
        checklist: [
          { key: "co-res-1", label: "Verificar respuesta de la empresa", required: true },
          { key: "co-res-2", label: "Evaluar si la respuesta es satisfactoria", required: true },
        ],
      },
      {
        name: "Queja SIC",
        expectedDays: 5,
        color: "bg-orange-500",
        checklist: [
          { key: "co-sic-1", label: "Redactar queja ante la SIC", required: true },
          { key: "co-sic-2", label: "Radicar queja con soportes", required: true },
        ],
      },
      {
        name: "Audiencia",
        expectedDays: 15,
        color: "bg-red-500",
        checklist: [
          { key: "co-aud-1", label: "Preparar argumentos para audiencia", required: true },
          { key: "co-aud-2", label: "Asistir a audiencia virtual/presencial", required: true },
        ],
      },
      {
        name: "Resolucion",
        expectedDays: 10,
        color: "bg-purple-500",
        checklist: [
          { key: "co-rl-1", label: "Recibir resolucion", required: true },
          { key: "co-rl-2", label: "Verificar cumplimiento de la orden", required: true },
        ],
      },
      {
        name: "Cerrado",
        expectedDays: 0,
        color: "bg-gray-500",
        checklist: [
          { key: "co-cer-1", label: "Archivar caso", required: false },
          { key: "co-cer-2", label: "Informar resultado al cliente", required: true },
        ],
      },
    ],
  },

  Documentos: {
    area: "Documentos",
    icon: "FileText",
    stages: [
      {
        name: "Solicitud",
        expectedDays: 1,
        color: "bg-blue-500",
        checklist: [
          { key: "doc-sol-1", label: "Recibir solicitud del cliente", required: true },
          { key: "doc-sol-2", label: "Identificar tipo de documento", required: true },
        ],
      },
      {
        name: "Redaccion",
        expectedDays: 2,
        color: "bg-indigo-500",
        checklist: [
          { key: "doc-red-1", label: "Redactar documento", required: true },
          { key: "doc-red-2", label: "Incluir fundamentos legales", required: true },
        ],
      },
      {
        name: "Revision",
        expectedDays: 1,
        color: "bg-yellow-500",
        checklist: [
          { key: "doc-rev-1", label: "Revision de calidad interna", required: true },
          { key: "doc-rev-2", label: "Aprobacion del cliente", required: false },
        ],
      },
      {
        name: "Radicacion",
        expectedDays: 1,
        color: "bg-green-500",
        checklist: [
          { key: "doc-rad-1", label: "Radicar documento ante entidad", required: true },
          { key: "doc-rad-2", label: "Guardar comprobante de radicacion", required: true },
        ],
      },
      {
        name: "Seguimiento",
        expectedDays: 10,
        color: "bg-orange-500",
        checklist: [
          { key: "doc-seg-1", label: "Verificar respuesta de la entidad", required: true },
          { key: "doc-seg-2", label: "Interponer insistencia si no responden", required: false },
        ],
      },
      {
        name: "Respuesta",
        expectedDays: 3,
        color: "bg-purple-500",
        checklist: [
          { key: "doc-rsp-1", label: "Analizar respuesta recibida", required: true },
          { key: "doc-rsp-2", label: "Informar al cliente", required: true },
          { key: "doc-rsp-3", label: "Evaluar accion adicional si aplica", required: false },
        ],
      },
      {
        name: "Cerrado",
        expectedDays: 0,
        color: "bg-gray-500",
        checklist: [
          { key: "doc-cer-1", label: "Archivar documento y respuesta", required: false },
        ],
      },
    ],
  },
};
