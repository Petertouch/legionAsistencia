"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getComisionesPorTipo, getComisionForAliado } from "@/lib/config";
import { toast } from "sonner";
import {
  Copy, Users, Phone, DollarSign, Share2, LogOut, Award,
  Heart, Shield, Sparkles, Clock, MessageCircle, X, Check, RotateCcw,
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
  const [loading, setLoading] = useState(true);
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

        const { data: leadsData } = await supabase
          .from("lanza_leads")
          .select("id, nombre, telefono, email, cedula, area_interes, plan_interes, status, current_step, last_activity_at, created_at")
          .eq("lanza_id", l.id)
          .order("created_at", { ascending: false });
        setLeads((leadsData || []) as Lead[]);
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
          <button onClick={() => router.push("/lanzas")} className="text-oro text-sm hover:underline font-medium">
            Volver al portal
          </button>
        </div>
      </div>
    );
  }

  // Agrupar leads por estado para las secciones del panel
  const leadsByGroup = {
    enProceso: leads.filter((l) => STATUS_GROUPS.enProceso.includes(l.status)),
    convertidos: leads.filter((l) => STATUS_GROUPS.convertidos.includes(l.status)),
    abandonados: leads.filter((l) => STATUS_GROUPS.abandonados.includes(l.status)),
    descartados: leads.filter((l) => STATUS_GROUPS.descartados.includes(l.status)),
  };

  const convertidos = leadsByGroup.convertidos.length;
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
          onClick={() => router.push("/lanzas")}
          className="text-gray-400 hover:text-red-600 p-2 transition-colors"
          title="Salir"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

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
          <p className="text-2xl font-black text-jungle-dark">{leads.length}</p>
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
          <div className="flex items-center justify-between mb-3">
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
          <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-2 border border-gray-100">
            <div
              className={`h-full transition-all ${bonoGanado ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-oro to-amber-400"}`}
              style={{ width: `${Math.min(100, (convertidos / (lanza.meta_bono || 1)) * 100)}%` }}
            />
          </div>
          <p className={`text-xs ${bonoGanado ? "text-green-700" : "text-gray-600"}`}>
            {bonoGanado
              ? lanza.bono_pagado_at
                ? `Bono de ${formatMoney(lanza.monto_bono || 0)} pagado el ${new Date(lanza.bono_pagado_at).toLocaleDateString("es-CO")}`
                : `Bono de ${formatMoney(lanza.monto_bono || 0)} pendiente de pago`
              : `Llega a ${lanza.meta_bono} inscritos para ganar un bono extra de ${formatMoney(lanza.monto_bono || 0)}`}
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

      {/* ═══ Mis Leads — secciones por estado ═══ */}
      <div className="space-y-5">
        {/* En proceso (lo más importante: aún se puede cerrar la venta) */}
        <LeadsSection
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          title="En proceso"
          subtitle="Aún puedes cerrar la venta"
          leads={leadsByGroup.enProceso}
          accentColor="text-blue-700"
          renderActions={(lead) => (
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => handleRemindLead(lead)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3 h-3" /> Recordar por WhatsApp
              </button>
              <button
                onClick={() => handleMarkLead(lead.id, "abandonado")}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors border border-orange-200"
                title="Marcar como abandonado"
              >
                <Clock className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleMarkLead(lead.id, "descartado")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors border border-gray-200"
                title="Descartar lead"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          showStep
        />

        {/* Convertidos */}
        <LeadsSection
          icon={<Check className="w-4 h-4 text-green-600" />}
          title="Convertidos"
          subtitle={`Cada uno te dio ${formatMoney(comision)}`}
          leads={leadsByGroup.convertidos}
          accentColor="text-green-700"
          renderActions={() => (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-green-700 font-bold">
              <DollarSign className="w-3 h-3" /> +{formatMoney(comision)}
            </div>
          )}
        />

        {/* Abandonados (puedes intentar reanimar con WhatsApp o reactivar) */}
        {leadsByGroup.abandonados.length > 0 && (
          <LeadsSection
            icon={<Clock className="w-4 h-4 text-orange-600" />}
            title="Abandonados"
            subtitle="Llevan más de 7 días sin actividad"
            leads={leadsByGroup.abandonados}
            accentColor="text-orange-700"
            renderActions={(lead) => (
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => handleRemindLead(lead)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" /> Recordar por WhatsApp
                </button>
                <button
                  onClick={() => handleMarkLead(lead.id, "en_proceso")}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reactivar
                </button>
              </div>
            )}
          />
        )}

        {/* Descartados (con opción de reactivar si cambiaron de opinión) */}
        {leadsByGroup.descartados.length > 0 && (
          <LeadsSection
            icon={<X className="w-4 h-4 text-gray-500" />}
            title="Descartados"
            subtitle="Cliente dijo no o ya no aplica"
            leads={leadsByGroup.descartados}
            accentColor="text-gray-600"
            renderActions={(lead) => (
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => handleMarkLead(lead.id, "en_proceso")}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reactivar
                </button>
              </div>
            )}
          />
        )}

        {/* Estado vacío global */}
        {leads.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aún no tienes registrados</p>
            <p className="text-gray-400 text-xs mt-1">Comparte tu link para empezar a ganar</p>
          </div>
        )}
      </div>
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
