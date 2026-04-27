import {
  MOCK_SUSCRIPTORES, MOCK_CASOS, MOCK_LEADS, MOCK_SEGUIMIENTOS, MOCK_DOCUMENTOS,
  type Suscriptor, type Caso, type Lead, type Seguimiento, type DocumentoContrato,
} from "./mock-data";
import { PIPELINES, getDaysInStage, getDaysUntilDeadline, type CaseArea } from "./pipelines";
import { createClient } from "./supabase/client";
// Send case notification email — resolves suscriptor email server-side
async function sendCasoEmail(slug: string, suscriptorId: string, variables: Record<string, string>) {
  try {
    await fetch("/api/mail/caso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, suscriptor_id: suscriptorId, variables }),
    });
  } catch { /* silent */ }
}

// ── Helpers ─────────────────────────────────────────────────────
let idCounter = 100;
function nextId(prefix: string) { return `${prefix}${++idCounter}`; }
function now() { return new Date().toISOString(); }

// ── Suscriptores ────────────────────────────────────────────────
export async function getSuscriptores(params?: {
  search?: string; plan?: string; estado_pago?: string; orderBy?: "created_at" | "updated_at";
}): Promise<Suscriptor[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.plan) qs.set("plan", params.plan);
  if (params?.estado_pago) qs.set("estado_pago", params.estado_pago);
  if (params?.orderBy) qs.set("orderBy", params.orderBy);
  const url = `/api/suscriptores${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url);
  const data = res.ok ? await res.json() : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((s: any) => ({
    ...s,
    fecha_inicio: (s.fecha_inicio as string)?.split("T")[0] || "",
    created_at: s.created_at || "",
    updated_at: s.updated_at || "",
  })) as Suscriptor[];
}

export async function getSuscriptor(id: string): Promise<Suscriptor | null> {
  const supabase = createClient();
  const { data } = await supabase.from("suscriptores").select("*").eq("id", id).single();
  if (!data) return null;
  return { ...data, fecha_inicio: data.fecha_inicio?.split("T")[0] || "", created_at: data.created_at || "", updated_at: data.updated_at || "" } as Suscriptor;
}

export async function createSuscriptor(data: {
  nombre: string; telefono: string; email: string; cedula: string;
  plan: Suscriptor["plan"]; estado_pago: Suscriptor["estado_pago"];
  rama: string; rango: string; notas: string;
}): Promise<Suscriptor> {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("suscriptores").insert(data).select().single();
  if (error) throw error;
  return { ...row, fecha_inicio: row.fecha_inicio?.split("T")[0] || "", created_at: row.created_at || "", updated_at: row.updated_at || "" } as Suscriptor;
}

export async function updateSuscriptor(id: string, updates: Partial<Suscriptor>): Promise<Suscriptor> {
  const res = await fetch(`/api/suscriptores/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error al actualizar suscriptor");
  }

  const row = await res.json();
  return { ...row, fecha_inicio: row.fecha_inicio?.split("T")[0] || "", created_at: row.created_at || "", updated_at: row.updated_at || "" } as Suscriptor;
}

// ── Casos (Supabase via API) ────────────────────────────────────
export async function getCasos(params?: {
  search?: string; area?: string; etapa?: string; prioridad?: string; abogado?: string;
}): Promise<Caso[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.area) qs.set("area", params.area);
  if (params?.etapa) qs.set("etapa", params.etapa);
  if (params?.prioridad) qs.set("prioridad", params.prioridad);
  if (params?.abogado) qs.set("abogado", params.abogado);
  const res = await fetch(`/api/casos${qs.toString() ? `?${qs}` : ""}`);
  return res.ok ? await res.json() : [];
}

export async function getCaso(id: string): Promise<Caso | null> {
  const res = await fetch(`/api/casos/${id}`);
  return res.ok ? await res.json() : null;
}

export async function createCaso(data: {
  suscriptor_id: string; area: CaseArea; titulo: string;
  prioridad: Caso["prioridad"]; abogado: string; descripcion: string;
  fecha_limite: string | null;
}): Promise<Caso> {
  const pipeline = PIPELINES[data.area];
  const res = await fetch("/api/casos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      etapa: pipeline.stages[0].name,
      etapa_index: 0,
    }),
  });
  const caso = await res.json();

  // Send "caso creado" email
  sendCasoEmail("caso-creado", data.suscriptor_id, {
    nombre: "",
    titulo_caso: data.titulo,
    area: data.area,
    abogado: data.abogado,
    fecha: new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
  });

  return caso;
}

export async function getCasosByPipeline(area: CaseArea): Promise<Record<string, Caso[]>> {
  const pipeline = PIPELINES[area];
  const res = await fetch(`/api/casos?area=${encodeURIComponent(area)}`);
  const casos: Caso[] = res.ok ? await res.json() : [];
  const grouped: Record<string, Caso[]> = {};
  for (const stage of pipeline.stages) {
    grouped[stage.name] = casos.filter((c) => c.etapa === stage.name);
  }
  return grouped;
}

export async function advanceCaso(id: string): Promise<Caso | null> {
  const caso = await getCaso(id);
  if (!caso) return null;
  const pipeline = PIPELINES[caso.area as CaseArea];
  if (!pipeline) return caso;
  const nextIndex = caso.etapa_index + 1;
  if (nextIndex >= pipeline.stages.length) return caso;
  const etapaAnterior = caso.etapa;
  const isCerrado = pipeline.stages[nextIndex].name === "Cerrado";

  const res = await fetch("/api/casos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      etapa: pipeline.stages[nextIndex].name,
      etapa_index: nextIndex,
      fecha_ingreso_etapa: now(),
      checklist: {},
      notas_etapa: "",
      ...(isCerrado ? { fecha_cierre: now().split("T")[0] } : {}),
    }),
  });
  const updated = res.ok ? await res.json() : caso;

  // Send email
  const slug = isCerrado ? "caso-cerrado" : "caso-avanzo";
  sendCasoEmail(slug, caso.suscriptor_id, {
    nombre: "",
    titulo_caso: caso.titulo,
    area: caso.area,
    abogado: caso.abogado,
    etapa: pipeline.stages[nextIndex].name,
    etapa_anterior: etapaAnterior,
    fecha: new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
  });

  return updated;
}

