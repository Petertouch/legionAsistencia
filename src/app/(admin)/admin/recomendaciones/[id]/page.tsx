"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanzaStore, type Lanza } from "@/lib/stores/lanza-store";
import { getComisionesPorTipo, getComisionForAliado, type ComisionesPorTipo } from "@/lib/config";
import Button from "@/components/ui/button";
import {
  ArrowLeft, Phone, Mail, MapPin, Shield, Heart, Users, Calendar,
  DollarSign, Award, Pencil, Copy, MessageCircle, Check, X,
  ToggleLeft, ToggleRight, Clock, Hash, Save,
} from "lucide-react";
import { toast } from "sonner";

const TIPO_CONFIG: Record<string, { label: string; pluralLabel: string; icon: typeof Shield; color: string; bg: string }> = {
  lanza: { label: "Lanza", pluralLabel: "Lanzas", icon: Shield, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  esposa: { label: "Esposa", pluralLabel: "Esposas", icon: Heart, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
};

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  en_proceso: { label: "En proceso", color: "bg-blue-50 text-blue-700 border-blue-200" },
  contactado: { label: "Contactado", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  convertido: { label: "Convertido", color: "bg-green-50 text-green-700 border-green-200" },
  completado: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200" },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200" },
  descartado: { label: "Descartado", color: "bg-gray-100 text-gray-500 border-gray-200" },
  abandonado: { label: "Abandonado", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || { label: tipo, pluralLabel: tipo + "s", icon: Users, color: "text-gray-700", bg: "bg-gray-100 border-gray-200" };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export default function AliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const lanzas = useLanzaStore((s) => s.lanzas);
  const leads = useLanzaStore((s) => s.leads);
  const fetchAll = useLanzaStore((s) => s.fetchAll);
  const updateLanza = useLanzaStore((s) => s.updateLanza);
  const toggleLanzaStatus = useLanzaStore((s) => s.toggleLanzaStatus);
  const updateLeadStatus = useLanzaStore((s) => s.updateLeadStatus);
  const loaded = useLanzaStore((s) => s.loaded);

  const [comisiones, setComisiones] = useState<ComisionesPorTipo>({ lanza: 100000, esposa: 100000 });
  const [editing, setEditing] = useState(false);
  const [comisionPersonalizada, setComisionPersonalizada] = useState("");
  const [metaBono, setMetaBono] = useState("");
  const [montoBono, setMontoBono] = useState("");
  const [savingBono, setSavingBono] = useState(false);

  useEffect(() => {
    fetchAll();
    getComisionesPorTipo().then(setComisiones);
  }, [fetchAll]);

  const aliado = useMemo(() => lanzas.find((l) => l.id === id) || null, [lanzas, id]);

  const myLeads = useMemo(
    () => leads.filter((l) => l.lanza_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [leads, id]
  );

  useEffect(() => {
    if (aliado) {
      setComisionPersonalizada(aliado.comision_personalizada !== null && aliado.comision_personalizada !== undefined ? String(aliado.comision_personalizada) : "");
      setMetaBono(aliado.meta_bono ? String(aliado.meta_bono) : "");
      setMontoBono(aliado.monto_bono ? String(aliado.monto_bono) : "");
    }
  }, [aliado]);

  if (!loaded) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" /></div>;
  }

  if (!aliado) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Aliado no encontrado</p>
        <Link href="/admin/recomendaciones" className="text-oro text-sm hover:underline mt-2 inline-block">
          ← Volver a aliados
        </Link>
      </div>
    );
  }

  const cfg = getTipoConfig(aliado.tipo || "lanza");
  const TipoIcon = cfg.icon;
  const comisionDefault = comisiones[aliado.tipo || "lanza"] || 100000;
  const comisionActual = getComisionForAliado(comisiones, aliado.tipo || "lanza", aliado.comision_personalizada ?? null);

  const convertidos = myLeads.filter((l) => l.status === "convertido").length;
  const nuevos = myLeads.filter((l) => l.status === "nuevo").length;
  const contactados = myLeads.filter((l) => l.status === "contactado").length;
  const perdidos = myLeads.filter((l) => l.status === "perdido").length;
  const totalGanado = convertidos * comisionActual;
  const tasaConversion = myLeads.length > 0 ? Math.round((convertidos / myLeads.length) * 100) : 0;

  const tieneBono = !!(aliado.meta_bono && aliado.monto_bono);
  const bonoGanado = tieneBono && convertidos >= (aliado.meta_bono || 0);
  const progresoBono = tieneBono ? Math.min(100, (convertidos / (aliado.meta_bono || 1)) * 100) : 0;

  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/r/${aliado.code}` : `/r/${aliado.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado");
  };

  const handleSaveBonoComision = async () => {
    setSavingBono(true);
    try {
      await updateLanza(aliado.id, {
        comision_personalizada: comisionPersonalizada ? parseInt(comisionPersonalizada, 10) : null,
        meta_bono: metaBono ? parseInt(metaBono, 10) : null,
        monto_bono: montoBono ? parseInt(montoBono, 10) : null,
      } as Partial<Lanza>);
      toast.success("Cambios guardados");
      setEditing(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingBono(false);
    }
  };

  const handleMarcarBonoPagado = async () => {
    if (!confirm("¿Marcar el bono como pagado?")) return;
    try {
      await updateLanza(aliado.id, { bono_pagado_at: new Date().toISOString() } as Partial<Lanza>);
      toast.success("Bono marcado como pagado");
    } catch {
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/recomendaciones")}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-gray-900 text-xl font-bold">{aliado.nombre}</h1>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              <TipoIcon className="w-3 h-3" /> {cfg.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              aliado.status === "activo"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {aliado.status}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">Registrado el {formatDate(aliado.created_at)}</p>
        </div>
        <button
          onClick={async () => {
            await toggleLanzaStatus(aliado.id);
            toast.success(aliado.status === "activo" ? "Aliado desactivado" : "Aliado activado");
          }}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          {aliado.status === "activo" ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {aliado.status === "activo" ? "Desactivar" : "Activar"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">Leads totales</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{myLeads.length}</p>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
            <span>{nuevos} nuevos</span> · <span>{contactados} en proceso</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">Convertidos</p>
          <p className="text-green-700 text-2xl font-bold mt-1">{convertidos}</p>
          <p className="text-[10px] text-gray-400 mt-1">{tasaConversion}% de conversión</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">Comisión por inscrito</p>
          <p className="text-oro text-2xl font-bold mt-1">{formatMoney(comisionActual)}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {aliado.comision_personalizada !== null && aliado.comision_personalizada !== undefined
              ? "Personalizada"
              : `Por defecto del tipo ${cfg.label}`}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-oro/30 rounded-xl p-4 shadow-sm">
          <p className="text-gray-600 text-[10px] uppercase tracking-wider font-medium">Total ganado</p>
          <p className="text-oro text-2xl font-bold mt-1">{formatMoney(totalGanado + (bonoGanado && !aliado.bono_pagado_at ? (aliado.monto_bono || 0) : 0))}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {convertidos} × {formatMoney(comisionActual)}{bonoGanado && !aliado.bono_pagado_at ? " + bono" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Personal info + link */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-oro" /> Datos personales
            </h3>
            <InfoRow icon={Hash} label="Cédula" value={aliado.cedula} />
            <InfoRow icon={Phone} label="Teléfono" value={
              <a href={`tel:+57${aliado.telefono}`} className="hover:text-oro transition-colors">{aliado.telefono}</a>
            } />
            {aliado.email && <InfoRow icon={Mail} label="Email" value={
              <a href={`mailto:${aliado.email}`} className="hover:text-oro transition-colors break-all">{aliado.email}</a>
            } />}
            {aliado.ciudad && <InfoRow icon={MapPin} label="Ciudad" value={aliado.ciudad} />}
            {aliado.rama && <InfoRow icon={Shield} label="Rama" value={aliado.rama} />}
            {aliado.rango && <InfoRow icon={Award} label="Rango" value={aliado.rango} />}
            <InfoRow icon={Calendar} label="Registro" value={formatDate(aliado.created_at)} />
          </div>

          {/* Referral link */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-oro" /> Link de referido
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <code className="text-oro text-xs font-mono break-all">{aliado.code}</code>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-600 text-[10px] truncate">{referralLink}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 text-xs text-gray-700 hover:text-oro bg-gray-50 hover:bg-amber-50 px-3 py-2 rounded-lg transition-colors border border-gray-200"
              >
                <Copy className="w-3 h-3" /> Copiar
              </button>
              <a
                href={`https://wa.me/57${aliado.telefono}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-gray-700 hover:text-green-700 bg-gray-50 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-gray-200"
              >
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT: Comisión + Bono + Leads */}
        <div className="lg:col-span-2 space-y-4">
          {/* Comisión y Bono */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-oro" /> Comisión y bono
              </h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs text-oro hover:text-amber-700 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setComisionPersonalizada(aliado.comision_personalizada !== null && aliado.comision_personalizada !== undefined ? String(aliado.comision_personalizada) : "");
                      setMetaBono(aliado.meta_bono ? String(aliado.meta_bono) : "");
                      setMontoBono(aliado.monto_bono ? String(aliado.monto_bono) : "");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <Button size="sm" onClick={handleSaveBonoComision} disabled={savingBono}>
                    <Save className="w-3 h-3 mr-1" /> {savingBono ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>

            {/* Comisión */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div>
                <p className="text-gray-500 text-xs mb-1">Comisión por defecto del tipo {cfg.label}</p>
                <p className="text-gray-900 font-bold">{formatMoney(comisionDefault)}</p>
              </div>
              {editing ? (
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Comisión personalizada (opcional)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={comisionPersonalizada}
                      onChange={(e) => setComisionPersonalizada(e.target.value.replace(/\D/g, ""))}
                      placeholder="Vacío = usar valor del tipo"
                      className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Este monto sobrescribe el valor por defecto del tipo</p>
                </div>
              ) : (
                aliado.comision_personalizada !== null && aliado.comision_personalizada !== undefined && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 text-xs font-bold flex items-center gap-1">
                      <Award className="w-3 h-3" /> Comisión personalizada activa
                    </p>
                    <p className="text-amber-900 font-bold text-lg mt-1">{formatMoney(aliado.comision_personalizada)}</p>
                  </div>
                )
              )}
            </div>

            {/* Bono */}
            <div className="pt-4 space-y-3">
              <h4 className="text-gray-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-oro" /> Bono por cumplimiento
              </h4>

              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Meta (inscritos)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={metaBono}
                      onChange={(e) => setMetaBono(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ej: 10"
                      className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Monto del bono</label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={montoBono}
                        onChange={(e) => setMontoBono(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ej: 200000"
                        className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : tieneBono ? (
                <div className={`rounded-lg border p-4 ${
                  bonoGanado
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-bold ${bonoGanado ? "text-green-800" : "text-amber-900"}`}>
                      {formatMoney(aliado.monto_bono || 0)} al llegar a {aliado.meta_bono} inscritos
                    </p>
                    <span className={`text-lg font-black ${bonoGanado ? "text-green-700" : "text-amber-700"}`}>
                      {convertidos}/{aliado.meta_bono}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${bonoGanado ? "bg-green-500" : "bg-oro"}`}
                      style={{ width: `${progresoBono}%` }}
                    />
                  </div>
                  {bonoGanado && !aliado.bono_pagado_at && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                      <p className="text-green-700 text-xs font-bold">¡Bono ganado! Pendiente de pago</p>
                      <Button size="sm" onClick={handleMarcarBonoPagado}>
                        <Check className="w-3 h-3 mr-1" /> Marcar pagado
                      </Button>
                    </div>
                  )}
                  {aliado.bono_pagado_at && (
                    <p className="text-green-700 text-xs mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Pagado el {formatDate(aliado.bono_pagado_at)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-xs italic">Sin bono configurado. Edita para asignar uno.</p>
              )}
            </div>
          </div>

          {/* Leads list */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-oro" /> Inscritos por este aliado
              </h3>
              <span className="text-gray-500 text-xs">{myLeads.length} total</span>
            </div>

            {myLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Este aliado aún no tiene inscritos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myLeads.map((lead) => {
                  const sCfg = LEAD_STATUS_CONFIG[lead.status] || { label: lead.status, color: "bg-gray-100 text-gray-500 border-gray-200" };
                  return (
                    <div key={lead.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-gray-900 text-sm font-medium">{lead.nombre}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sCfg.color}`}>
                              {sCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-500 text-xs">
                            <a href={`tel:+57${lead.telefono}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                              <Phone className="w-3 h-3" /> {lead.telefono}
                            </a>
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-oro transition-colors truncate">
                                <Mail className="w-3 h-3" /> {lead.email}
                              </a>
                            )}
                            {lead.cedula && <span>CC {lead.cedula}</span>}
                          </div>
                          {lead.area_interes && (
                            <p className="text-gray-400 text-[10px] mt-1">{lead.area_interes}</p>
                          )}
                          {lead.mensaje && (
                            <p className="text-gray-500 text-xs italic mt-1 bg-gray-50 rounded px-2 py-1">&ldquo;{lead.mensaje}&rdquo;</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-gray-400 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                          </p>
                          {lead.status === "convertido" && (
                            <p className="text-oro text-xs font-bold mt-1">+{formatMoney(comisionActual)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <a
                          href={`https://wa.me/57${lead.telefono}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-green-700 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                        {lead.status === "nuevo" && (
                          <button
                            onClick={async () => { await updateLeadStatus(lead.id, "contactado"); toast.success("Marcado como contactado"); }}
                            className="text-[11px] text-gray-600 hover:text-blue-700 transition-colors"
                          >
                            → Contactado
                          </button>
                        )}
                        {lead.status !== "convertido" && lead.status !== "perdido" && (
                          <button
                            onClick={async () => { await updateLeadStatus(lead.id, "convertido"); toast.success(`Convertido — ${formatMoney(comisionActual)}`); }}
                            className="flex items-center gap-1 text-[11px] text-green-700 hover:text-green-800 font-bold transition-colors"
                          >
                            <Check className="w-3 h-3" /> Convertir
                          </button>
                        )}
                        {lead.status !== "perdido" && lead.status !== "convertido" && (
                          <button
                            onClick={async () => { await updateLeadStatus(lead.id, "perdido"); toast("Marcado como perdido"); }}
                            className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3 inline" /> Perdido
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-gray-900 text-sm">{value}</p>
      </div>
    </div>
  );
}
