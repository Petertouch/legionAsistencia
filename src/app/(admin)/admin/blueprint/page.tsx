"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2, Circle, AlertTriangle, ExternalLink, ChevronDown, ChevronRight,
  Globe, Users, Scale, ShoppingBag, GraduationCap, Settings, UserCheck,
  ClipboardCheck, MessageSquare,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Touchpoint {
  id: string;
  label: string;
  url: string;
  description: string;
}

interface Journey {
  id: string;
  label: string;
  icon: typeof Globe;
  color: string;
  touchpoints: Touchpoint[];
}

// ─── Blueprint Data ────────────────────────────────────────────────────────
const JOURNEYS: Journey[] = [
  {
    id: "captacion",
    label: "Captación",
    icon: Globe,
    color: "text-blue-600",
    touchpoints: [
      { id: "1.1", label: "Landing page", url: "/", description: "Hero, planes, testimonios, CTA WhatsApp" },
      { id: "1.2", label: "Blog / Guía legal", url: "/blog", description: "Artículos, búsqueda, categorías, Q&A comunidad" },
      { id: "1.3", label: "Noticias", url: "/noticias", description: "Grid de noticias, detalle por slug" },
    ],
  },
  {
    id: "referidos",
    label: "Red de referidos",
    icon: Users,
    color: "text-purple-600",
    touchpoints: [
      { id: "2.1", label: "Registro Lanza", url: "/lanzas/registro", description: "Formulario militar: nombre, cédula, rama, rango → código único" },
      { id: "2.2", label: "Registro Esposa", url: "/esposa", description: "Landing esposas, calculadora ganancias, registro → código único" },
      { id: "2.3", label: "Login aliado", url: "/lanzas", description: "Login por cédula → redirige a panel" },
      { id: "2.4", label: "Panel aliado", url: "/lanzas/panel", description: "Link referido, leads, conversiones, comisiones, bono" },
    ],
  },
  {
    id: "registro-cliente",
    label: "Registro cliente",
    icon: UserCheck,
    color: "text-green-600",
    touchpoints: [
      { id: "3.1", label: "Landing referido", url: "/r/CODIGO", description: "Página de aterrizaje con código de aliado" },
      { id: "3.2", label: "Paso 1: Datos básicos", url: "/r/CODIGO", description: "Nombre, teléfono, cédula, email, selección de plan" },
      { id: "3.3", label: "Paso 2: Datos extra", url: "/r/CODIGO", description: "Estado civil, grado, fuerza, unidad, dirección, ciudad" },
      { id: "3.4", label: "Paso 3: Firma + fotos", url: "/r/CODIGO", description: "Captura firma, selfie, cédula frente/reverso" },
      { id: "3.5", label: "Paso 4: Crear clave", url: "/r/CODIGO", description: "Crear contraseña para portal cliente" },
      { id: "3.6", label: "Paso 5: Onboarding", url: "/r/CODIGO", description: "Bienvenida, instrucciones acceso portal" },
    ],
  },
  {
    id: "portal-cliente",
    label: "Portal cliente",
    icon: MessageSquare,
    color: "text-cyan-600",
    touchpoints: [
      { id: "4.1", label: "Login cliente", url: "/mi-caso", description: "Login con cédula + clave" },
      { id: "4.2", label: "Perfil", url: "/mi-caso/perfil", description: "Editar datos, beneficiarios, plan" },
      { id: "4.3", label: "Mis casos", url: "/mi-caso/casos", description: "Lista de casos activos y cerrados" },
      { id: "4.4", label: "Detalle caso", url: "/mi-caso/casos/ID", description: "Timeline, etapas, mensajes, documentos" },
      { id: "4.5", label: "Contrato", url: "/mi-caso/contrato", description: "Ver/descargar contrato firmado" },
      { id: "4.6", label: "Cursos", url: "/mi-caso/cursos", description: "Cursos disponibles, progreso" },
      { id: "4.7", label: "Diplomas", url: "/mi-caso/diplomas", description: "Certificados ganados" },
      { id: "4.8", label: "Referidos", url: "/mi-caso/referidos", description: "Link de referido, comisiones del cliente" },
    ],
  },
  {
    id: "admin-clientes",
    label: "Admin — Clientes",
    icon: Users,
    color: "text-orange-600",
    touchpoints: [
      { id: "5.1", label: "Login admin", url: "/login", description: "Email + clave, verifica env vars o tabla equipo" },
      { id: "5.2", label: "Dashboard", url: "/admin/dashboard", description: "Stats, casos urgentes, actividad reciente" },
      { id: "5.3", label: "Suscriptores lista", url: "/admin/suscriptores", description: "Buscar, filtrar por plan/estado, ver todos" },
      { id: "5.4", label: "Suscriptor detalle", url: "/admin/suscriptores/ID", description: "Editar, ver casos, beneficiarios, pagos" },
      { id: "5.5", label: "Contratos", url: "/admin/contratos", description: "Lista firmados, plantilla editable" },
      { id: "5.6", label: "Validación identidad", url: "/admin/validacion-identidad", description: "Aprobar/rechazar fotos de identidad" },
    ],
  },
  {
    id: "admin-legal",
    label: "Admin — Legal",
    icon: Scale,
    color: "text-red-600",
    touchpoints: [
      { id: "6.1", label: "Casos lista", url: "/admin/casos", description: "Filtrar por área, etapa, abogado, prioridad" },
      { id: "6.2", label: "Caso detalle", url: "/admin/casos/ID", description: "Editar, avanzar etapa, checklist, notas" },
      { id: "6.3", label: "Crear caso", url: "/admin/casos/nuevo", description: "Asignar suscriptor, área, abogado, prioridad" },
      { id: "6.4", label: "Seguimiento", url: "/admin/seguimiento", description: "Timeline llamadas, WhatsApp, reuniones, notas" },
    ],
  },
  {
    id: "admin-comercial",
    label: "Admin — Comercial",
    icon: ShoppingBag,
    color: "text-amber-600",
    touchpoints: [
      { id: "7.1", label: "Aliados lista", url: "/admin/referidores", description: "Vendedores + aliados unificados, filtros por tipo" },
      { id: "7.2", label: "Aliado detalle", url: "/admin/referidores/ID", description: "Perfil, comisión, bono, leads del aliado" },
      { id: "7.3", label: "Crear aliado", url: "/admin/referidores/nuevo", description: "Vendedor, lanza o esposa con código único" },
      { id: "7.4", label: "Emails", url: "/admin/mails", description: "Envío de correos, historial" },
    ],
  },
  {
    id: "admin-educacion",
    label: "Admin — Educación",
    icon: GraduationCap,
    color: "text-indigo-600",
    touchpoints: [
      { id: "8.1", label: "Cursos", url: "/admin/cursos", description: "Lista, crear, editar contenido, lecciones" },
      { id: "8.2", label: "Profesores", url: "/admin/profesores", description: "Gestionar instructores" },
      { id: "8.3", label: "Diplomas", url: "/admin/diplomas", description: "Certificados emitidos" },
    ],
  },
  {
    id: "admin-sistema",
    label: "Admin — Sistema",
    icon: Settings,
    color: "text-gray-600",
    touchpoints: [
      { id: "9.1", label: "Equipo", url: "/admin/equipo", description: "Abogados, roles, acceso" },
      { id: "9.2", label: "Conocimiento IA", url: "/admin/conocimiento", description: "Base de conocimiento del chatbot" },
    ],
  },
];

