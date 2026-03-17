import {
  MOCK_SUSCRIPTORES, MOCK_CASOS, MOCK_LEADS, MOCK_SEGUIMIENTOS,
  type Suscriptor, type Caso, type Lead, type Seguimiento,
} from "./mock-data";
import { PIPELINES, getDaysInStage, getDaysUntilDeadline, type CaseArea } from "./pipelines";

// ── Helpers ─────────────────────────────────────────────────────
let idCounter = 100;
function nextId(prefix: string) { return `${prefix}${++idCounter}`; }
function now() { return new Date().toISOString(); }

// ── Suscriptores ────────────────────────────────────────────────
export async function getSuscriptores(params?: {
  search?: string; plan?: string; estado_pago?: string;
}): Promise<Suscriptor[]> {
  let data = [...MOCK_SUSCRIPTORES];
  if (params?.search) {
    const q = params.search.toLowerCase();
    data = data.filter((s) => s.nombre.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.telefono.includes(q));
  }
  if (params?.plan) data = data.filter((s) => s.plan === params.plan);
  if (params?.estado_pago) data = data.filter((s) => s.estado_pago === params.estado_pago);
  return data;
}

export async function getSuscriptor(id: string): Promise<Suscriptor | null> {
  return MOCK_SUSCRIPTORES.find((s) => s.id === id) || null;
}

export async function createSuscriptor(data: {
  nombre: string; telefono: string; email: string; cedula: string;
  plan: Suscriptor["plan"]; estado_pago: Suscriptor["estado_pago"];
  rama: string; rango: string; notas: string;
}): Promise<Suscriptor> {
  const s: Suscriptor = {
    id: nextId("s"),
    ...data,
    fecha_inicio: now().split("T")[0],
    created_at: now(),
    updated_at: now(),
  };
  MOCK_SUSCRIPTORES.push(s);
  return s;
}

// ── Casos ───────────────────────────────────────────────────────
export async function getCasos(params?: {
  search?: string; area?: string; etapa?: string; prioridad?: string; abogado?: string;
}): Promise<Caso[]> {
  let data = [...MOCK_CASOS];
  if (params?.search) {
    const q = params.search.toLowerCase();
    data = data.filter((c) =>
      c.titulo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      (c.suscriptor_nombre?.toLowerCase().includes(q) ?? false) ||
      c.abogado.toLowerCase().includes(q)
    );
  }
  if (params?.area) data = data.filter((c) => c.area === params.area);
  if (params?.etapa) data = data.filter((c) => c.etapa === params.etapa);
  if (params?.prioridad) data = data.filter((c) => c.prioridad === params.prioridad);
  if (params?.abogado) data = data.filter((c) => c.abogado === params.abogado);
  return data;
}

export async function getCaso(id: string): Promise<Caso | null> {
  const caso = MOCK_CASOS.find((c) => c.id === id);
  return caso ? { ...caso, checklist: { ...caso.checklist } } : null;
}

export async function createCaso(data: {
  suscriptor_id: string; area: CaseArea; titulo: string;
  prioridad: Caso["prioridad"]; abogado: string; descripcion: string;
  fecha_limite: string | null;
}): Promise<Caso> {
  const pipeline = PIPELINES[data.area];
  const suscriptor = MOCK_SUSCRIPTORES.find((s) => s.id === data.suscriptor_id);
  const c: Caso = {
    id: nextId("c"),
    suscriptor_nombre: suscriptor?.nombre,
    etapa: pipeline.stages[0].name,
    etapa_index: 0,
    fecha_ingreso_etapa: now(),
    fecha_audiencia: null,
    fecha_cierre: null,
    checklist: {},
    notas_etapa: "",
    created_at: now(),
    updated_at: now(),
    ...data,
  };
  MOCK_CASOS.push(c);
  return c;
}

export async function getCasosByPipeline(area: CaseArea): Promise<Record<string, Caso[]>> {
  const pipeline = PIPELINES[area];
  const casos = MOCK_CASOS.filter((c) => c.area === area);
  const grouped: Record<string, Caso[]> = {};
  for (const stage of pipeline.stages) {
    grouped[stage.name] = casos.filter((c) => c.etapa === stage.name).map((c) => ({ ...c, checklist: { ...c.checklist } }));
  }
  return grouped;
}

export async function advanceCaso(id: string): Promise<Caso | null> {
  const caso = MOCK_CASOS.find((c) => c.id === id);
  if (!caso) return null;
  const pipeline = PIPELINES[caso.area];
  const nextIndex = caso.etapa_index + 1;
  if (nextIndex >= pipeline.stages.length) return { ...caso };
  caso.etapa = pipeline.stages[nextIndex].name;
  caso.etapa_index = nextIndex;
  caso.fecha_ingreso_etapa = now();
  caso.checklist = {};
  caso.notas_etapa = "";
  caso.updated_at = now();
  if (pipeline.stages[nextIndex].name === "Cerrado") {
    caso.fecha_cierre = now().split("T")[0];
  }
  return { ...caso };
}


export async function revertCaso(id: string): Promise<Caso | null> {
  const caso = MOCK_CASOS.find((c) => c.id === id);
  if (!caso) return null;
  const pipeline = PIPELINES[caso.area];
  const prevIndex = caso.etapa_index - 1;
  if (prevIndex < 0) return { ...caso };
  caso.etapa = pipeline.stages[prevIndex].name;
  caso.etapa_index = prevIndex;
  caso.fecha_ingreso_etapa = now();
  caso.fecha_cierre = null;
  caso.updated_at = now();
  return { ...caso };
}

