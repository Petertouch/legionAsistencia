"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { PIPELINES, getDaysInStage, getDaysUntilDeadline, getStaleLevel } from "@/lib/pipelines";
import {
  ArrowLeft, Scale, CheckCircle2, FileText, Clock, AlertTriangle, CalendarClock,
  Briefcase, Layers, Activity, HelpCircle, MessageSquare,
} from "lucide-react";

interface CasoAsignado {
  id: string; titulo: string; area: string; etapa: string; etapa_index: number;
  prioridad: string; fecha_limite: string | null; fecha_ingreso_etapa: string;
  created_at: string; updated_at: string; suscriptor_nombre: string | null;
}
interface Respondido { id: string; titulo: string; area: string; suscriptor_nombre: string | null; respondido_at: string | null; }
interface Documento { id: string; nombre: string; caso_id: string | null; created_at: string; }
interface ConsultaGratuita { id: string; nombre: string; apellido: string; area: string; pregunta: string; respondido_at: string | null; }
interface LogEntry { id: string; tipo: string; detalle: string | null; caso_id: string | null; created_at: string; }

const TIPO_LABEL: Record<string, string> = {
  vio_caso: "Abrió un caso",
  avanzo_etapa: "Avanzó de etapa",
  devolvio_etapa: "Devolvió de etapa",
  cerro_caso: "Cerró el caso",
  movio_caso: "Movió el caso",
  marco_checklist: "Marcó checklist",
  respondio_consulta: "Respondió consulta",
  respondio_consulta_gratuita: "Respondió consulta gratuita",
  subio_documento: "Subió documento",
  reasigno_abogado: "Reasignó abogado",
  agrego_nota: "Agregó nota",
  envio_mensaje: "Envió un mensaje",
};