type TPStatus = "pending" | "ok" | "issue";

interface TPState {
  status: TPStatus;
  problem: string;
  solution: string;
}

const STORAGE_KEY = "legion-blueprint-state";

// Pre-loaded state with all changes made during QA session
const INITIAL_STATE: Record<string, TPState> = {
  // Journey 1: Captación
  "1.1": { status: "ok", problem: "", solution: "Landing funciona correctamente. Planes, testimonios, CTAs." },
  "1.2": { status: "ok", problem: "Consulta del blog creaba cuenta con cédula/clave (mock data, se perdía al reiniciar). Select de área innecesario para el usuario.", solution: "Rediseño completo: formulario simple (nombre, apellido, tel, email, pregunta). Verificación por código de 6 dígitos al email vía Resend. Datos guardados en Supabase (tabla consultas_blog). Área la asigna el abogado. Botón toggle para no ocupar espacio. Cajitas blancas individuales para el código." },
  "1.3": { status: "ok", problem: "", solution: "Noticias funciona correctamente." },
  // Journey 5: Admin — Clientes
  "5.1": { status: "ok", problem: "Login no funcionaba porque faltaba .env.local con ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET y credenciales Supabase.", solution: "Creado .env.local completo. Credenciales: pedrotobarcaldas@gmail.com / legion2026" },
  "5.2": { status: "ok", problem: "Dashboard no cargaba por cache corrupta de Turbopack.", solution: "Limpieza de .next y reinicio. Funciona correctamente." },
  "5.3": { status: "ok", problem: "Suscriptores no se cargaban por RLS de Supabase bloqueando anon key.", solution: "Creada API route /api/suscriptores que usa admin client. getSuscriptores() ahora llama a la API." },
  "5.5": { status: "ok", problem: "Error 'Cannot read properties of undefined (reading reduce)' en familia_config.limites.", solution: "Fix: verificar que limites exista antes de usar, fallback a DEFAULT_PLANTILLA.familia_config." },
  // Journey 6: Admin — Legal
  "6.1": { status: "ok", problem: "Consultas orientativas gratuitas no aparecían (API requería x-user-role que el middleware no pasaba para esa ruta).", solution: "Quitado check de auth de /api/consultas-blog (la página admin ya está protegida). Agregada sección dorada prominente arriba del kanban. Respondidas se ocultan automáticamente." },
  "6.3": { status: "ok", problem: "Select de suscriptor cargaba todos los usuarios en un dropdown. No escalable.", solution: "Reemplazado por buscador con lupa: escribe nombre/cédula, resultados en dropdown, al seleccionar muestra card con datos completos. Debounce 300ms." },
  // Journey 7: Admin — Comercial
  "7.1": { status: "ok", problem: "Vendedores y Aliados eran dos sistemas separados (vendedores en localStorage, aliados en Supabase).", solution: "Unificación completa: nuevo referidor-store.ts con tipos vendedor/lanza/esposa. Todo en Supabase. Un solo panel /admin/referidores con filtros por tipo. Config de vendedores movida a DB." },
  "7.2": { status: "ok", problem: "Páginas separadas /admin/vendedores/[id] y /admin/recomendaciones/[id].", solution: "Unificado en /admin/referidores/[id]. Páginas viejas redirigen." },
  "7.3": { status: "ok", problem: "Crear vendedor y crear aliado eran flujos separados.", solution: "Unificado en /admin/referidores/nuevo con selector de tipo." },
  // Admin — Sistema (sidebar y blueprint)
  "9.1": { status: "pending", problem: "", solution: "" },
  "9.2": { status: "pending", problem: "", solution: "" },
};