export async function revertCaso(id: string): Promise<Caso | null> {
  const caso = await getCaso(id);
  if (!caso) return null;
  const pipeline = PIPELINES[caso.area as CaseArea];
  if (!pipeline) return caso;
  const prevIndex = caso.etapa_index - 1;
  if (prevIndex < 0) return caso;

  const res = await fetch("/api/casos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      etapa: pipeline.stages[prevIndex].name,
      etapa_index: prevIndex,
      fecha_ingreso_etapa: now(),
      fecha_cierre: null,
    }),
  });
  return res.ok ? await res.json() : caso;
}

export async function moveCaso(id: string, targetStage: string, targetIndex: number): Promise<Caso | null> {
  const caso = await getCaso(id);
  if (!caso) return null;
  const etapaAnterior = caso.etapa;
  const isCerrado = targetStage === "Cerrado";

  const res = await fetch("/api/casos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      etapa: targetStage,
      etapa_index: targetIndex,
      fecha_ingreso_etapa: now(),
      checklist: {},
      notas_etapa: "",
      ...(isCerrado ? { fecha_cierre: now().split("T")[0] } : {}),
    }),
  });
  const updated = res.ok ? await res.json() : caso;

  if (etapaAnterior !== targetStage) {
    const slug = isCerrado ? "caso-cerrado" : "caso-avanzo";
    sendCasoEmail(slug, caso.suscriptor_id, {
      nombre: "",
      titulo_caso: caso.titulo,
      area: caso.area,
      abogado: caso.abogado,
      etapa: targetStage,
      etapa_anterior: etapaAnterior,
      fecha: new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
    });
  }
  return updated;
}

export async function updateCasoChecklist(id: string, key: string, done: boolean): Promise<Caso | null> {
  const caso = await getCaso(id);
  if (!caso) return null;
  const checklist = { ...(caso.checklist || {}), [key]: done };
  const res = await fetch("/api/casos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, checklist }),
  });
  return res.ok ? await res.json() : caso;
}

export async function getCasosBySuscriptor(suscriptorId: string): Promise<Caso[]> {
  const res = await fetch(`/api/casos?suscriptor_id=${suscriptorId}`);
  return res.ok ? await res.json() : [];
}

export async function respondConsulta(id: string, respuesta: string, abogado: string): Promise<Caso | null> {
  const caso = await getCaso(id);
  if (!caso) return null;
  const pipeline = PIPELINES[caso.area as CaseArea];
  const respondidaIndex = pipeline?.stages.findIndex((s) => s.name === "Respondida") ?? -1;

  const updates: Record<string, unknown> = { id, respuesta, respondido_por: abogado, respondido_at: now() };
  if (respondidaIndex >= 0) {
    updates.etapa = "Respondida";
    updates.etapa_index = respondidaIndex;
    updates.fecha_ingreso_etapa = now();
  }

  const res = await fetch("/api/casos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.ok ? await res.json() : caso;
}

export async function deleteConsultaRespuesta(id: string): Promise<Caso | null> {
  const res = await fetch("/api/casos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      respuesta: null,
      respondido_por: null,
      respondido_at: null,
      etapa: "Pendiente",
      etapa_index: 0,
      fecha_ingreso_etapa: now(),
    }),
  });
  return res.ok ? await res.json() : null;
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
  const supabase = createClient();
  const { data: suscriptoresData } = await supabase.from("suscriptores").select("id, estado_pago");
  const suscriptores = (suscriptoresData || []) as { id: string; estado_pago: string }[];
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


// ── Documentos de contrato ───────────────────────────────────────
export async function getDocumentosBySuscriptor(suscriptorId: string): Promise<DocumentoContrato[]> {
  return MOCK_DOCUMENTOS.filter((d) => d.suscriptor_id === suscriptorId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getDocumentosByCaso(casoId: string): Promise<DocumentoContrato[]> {
  return MOCK_DOCUMENTOS.filter((d) => d.caso_id === casoId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createDocumento(data: {
  suscriptor_id: string;
  nombre: string;
  tipo: DocumentoContrato["tipo"];
  archivo_url: string;
  tamano: string;
  subido_por: string;
}): Promise<DocumentoContrato> {
  const doc: DocumentoContrato = {
    id: nextId("doc"),
    created_at: now(),
    ...data,
  };
  MOCK_DOCUMENTOS.push(doc);
  return doc;
}

export async function deleteDocumento(id: string): Promise<boolean> {
  const idx = MOCK_DOCUMENTOS.findIndex((d) => d.id === id);
  if (idx < 0) return false;
  MOCK_DOCUMENTOS.splice(idx, 1);
  return true;
}

// ── Auth: find suscriptor by cedula ─────────────────────────────
export async function findSuscriptorByCedula(cedula: string): Promise<Suscriptor | null> {
  const supabase = createClient();
  const { data } = await supabase.from("suscriptores").select("*").eq("cedula", cedula).single();
  if (!data) return null;
  return { ...data, fecha_inicio: (data.fecha_inicio as string)?.split("T")[0] || "", created_at: data.created_at || "", updated_at: data.updated_at || "" } as Suscriptor;
}