export async function moveCaso(id: string, targetStage: string, targetIndex: number): Promise<Caso | null> {
  const caso = MOCK_CASOS.find((c) => c.id === id);
  if (!caso) return null;
  caso.etapa = targetStage;
  caso.etapa_index = targetIndex;
  caso.fecha_ingreso_etapa = now();
  caso.checklist = {};
  caso.notas_etapa = "";
  caso.updated_at = now();
  if (targetStage === "Cerrado") {
    caso.fecha_cierre = now().split("T")[0];
  }
  return { ...caso };
}

export async function updateCasoChecklist(id: string, key: string, done: boolean): Promise<Caso | null> {
  const caso = MOCK_CASOS.find((c) => c.id === id);
  if (!caso) return null;
  caso.checklist[key] = done;
  caso.updated_at = now();
  return { ...caso, checklist: { ...caso.checklist } };
}

export async function getCasosBySuscriptor(suscriptorId: string): Promise<Caso[]> {
  return MOCK_CASOS.filter((c) => c.suscriptor_id === suscriptorId);
}

// ── Leads ───────────────────────────────────────────────────────
export async function getLeads(params?: {
  search?: string; fuente?: string; estado?: string;
}): Promise<Lead[]> {
  let data = [...MOCK_LEADS];
  if (params?.search) {
    const q = params.search.toLowerCase();
    data = data.filter((l) => l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.telefono.includes(q));
  }
  if (params?.fuente) data = data.filter((l) => l.fuente === params.fuente);
  if (params?.estado) data = data.filter((l) => l.estado === params.estado);
  return data;
}

export async function getLead(id: string): Promise<Lead | null> {
  return MOCK_LEADS.find((l) => l.id === id) || null;
}

export async function createLead(data: {
  nombre: string; telefono: string; email: string;
  area_interes: string; fuente: Lead["fuente"]; notas: string;
}): Promise<Lead> {
  const l: Lead = {
    id: nextId("l"),
    estado: "Nuevo",
    created_at: now(),
    updated_at: now(),
    ...data,
  };
  MOCK_LEADS.push(l);
  return l;
}

// ── Seguimientos ────────────────────────────────────────────────
export async function getSeguimientos(params?: {
  suscriptor_id?: string; caso_id?: string; lead_id?: string; tipo?: string;
}): Promise<Seguimiento[]> {
  let data = [...MOCK_SEGUIMIENTOS];
  if (params?.suscriptor_id) data = data.filter((s) => s.suscriptor_id === params.suscriptor_id);
  if (params?.caso_id) data = data.filter((s) => s.caso_id === params.caso_id);
  if (params?.lead_id) data = data.filter((s) => s.lead_id === params.lead_id);
  if (params?.tipo) data = data.filter((s) => s.tipo === params.tipo);
  return data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function createSeguimiento(data: {
  caso_id: string | null; suscriptor_id: string | null; lead_id: string | null;
  tipo: Seguimiento["tipo"]; descripcion: string;
}): Promise<Seguimiento> {
  // Resolve names for display
  const caso = data.caso_id ? MOCK_CASOS.find((c) => c.id === data.caso_id) : null;
  const suscriptor = data.suscriptor_id ? MOCK_SUSCRIPTORES.find((s) => s.id === data.suscriptor_id) : null;
  const lead = data.lead_id ? MOCK_LEADS.find((l) => l.id === data.lead_id) : null;

  const seg: Seguimiento = {
    id: nextId("seg"),
    fecha: now(),
    suscriptor_nombre: suscriptor?.nombre,
    caso_area: caso?.area,
    lead_nombre: lead?.nombre,
    created_at: now(),
    ...data,
  };
  MOCK_SEGUIMIENTOS.unshift(seg);
  return seg;
}

// ── Dashboard Stats ─────────────────────────────────────────────
export async function getDashboardStats(params?: { abogado?: string }) {
  const suscriptores = MOCK_SUSCRIPTORES;
  let casos = [...MOCK_CASOS];
  if (params?.abogado) casos = casos.filter((c) => c.abogado === params.abogado);
  const leads = MOCK_LEADS;

  const casosActivos = casos.filter((c) => c.etapa !== "Cerrado");
  const casosStale = casosActivos.filter((c) => {
    const pipeline = PIPELINES[c.area];
    const stage = pipeline.stages[c.etapa_index];
    return stage && getDaysInStage(c.fecha_ingreso_etapa) > stage.expectedDays * 2;
  });
  const casosDeadline = casosActivos.filter((c) => {
    const days = getDaysUntilDeadline(c.fecha_limite);
    return days !== null && days >= 0 && days <= 7;
  });

  return {
    totalSuscriptores: suscriptores.length,
    suscriptoresAlDia: suscriptores.filter((s) => s.estado_pago === "Al dia").length,
    casosAbiertos: casosActivos.length,
    casosStale: casosStale.length,
    casosDeadlineCerca: casosDeadline.length,
    leadsNuevos: leads.filter((l) => l.estado === "Nuevo").length,
    pagosPendientes: suscriptores.filter((s) => s.estado_pago !== "Al dia").length,
    casosPorArea: Object.entries(
      casosActivos.reduce((acc, c) => { acc[c.area] = (acc[c.area] || 0) + 1; return acc; }, {} as Record<string, number>)
    ),
    casosUrgentes: casosActivos.filter((c) => c.prioridad === "urgente" || (getDaysUntilDeadline(c.fecha_limite) !== null && getDaysUntilDeadline(c.fecha_limite)! <= 3)),
  };
}


// ── Auth: find suscriptor by cedula ─────────────────────────────
export async function findSuscriptorByCedula(cedula: string): Promise<Suscriptor | null> {
  return MOCK_SUSCRIPTORES.find((s) => s.cedula === cedula) || null;
}