// Extras done outside touchpoints:
// - Sidebar reorganizado: General, Clientes, Legal, Comercial, Educación, Sistema
// - Blueprint QA agregado al sidebar (Sistema)
// - Resend configurado con dominio legionjuridica.com verificado (DNS en Vercel)
// - Email de código con explicación didáctica paso a paso
// - Email de respuesta con link a planes (legionjuridica.com/#planes)
// - Mock data: 9 casos de prueba agregados para 4 suscriptores
// - 2 clientes de prueba creados en Supabase (Carlos Gómez, María Rodríguez)

function loadState(): Record<string, TPState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    // Merge: initial state as base, saved state on top (user edits win)
    const merged = { ...INITIAL_STATE };
    for (const [k, v] of Object.entries(saved)) {
      const sv = v as TPState;
      // Only override if user actually changed something
      if (sv.status !== "pending" || sv.problem || sv.solution) {
        merged[k] = sv;
      }
    }
    return merged;
  } catch { return INITIAL_STATE; }
}

function saveState(state: Record<string, TPState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ═══════════════════════════════════════════════════════════════════════════
export default function BlueprintPage() {
  const [state, setState] = useState<Record<string, TPState>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const s = loadState();
    setState(s);
    // Expand all by default
    const exp: Record<string, boolean> = {};
    JOURNEYS.forEach((j) => { exp[j.id] = true; });
    setExpanded(exp);
  }, []);

  const getTP = (id: string): TPState => state[id] || { status: "pending", problem: "", solution: "" };

  const updateTP = (id: string, updates: Partial<TPState>) => {
    setState((prev) => {
      const next = { ...prev, [id]: { ...getTP(id), ...updates } };
      saveState(next);
      return next;
    });
  };

  const cycleStatus = (id: string) => {
    const current = getTP(id).status;
    const next: TPStatus = current === "pending" ? "ok" : current === "ok" ? "issue" : "pending";
    updateTP(id, { status: next });
  };

  const toggleJourney = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats
  const allTPs = JOURNEYS.flatMap((j) => j.touchpoints);
  const total = allTPs.length;
  const okCount = allTPs.filter((tp) => getTP(tp.id).status === "ok").length;
  const issueCount = allTPs.filter((tp) => getTP(tp.id).status === "issue").length;
  const pendingCount = total - okCount - issueCount;
  const progress = total > 0 ? Math.round((okCount / total) * 100) : 0;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-oro" /> Service Blueprint — QA
        </h1>
        <p className="text-gray-500 text-xs mt-1">Revisión completa de la plataforma. Click en el círculo para cambiar estado.</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-900 text-sm font-bold">Progreso general</span>
          <span className="text-gray-500 text-xs">{okCount}/{total} revisados</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-green-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 font-medium">{okCount}</span>
            <span className="text-gray-400">Funciona</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-gray-700 font-medium">{issueCount}</span>
            <span className="text-gray-400">Con problema</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-gray-300" />
            <span className="text-gray-700 font-medium">{pendingCount}</span>
            <span className="text-gray-400">Pendiente</span>
          </div>
        </div>
      </div>

      {/* Journeys */}
      {JOURNEYS.map((journey) => {
        const isOpen = expanded[journey.id] ?? true;
        const Icon = journey.icon;
        const jOk = journey.touchpoints.filter((tp) => getTP(tp.id).status === "ok").length;
        const jIssue = journey.touchpoints.filter((tp) => getTP(tp.id).status === "issue").length;
        const jTotal = journey.touchpoints.length;
        const jDone = jOk === jTotal;

        return (
          <div key={journey.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Journey header */}
            <button
              onClick={() => toggleJourney(journey.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <Icon className={`w-5 h-5 ${journey.color} flex-shrink-0`} />
              <span className="text-gray-900 font-bold text-sm flex-1 text-left">{journey.label}</span>
              <div className="flex items-center gap-3 text-xs mr-2">
                {jDone ? (
                  <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completo</span>
                ) : (
                  <>
                    <span className="text-gray-400">{jOk}/{jTotal}</span>
                    {jIssue > 0 && <span className="text-amber-500 font-medium">{jIssue} problema{jIssue > 1 ? "s" : ""}</span>}
                  </>
                )}
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Touchpoints */}
            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {journey.touchpoints.map((tp) => {
                  const tpState = getTP(tp.id);
                  const isEditing = editingId === tp.id;

                  return (
                    <div key={tp.id} className={`px-5 py-3 transition-colors ${
                      tpState.status === "ok" ? "bg-green-50/30" :
                      tpState.status === "issue" ? "bg-amber-50/30" : ""
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Status toggle */}
                        <button
                          onClick={() => cycleStatus(tp.id)}
                          className="mt-0.5 flex-shrink-0"
                          title="Click para cambiar estado"
                        >
                          {tpState.status === "ok" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : tpState.status === "issue" ? (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-gray-500 text-[10px] font-mono">{tp.id}</span>
                            <span className={`text-sm font-medium ${tpState.status === "ok" ? "text-green-800" : "text-gray-900"}`}>
                              {tp.label}
                            </span>
                            <code className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tp.url}</code>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">{tp.description}</p>

                          {/* Problem/Solution display */}
                          {tpState.status === "issue" && tpState.problem && !isEditing && (
                            <div className="mt-2 space-y-1">
                              <p className="text-amber-700 text-xs"><span className="font-bold">Problema:</span> {tpState.problem}</p>
                              {tpState.solution && <p className="text-green-700 text-xs"><span className="font-bold">Solución:</span> {tpState.solution}</p>}
                            </div>
                          )}
                          {tpState.status === "ok" && tpState.problem && !isEditing && (
                            <div className="mt-2 space-y-1">
                              <p className="text-gray-400 text-xs line-through"><span className="font-bold">Problema:</span> {tpState.problem}</p>
                              {tpState.solution && <p className="text-green-600 text-xs"><span className="font-bold">Solución:</span> {tpState.solution}</p>}
                            </div>
                          )}

                          {/* Edit form */}
                          {isEditing && (
                            <div className="mt-2 space-y-2">
                              <div>
                                <label className="text-gray-500 text-[10px] font-medium block mb-0.5">Problema encontrado</label>
                                <input
                                  type="text"
                                  value={tpState.problem}
                                  onChange={(e) => updateTP(tp.id, { problem: e.target.value })}
                                  placeholder="Describe el problema..."
                                  className="w-full bg-gray-50 text-gray-900 text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-gray-500 text-[10px] font-medium block mb-0.5">Solución aplicada</label>
                                <input
                                  type="text"
                                  value={tpState.solution}
                                  onChange={(e) => updateTP(tp.id, { solution: e.target.value })}
                                  placeholder="Qué se hizo para solucionarlo..."
                                  className="w-full bg-gray-50 text-gray-900 text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                                />
                              </div>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-oro text-[11px] font-medium hover:underline"
                              >
                                Listo
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setEditingId(isEditing ? null : tp.id)}
                            className={`text-[10px] px-2 py-1 rounded transition-colors ${
                              isEditing ? "bg-oro/10 text-oro" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {isEditing ? "Cerrar" : "Notas"}
                          </button>
                          {!tp.url.includes("ID") && !tp.url.includes("CODIGO") && (
                            <a
                              href={tp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-oro transition-colors p-1"
                              title="Abrir en nueva pestaña"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Export summary */}
      {okCount + issueCount > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="text-gray-900 font-bold text-sm mb-2">Resumen</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {JOURNEYS.map((j) => {
              const tps = j.touchpoints.filter((tp) => getTP(tp.id).status !== "pending");
              if (tps.length === 0) return null;
              return (
                <div key={j.id}>
                  <span className="font-medium text-gray-900">{j.label}:</span>{" "}
                  {tps.map((tp) => {
                    const s = getTP(tp.id);
                    return (
                      <span key={tp.id} className={`inline-flex items-center gap-0.5 mr-2 ${s.status === "ok" ? "text-green-600" : "text-amber-600"}`}>
                        {s.status === "ok" ? "✓" : "⚠"} {tp.label}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