type Periodo = "hoy" | "semana" | "mes" | "todo";
const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "7 días" },
  { id: "mes", label: "30 días" },
  { id: "todo", label: "Todo" },
];
function periodStart(p: Periodo): number {
  if (p === "todo") return 0;
  if (p === "hoy") { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  return Date.now() - (p === "semana" ? 7 : 30) * 86400000;
}

interface ActividadData {
  miembro: { id: string; nombre: string; role: string; estado: string; max_casos: number; especialidad: string; fecha_ingreso: string };
  asignados: CasoAsignado[];
  respondidos: Respondido[];
  documentos: Documento[];
  consultas_gratuitas: ConsultaGratuita[];
}

function fmt(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ActividadAbogadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ActividadData | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    fetch(`/api/equipo/${id}/actividad`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    fetch(`/api/actividad?actor_id=${id}&limit=200`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLog(Array.isArray(d) ? d : []))
      .catch(() => setLog([]));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-oro/30 border-t-oro rounded-full animate-spin" /></div>;
  if (!data || !data.miembro) return (
    <div className="text-center py-12">
      <p className="text-gray-400">Miembro no encontrado</p>
      <Link href="/admin/equipo" className="text-oro text-sm mt-2 inline-block hover:underline">← Volver</Link>
    </div>
  );

  const { miembro, asignados, respondidos, documentos, consultas_gratuitas } = data;
  const activos = asignados.filter((c) => c.etapa !== "Cerrado");
  const cerrados = asignados.filter((c) => c.etapa === "Cerrado");

  // Actividad filtrada por periodo (para "qué hizo hoy / esta semana")
  const desde = periodStart(periodo);
  const logPeriodo = log.filter((l) => new Date(l.created_at).getTime() >= desde);
  const resumenTipos: Record<string, number> = {};
  for (const l of logPeriodo) resumenTipos[l.tipo] = (resumenTipos[l.tipo] || 0) + 1;
  const resumenOrdenado = Object.entries(resumenTipos).sort((a, b) => b[1] - a[1]);
  const consultasPeriodo = (consultas_gratuitas || []).filter((c) => c.respondido_at && new Date(c.respondido_at).getTime() >= desde);
  const periodoLabel = PERIODOS.find((p) => p.id === periodo)?.label || "";

  // Alertas
  const vencidos = activos.filter((c) => { const d = getDaysUntilDeadline(c.fecha_limite); return d !== null && d < 0; });
  const proximos = activos.filter((c) => { const d = getDaysUntilDeadline(c.fecha_limite); return d !== null && d >= 0 && d <= 3; });
  const estancados = activos.filter((c) => {
    const stage = PIPELINES[c.area as keyof typeof PIPELINES]?.stages[c.etapa_index];
    return stage && getStaleLevel(c.fecha_ingreso_etapa, stage.expectedDays) === "danger";
  });

  // Distribuciones
  const porEtapa: Record<string, number> = {};
  const porArea: Record<string, number> = {};
  for (const c of activos) {
    porEtapa[c.etapa] = (porEtapa[c.etapa] || 0) + 1;
    porArea[c.area] = (porArea[c.area] || 0) + 1;
  }

  const carga = miembro.max_casos > 0 ? Math.round((activos.length / miembro.max_casos) * 100) : 0;
  const ahora = Date.now();
  const acciones7d = log.filter((l) => ahora - new Date(l.created_at).getTime() < 7 * 24 * 3600 * 1000).length;
  const ultimaActividad = log[0]?.created_at;

  const kpis = [
    { label: "Acciones (7 días)", value: acciones7d, icon: Activity, color: "text-oro" },
    { label: "Última actividad", value: ultimaActividad ? fmtDateTime(ultimaActividad) : "—", icon: Clock, color: "text-gray-600" },
    { label: "Casos asignados", value: asignados.length, icon: Briefcase, color: "text-oro" },
    { label: "Activos", value: activos.length, icon: Scale, color: "text-blue-600" },
    { label: "Cerrados", value: cerrados.length, icon: CheckCircle2, color: "text-green-600" },
    { label: "Consultas (casos)", value: respondidos.length, icon: MessageSquare, color: "text-purple-600" },
    { label: "Consultas gratis", value: (consultas_gratuitas || []).length, icon: HelpCircle, color: "text-purple-600" },
    { label: "Documentos subidos", value: documentos.length, icon: FileText, color: "text-gray-600" },
    { label: "Carga", value: miembro.max_casos > 0 ? `${activos.length}/${miembro.max_casos}` : `${activos.length}`, icon: Layers, color: carga > 100 ? "text-red-600" : "text-gray-600" },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href={`/admin/equipo/${id}`} className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {miembro.nombre}
      </Link>

      <div>
        <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-oro" /> Actividad — {miembro.nombre}
        </h1>
        <p className="text-gray-500 text-xs mt-1 capitalize">{miembro.role} · {miembro.estado} · desde {fmt(miembro.fecha_ingreso)}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="flex items-center gap-3">
            <k.icon className={`w-5 h-5 flex-shrink-0 ${k.color}`} />
            <div className="min-w-0">
              <p className="text-gray-400 text-[10px]">{k.label}</p>
              <p className="text-gray-900 text-lg font-bold">{k.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Trabajo del abogado por periodo */}
      <Card>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-oro" /> Qué hizo el abogado</h3>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {PERIODOS.map((p) => (
              <button key={p.id} onClick={() => { setPeriodo(p.id); setVisibleCount(15); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${periodo === p.id ? "bg-white text-oro shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {logPeriodo.length === 0 ? (
          <p className="text-gray-400 text-sm py-3">Sin actividad registrada en este periodo. {periodo !== "todo" && "Prueba con un rango mayor."}</p>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-3"><strong className="text-gray-900">{logPeriodo.length}</strong> acciones en los últimos {periodoLabel.toLowerCase()}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {resumenOrdenado.map(([tipo, n]) => (
                <div key={tipo} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <p className="text-gray-900 text-lg font-bold leading-none">{n}</p>
                  <p className="text-gray-500 text-[10px] mt-1">{TIPO_LABEL[tipo] || tipo}</p>
                </div>
              ))}
            </div>
            <div className="relative pl-5 space-y-3 border-t border-gray-100 pt-3">
              <div className="absolute left-1.5 top-5 bottom-2 w-px bg-gray-100" />
              {logPeriodo.slice(0, visibleCount).map((l) => (
                <div key={l.id} className="relative flex items-start gap-2">
                  <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full border-2 border-oro bg-white" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 text-sm">
                      <span className="font-medium">{TIPO_LABEL[l.tipo] || l.tipo}</span>
                      {l.detalle && <span className="text-gray-500"> · {l.detalle}</span>}
                      {l.caso_id && <Link href={`/admin/casos/${l.caso_id}`} className="text-oro text-xs ml-1 hover:underline">ver caso</Link>}
                    </p>
                    <p className="text-gray-400 text-[11px]">{new Date(l.created_at).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
            {logPeriodo.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((n) => n + 15)}
                className="mt-3 w-full text-center text-oro hover:text-oro/80 text-xs font-medium py-2 rounded-lg border border-oro/20 hover:bg-amber-50 transition-colors"
              >
                Cargar más ({logPeriodo.length - visibleCount} restantes)
              </button>
            )}
          </>
        )}
      </Card>

      {/* Consultas gratuitas del blog respondidas */}
      {(consultas_gratuitas || []).length > 0 && (
        <Card>
          <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-600" /> Consultas gratuitas respondidas ({consultas_gratuitas.length})
            {periodo !== "todo" && consultasPeriodo.length > 0 && <span className="text-purple-600 text-[11px] font-normal">· {consultasPeriodo.length} en {periodoLabel.toLowerCase()}</span>}
          </h3>
          <div className="space-y-1.5">
            {consultas_gratuitas.slice(0, 15).map((c) => (
              <div key={c.id} className="p-2.5 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-900 text-sm font-medium truncate">{c.nombre} {c.apellido}</span>
                  <span className="text-gray-400 text-[11px] flex-shrink-0">{fmt(c.respondido_at)}</span>
                </div>
                <p className="text-gray-500 text-xs truncate">{c.area} · {c.pregunta}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alertas */}
      {(vencidos.length > 0 || proximos.length > 0 || estancados.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className={`flex items-center gap-3 ${vencidos.length ? "border-red-200 bg-red-50" : ""}`}>
            <AlertTriangle className={`w-5 h-5 ${vencidos.length ? "text-red-600" : "text-gray-300"}`} />
            <div><p className="text-gray-500 text-[10px]">Deadlines vencidos</p><p className="text-gray-900 font-bold">{vencidos.length}</p></div>
          </Card>
          <Card className={`flex items-center gap-3 ${proximos.length ? "border-amber-200 bg-amber-50" : ""}`}>
            <CalendarClock className={`w-5 h-5 ${proximos.length ? "text-amber-600" : "text-gray-300"}`} />
            <div><p className="text-gray-500 text-[10px]">Deadlines ≤ 3 días</p><p className="text-gray-900 font-bold">{proximos.length}</p></div>
          </Card>
          <Card className={`flex items-center gap-3 ${estancados.length ? "border-orange-200 bg-orange-50" : ""}`}>
            <Clock className={`w-5 h-5 ${estancados.length ? "text-orange-600" : "text-gray-300"}`} />
            <div><p className="text-gray-500 text-[10px]">Casos estancados</p><p className="text-gray-900 font-bold">{estancados.length}</p></div>
          </Card>
        </div>
      )}

      {/* Distribuciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <h3 className="text-gray-900 font-bold text-sm mb-3">Casos activos por etapa</h3>
          {Object.keys(porEtapa).length === 0 ? <p className="text-gray-400 text-sm">Sin casos activos</p> : (
            <div className="space-y-1.5">
              {Object.entries(porEtapa).map(([etapa, n]) => (
                <div key={etapa} className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs w-28 truncate">{etapa}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-oro rounded-full" style={{ width: `${(n / activos.length) * 100}%` }} />
                  </div>
                  <span className="text-gray-500 text-xs w-5 text-right">{n}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-gray-900 font-bold text-sm mb-3">Casos activos por área</h3>
          {Object.keys(porArea).length === 0 ? <p className="text-gray-400 text-sm">Sin casos activos</p> : (
            <div className="space-y-1.5">
              {Object.entries(porArea).map(([area, n]) => (
                <div key={area} className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs w-28 truncate">{area}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(n / activos.length) * 100}%` }} />
                  </div>
                  <span className="text-gray-500 text-xs w-5 text-right">{n}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Casos asignados */}
      <Card>
        <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-oro" /> Casos asignados ({asignados.length})</h3>
        {asignados.length === 0 ? <p className="text-gray-400 text-sm">Sin casos asignados</p> : (
          <div className="space-y-1.5">
            {asignados.map((c) => {
              const dEtapa = getDaysInStage(c.fecha_ingreso_etapa);
              const dDeadline = getDaysUntilDeadline(c.fecha_limite);
              return (
                <Link key={c.id} href={`/admin/casos/${c.id}`} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{c.titulo}</p>
                    <p className="text-gray-400 text-xs">{c.area} · {c.suscriptor_nombre || "—"}</p>
                  </div>
                  <Badge variant="neutral" size="xs">{c.etapa}</Badge>
                  <span className="text-gray-400 text-[11px] hidden sm:inline w-16 text-right">{dEtapa}d en etapa</span>
                  {dDeadline !== null && (
                    <span className={`text-[11px] w-12 text-right ${dDeadline < 0 ? "text-red-600 font-bold" : dDeadline <= 3 ? "text-amber-600" : "text-gray-400"}`}>
                      {dDeadline < 0 ? `${Math.abs(dDeadline)}d tarde` : `${dDeadline}d`}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Consultas respondidas */}
      {respondidos.length > 0 && (
        <Card>
          <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-600" /> Consultas respondidas ({respondidos.length})</h3>
          <div className="space-y-1.5">
            {respondidos.slice(0, 15).map((r) => (
              <Link key={r.id} href={`/admin/casos/${r.id}`} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                <div className="min-w-0"><p className="text-gray-900 text-sm truncate">{r.titulo}</p><p className="text-gray-400 text-xs">{r.area} · {r.suscriptor_nombre || "—"}</p></div>
                <span className="text-gray-400 text-[11px] flex-shrink-0">{fmt(r.respondido_at)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Documentos subidos */}
      {documentos.length > 0 && (
        <Card>
          <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" /> Documentos subidos ({documentos.length})</h3>
          <div className="space-y-1.5">
            {documentos.slice(0, 15).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 text-sm truncate">{d.nombre}</span>
                  {d.caso_id && <Link href={`/admin/casos/${d.caso_id}`} className="text-oro text-[11px] hover:underline flex-shrink-0">ver caso</Link>}
                </div>
                <span className="text-gray-400 text-[11px] flex-shrink-0">{fmt(d.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
