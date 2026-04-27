"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getComisionesPorTipo, getComisionForAliado } from "@/lib/config";
import { toast } from "sonner";
import {
  Copy, Users, Phone, DollarSign, Share2, LogOut, Award,
  Heart, Shield, Sparkles, Clock, MessageCircle, X, Check, RotateCcw, ArrowRight,
} from "lucide-react";

interface Lanza {
  id: string;
  code: string;
  nombre: string;
  tipo: string;
  comision_personalizada: number | null;
  meta_bono: number | null;
  monto_bono: number | null;
  bono_pagado_at: string | null;
}

type LeadStatus =
  | "nuevo"
  | "en_proceso"
  | "contactado"
  | "convertido"
  | "completado"
  | "perdido"
  | "descartado"
  | "abandonado";

interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  cedula: string | null;
  area_interes: string;
  plan_interes: string | null;
  status: LeadStatus;
  current_step: number | null;
  last_activity_at: string | null;
  created_at: string;
}

const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  en_proceso: { label: "En proceso", color: "bg-blue-50 text-blue-700 border-blue-200" },
  contactado: { label: "Contactado", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  convertido: { label: "Convertido", color: "bg-green-50 text-green-700 border-green-200" },
  completado: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200" },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200" },
  descartado: { label: "Descartado", color: "bg-gray-100 text-gray-500 border-gray-200" },
  abandonado: { label: "Abandonado", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

// Agrupa los status semánticamente para las secciones del panel
const STATUS_GROUPS = {
  enProceso: ["nuevo", "en_proceso", "contactado"] as LeadStatus[],
  convertidos: ["convertido", "completado"] as LeadStatus[],
  abandonados: ["abandonado"] as LeadStatus[],
  descartados: ["descartado", "perdido"] as LeadStatus[],
};

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

const TIPO_LABELS: Record<string, { label: string; icon: typeof Shield }> = {
  lanza: { label: "Lanza", icon: Shield },
  esposa: { label: "Aliada", icon: Heart },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function LanzaPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-arena flex items-center justify-center"><div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" /></div>}>
      <LanzaPanelContent />
    </Suspense>
  );
}

function LanzaPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  const [lanza, setLanza] = useState<Lanza | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadCounts, setLeadCounts] = useState({ total: 0, en_proceso: 0, convertidos: 0, abandonados: 0, descartados: 0 });
  const [loading, setLoading] = useState(true);
  const [panelTab, setPanelTab] = useState<"resumen" | "contactos">("resumen");
  const [comision, setComision] = useState(100000);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    const supabase = createClient();
    (async () => {
      const [{ data: lanzaData }, comisiones] = await Promise.all([
        supabase
          .from("lanzas")
          .select("id, code, nombre, tipo, comision_personalizada, meta_bono, monto_bono, bono_pagado_at")
          .eq("code", code)
          .single(),
        getComisionesPorTipo(),
      ]);

      if (lanzaData) {
        const l = lanzaData as Lanza;
        setLanza(l);
        const myComision = getComisionForAliado(comisiones, l.tipo, l.comision_personalizada);
        setComision(myComision);

        // Only load counts for stats — leads loaded on demand in Contactos tab
        const countsRes = await fetch(`/api/aliados/leads?lanza_id=${l.id}&counts=true`);
        if (countsRes.ok) {
          const counts = await countsRes.json();
          setLeadCounts(counts);
        }
      }
      setLoading(false);
    })();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-arena flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" />
      </div>
    );
  }

  if (!lanza) {
    return (
      <div className="min-h-screen bg-arena flex items-center justify-center px-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-gray-700 text-sm">Código no válido</p>
          <button onClick={() => router.push("/aliados")} className="text-oro text-sm hover:underline font-medium">
            Volver al portal
          </button>
        </div>
      </div>
    );
  }

  const convertidos = leadCounts.convertidos;
  const saldoBase = convertidos * comision;
  const tieneBono = !!(lanza.meta_bono && lanza.monto_bono);
  const bonoGanado = tieneBono && convertidos >= (lanza.meta_bono || 0);
  const saldoTotal = saldoBase + (bonoGanado && !lanza.bono_pagado_at ? (lanza.monto_bono || 0) : 0);

  const shareLink = `${window.location.origin}/r/${lanza.code}`;

  // Acción del aliado: marcar lead como contactado/descartado/abandonado
  const handleMarkLead = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch("/api/lanza-leads/marcar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, lanza_code: lanza.code, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "No se pudo actualizar");
        return;
      }
      // Actualización optimista en local
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      toast.success("Lead actualizado");
    } catch {
      toast.error("Error de conexión");
    }
  };

  // Recordatorio por WhatsApp con link prellenado
  const handleRemindLead = (lead: Lead) => {
    const phone = (lead.telefono || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("Sin teléfono para contactar");
      return;
    }
    const firstName = (lead.nombre || "").split(" ")[0] || "";
    const msg = `Hola ${firstName}, vi que iniciaste tu registro en Legión Jurídica pero no lo terminaste. Te dejo el link para continuar: ${shareLink}`;
    window.open(`https://wa.me/${phone.startsWith("57") ? phone : `57${phone}`}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const tipoCfg = TIPO_LABELS[lanza.tipo] || { label: lanza.tipo, icon: Users };
  const TipoIcon = tipoCfg.icon;
  const isEsposa = lanza.tipo === "esposa";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado");
  };

  const handleShareWhatsApp = () => {
    const msg = isEsposa
      ? `Mira lo que encontré para nuestras familias militares — Legión Jurídica. Asesoría legal completa desde $50.000/mes. Inscríbete aquí: ${shareLink}`
      : `Necesitas un abogado para la Fuerza Pública? Legión Jurídica tiene planes desde $50.000/mes. Regístrate aquí: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-arena pt-12 pb-16 px-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-jungle-dark text-xl font-bold flex items-center gap-2">
            Hola, {lanza.nombre.split(" ")[0]}
            <Sparkles className="w-4 h-4 text-oro" />
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isEsposa ? "bg-pink-50 text-pink-700 border-pink-200" : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              <TipoIcon className="w-3 h-3" /> {tipoCfg.label}
            </span>
            <p className="text-gray-500 text-xs">Código: <span className="text-oro font-mono font-bold">{lanza.code}</span></p>
          </div>
        </div>
        <button
          onClick={() => router.push("/aliados")}
          className="text-gray-400 hover:text-red-600 p-2 transition-colors"
          title="Salir"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
        <button onClick={() => setPanelTab("resumen")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${panelTab === "resumen" ? "bg-oro/10 text-oro" : "text-gray-500 hover:text-gray-900"}`}>
          <DollarSign className="w-4 h-4" /> Resumen
        </button>
        <button onClick={() => setPanelTab("contactos")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${panelTab === "contactos" ? "bg-oro/10 text-oro" : "text-gray-500 hover:text-gray-900"}`}>
          <Users className="w-4 h-4" /> Mis contactos
          {leadCounts.total > 0 && <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{leadCounts.total}</span>}
        </button>
      </div>

      {/* Tab: Contactos */}
      {panelTab === "contactos" && (
        <ContactosTab lanzaId={lanza.id} leadCounts={leadCounts} comision={comision} formatMoney={formatMoney} handleRemindLead={handleRemindLead} handleMarkLead={handleMarkLead} lanzaCode={lanza.code} />
      )}

      {/* Tab: Resumen */}
      {panelTab === "resumen" && <>

      {/* Share card */}
      <div className="bg-white border border-oro/20 rounded-2xl p-5 space-y-3 shadow-sm">
        <h2 className="text-oro font-bold text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Tu link de referido
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-arena rounded-lg px-3 py-2 text-gray-700 text-xs truncate border border-gray-200">
            {shareLink}
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-amber-100 hover:bg-amber-200 text-oro px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar
          </button>
        </div>
        <button
          onClick={handleShareWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.72-1.325A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.525-.659-6.39-1.803l-.446-.27-2.826.793.855-2.705-.298-.474A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
          Compartir por WhatsApp
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-jungle-dark">{leadCounts.total}</p>
          <p className="text-gray-500 text-[10px]">Registrados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-green-700">{convertidos}</p>
          <p className="text-gray-500 text-[10px]">Inscritos</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-oro/30 rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-oro">{formatMoney(saldoTotal)}</p>
          <p className="text-gray-500 text-[10px]">Ganado</p>
        </div>
      </div>

      {/* Bono progress */}
      {tieneBono && (
        <div className={`rounded-2xl p-5 border-2 ${
          bonoGanado
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
            : "bg-gradient-to-br from-amber-50 to-pink-50 border-oro/30"
        } shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${bonoGanado ? "text-green-700" : "text-oro"}`} />
              <h3 className={`font-bold text-sm ${bonoGanado ? "text-green-800" : "text-jungle-dark"}`}>
                {bonoGanado ? "¡Bono ganado!" : "Bono por cumplimiento"}
              </h3>
            </div>
            <span className={`text-lg font-black ${bonoGanado ? "text-green-700" : "text-oro"}`}>
              {convertidos}/{lanza.meta_bono}
            </span>
          </div>
          {!bonoGanado && (
            <p className="text-oro text-2xl font-black text-center my-3">
              {formatMoney(lanza.monto_bono || 0)}
              <span className="text-gray-500 text-xs font-medium ml-1">de bono</span>
            </p>
          )}
          <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-2 border border-gray-100">
            <div
              className={`h-full transition-all ${bonoGanado ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-oro to-amber-400"}`}
              style={{ width: `${Math.min(100, (convertidos / (lanza.meta_bono || 1)) * 100)}%` }}
            />
          </div>
          <p className={`text-xs text-center ${bonoGanado ? "text-green-700" : "text-gray-600"}`}>
            {bonoGanado
              ? lanza.bono_pagado_at
                ? `Bono de ${formatMoney(lanza.monto_bono || 0)} pagado el ${new Date(lanza.bono_pagado_at).toLocaleDateString("es-CO")}`
                : `¡Ganaste ${formatMoney(lanza.monto_bono || 0)} de bono! Pendiente de pago`
              : `Llega a ${lanza.meta_bono} inscritos y gana este bono extra`}
          </p>
        </div>
      )}

      {/* Comisión info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-oro" />
          <p className="text-gray-700 text-sm">
            Ganas <strong className="text-oro">{formatMoney(comision)}</strong> por cada persona que se inscribe con tu link
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-jungle-dark font-bold text-sm mb-3">¿Cómo funciona?</h3>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "Comparte tu link con amigos, familiares y conocidos" },
            { step: "2", text: "Ellos se registran con sus datos en la landing" },
            { step: "3", text: "Nosotros los contactamos y los afiliamos" },
            { step: "4", text: `Tú ganas ${formatMoney(comision)} por cada afiliado` },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <span className="w-6 h-6 bg-amber-100 text-oro text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {s.step}
              </span>
              <span className="text-gray-700 text-sm">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      </>}
    </div>
  );
}

// Componente reutilizable de sección de leads agrupados.
// Cada sección tiene encabezado + lista colapsable.
interface LeadsSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  leads: Lead[];
  accentColor: string;
  renderActions?: (lead: Lead) => React.ReactNode;
  showStep?: boolean;
}

const KANBAN_COLUMNS: { key: string; label: string; color: string; headerBg: string; countKey: string }[] = [
  { key: "en_proceso", label: "En proceso", color: "border-blue-300", headerBg: "bg-blue-50 text-blue-700", countKey: "en_proceso" },
  { key: "convertidos", label: "Convertidos", color: "border-green-300", headerBg: "bg-green-50 text-green-700", countKey: "convertidos" },
  { key: "abandonados", label: "Abandonados", color: "border-orange-300", headerBg: "bg-orange-50 text-orange-700", countKey: "abandonados" },
  { key: "descartados", label: "Descartados", color: "border-gray-300", headerBg: "bg-gray-100 text-gray-600", countKey: "descartados" },
];

function ContactosTab({ lanzaId, leadCounts, comision, formatMoney, handleRemindLead, handleMarkLead, lanzaCode }: {
  lanzaId: string;
  leadCounts: { total: number; en_proceso: number; convertidos: number; abandonados: number; descartados: number };
  comision: number;
  formatMoney: (n: number) => string;
  handleRemindLead: (lead: Lead) => void;
  handleMarkLead: (leadId: string, status: LeadStatus) => Promise<void>;
  lanzaCode: string;
}) {
  const [columnLeads, setColumnLeads] = useState<Record<string, Lead[]>>({});
  const [columnLoading, setColumnLoading] = useState<Record<string, boolean>>({});
  const [columnPages, setColumnPages] = useState<Record<string, number>>({});
  const [columnHasMore, setColumnHasMore] = useState<Record<string, boolean>>({});

  const fetchColumn = useCallback(async (colKey: string, pageNum: number, append: boolean) => {
    setColumnLoading((prev) => ({ ...prev, [colKey]: true }));
    try {
      const res = await fetch(`/api/aliados/leads?lanza_id=${lanzaId}&filter=${colKey}&page=${pageNum}&limit=10`);
      const data: Lead[] = res.ok ? await res.json() : [];
      setColumnLeads((prev) => ({ ...prev, [colKey]: append ? [...(prev[colKey] || []), ...data] : data }));
      setColumnHasMore((prev) => ({ ...prev, [colKey]: data.length === 10 }));
      setColumnPages((prev) => ({ ...prev, [colKey]: pageNum }));
    } catch { /* silent */ }
    setColumnLoading((prev) => ({ ...prev, [colKey]: false }));
  }, [lanzaId]);

  // Load first page of each column on mount
  useEffect(() => {
    KANBAN_COLUMNS.forEach((col) => fetchColumn(col.key, 0, false));
  }, [fetchColumn]);

  const loadMore = (colKey: string) => {
    const nextPage = (columnPages[colKey] || 0) + 1;
    fetchColumn(colKey, nextPage, true);
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-4">
      <div className="flex gap-3 min-w-[800px]">
        {KANBAN_COLUMNS.map((col) => {
          const leads = columnLeads[col.key] || [];
          const count = leadCounts[col.countKey as keyof typeof leadCounts] || 0;
          const loading = columnLoading[col.key];
          const hasMore = columnHasMore[col.key];

          return (
            <div key={col.key} className={`flex-1 min-w-[200px] bg-gray-50 rounded-xl border-t-2 ${col.color} overflow-hidden`}>
              {/* Column header */}
              <div className={`px-3 py-2.5 ${col.headerBg} flex items-center justify-between`}>
                <span className="font-bold text-xs">{col.label}</span>
                <span className="text-[10px] font-bold opacity-70">{count}</span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {!loading && leads.length === 0 && (
                  <p className="text-gray-400 text-[10px] text-center py-6">Sin contactos</p>
                )}

                {leads.map((lead) => {
                  const isConverted = lead.status === "convertido" || lead.status === "completado";
                  const isInactive = lead.status === "abandonado" || lead.status === "descartado" || lead.status === "perdido";
                  return (
                    <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-gray-900 font-medium text-xs leading-tight">{lead.nombre}</span>
                        {isConverted && <span className="text-green-700 text-[10px] font-bold flex-shrink-0">+{formatMoney(comision)}</span>}
                      </div>
                      <div className="text-gray-400 text-[10px] space-y-0.5">
                        {lead.telefono && <p>{lead.telefono}</p>}
                        <p>{new Date(lead.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {lead.telefono && (
                          <a href={`https://wa.me/${lead.telefono.startsWith("57") ? lead.telefono : `57${lead.telefono}`}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded font-medium">
                            <MessageCircle className="w-2.5 h-2.5" /> WA
                          </a>
                        )}
                        {!isConverted && lead.telefono && (
                          <button onClick={() => handleRemindLead(lead)}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded font-medium">
                            <ArrowRight className="w-2.5 h-2.5" /> Recordar
                          </button>
                        )}
                        {isInactive && (
                          <button onClick={() => handleMarkLead(lead.id, "en_proceso")}
                            className="inline-flex items-center gap-1 text-[10px] text-oro bg-amber-50 hover:bg-amber-100 border border-oro/20 px-2 py-1 rounded font-medium">
                            <RotateCcw className="w-2.5 h-2.5" /> Reactivar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Load more */}
                {hasMore && (
                  <button onClick={() => loadMore(col.key)} disabled={loading}
                    className="w-full text-center text-[10px] text-gray-400 hover:text-oro py-2 transition-colors font-medium">
                    {loading ? "Cargando..." : "Ver más"}
                  </button>
                )}

                {loading && leads.length === 0 && (
                  <div className="flex justify-center py-6">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-oro rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadsSection({
  icon,
  title,
  subtitle,
  leads,
  accentColor,
  renderActions,
  showStep,
}: LeadsSectionProps) {
  if (leads.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`font-bold text-sm ${accentColor}`}>
            {title} ({leads.length})
          </h3>
        </div>
        <span className="text-gray-400 text-[10px]">{subtitle}</span>
      </div>
      <div className="space-y-2">
        {leads.map((lead) => {
          const config = LEAD_STATUS_CONFIG[lead.status];
          return (
            <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-jungle-dark text-sm font-medium">{lead.nombre || "Sin nombre"}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                {lead.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {lead.telefono}
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                    {lead.email}
                  </span>
                )}
                {lead.cedula && <span>CC {lead.cedula}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                <span>Registrado {formatRelativeDate(lead.created_at)}</span>
                {lead.last_activity_at && lead.last_activity_at !== lead.created_at && (
                  <span>• Última actividad {formatRelativeDate(lead.last_activity_at)}</span>
                )}
                {showStep && lead.current_step && lead.current_step >= 1 && (
                  <span className="text-blue-600 font-semibold">• Paso {lead.current_step}/4</span>
                )}
              </div>
              {renderActions && renderActions(lead)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
