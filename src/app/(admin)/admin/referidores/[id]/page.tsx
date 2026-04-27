"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReferidorStore, type Referidor } from "@/lib/stores/referidor-store";
import { getComisionesPorTipo, getComisionForReferidor, type ComisionesPorTipo } from "@/lib/config";
import Button from "@/components/ui/button";
import {
  ArrowLeft, Phone, Mail, MapPin, Shield, Heart, Users, Calendar,
  DollarSign, Award, Copy, MessageCircle, Check, X, UserPlus,
  ToggleLeft, ToggleRight, Clock, Hash, Save, BadgeDollarSign, Pencil, Download,
} from "lucide-react";
import { toast } from "sonner";

const TIPO_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  vendedor: { label: "Vendedor", icon: BadgeDollarSign, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  lanza: { label: "Lanza", icon: Shield, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  esposa: { label: "Esposa", icon: Heart, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
};

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  contactado: { label: "Contactado", color: "bg-blue-50 text-blue-700 border-blue-200" },
  convertido: { label: "Convertido", color: "bg-green-50 text-green-700 border-green-200" },
  completado: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200" },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200" },
  abandonado: { label: "Abandonado", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || { label: tipo, icon: Users, color: "text-gray-700", bg: "bg-gray-100 border-gray-200" };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export default function ReferidorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const referidores = useReferidorStore((s) => s.referidores);
  const leads = useReferidorStore((s) => s.leads);
  const fetchAll = useReferidorStore((s) => s.fetchAll);
  const updateReferidor = useReferidorStore((s) => s.updateReferidor);
  const toggleStatus = useReferidorStore((s) => s.toggleStatus);
  const updateLeadStatus = useReferidorStore((s) => s.updateLeadStatus);
  const loaded = useReferidorStore((s) => s.loaded);

  const [comisiones, setComisiones] = useState<ComisionesPorTipo>({ lanza: 100000, esposa: 100000, vendedor: 50000 });
  const [activeTab, setActiveTab] = useState<"perfil" | "leads">("perfil");
  const [editing, setEditing] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombre: "", telefono: "", email: "", ciudad: "", rama: "", rango: "" });
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [comisionPersonalizada, setComisionPersonalizada] = useState("");
  const [metaBono, setMetaBono] = useState("");
  const [montoBono, setMontoBono] = useState("");
  const [savingBono, setSavingBono] = useState(false);

  useEffect(() => {
    fetchAll();
    getComisionesPorTipo().then(setComisiones);
  }, [fetchAll]);

  const referidor = useMemo(() => referidores.find((r) => r.id === id) || null, [referidores, id]);

  useEffect(() => {
    if (referidor) {
      setComisionPersonalizada(referidor.comision_personalizada !== null ? String(referidor.comision_personalizada) : "");
      setMetaBono(referidor.meta_bono ? String(referidor.meta_bono) : "");
      setMontoBono(referidor.monto_bono ? String(referidor.monto_bono) : "");
    }
  }, [referidor]);

  if (!loaded) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-oro/30 border-t-oro rounded-full animate-spin" /></div>;
  }

  if (!referidor) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Aliado no encontrado</p>
        <Link href="/admin/referidores" className="text-oro text-sm hover:underline mt-2 inline-block">← Volver</Link>
      </div>
    );
  }

  const cfg = getTipoConfig(referidor.tipo);
  const TipoIcon = cfg.icon;
  const comisionDefault = comisiones[referidor.tipo] || 100000;
  const comisionActual = getComisionForReferidor(comisiones, referidor.tipo, referidor.comision_personalizada);

  const allLeads = leads.filter((l) => l.lanza_id === id || l.lanza_code === referidor.code);
  const convertidos = allLeads.filter((l) => l.status === "convertido").length;
  const nuevos = allLeads.filter((l) => l.status === "nuevo").length;
  const contactados = allLeads.filter((l) => l.status === "contactado").length;
  const totalGanado = convertidos * comisionActual;
  const tasaConversion = allLeads.length > 0 ? Math.round((convertidos / allLeads.length) * 100) : 0;

  const tieneBono = !!(referidor.meta_bono && referidor.monto_bono);
  const bonoGanado = tieneBono && convertidos >= (referidor.meta_bono || 0);
  const progresoBono = tieneBono ? Math.min(100, (convertidos / (referidor.meta_bono || 1)) * 100) : 0;

  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/r/${referidor.code}` : `/r/${referidor.code}`;

  const handleCopyLink = () => { navigator.clipboard.writeText(referralLink); toast.success("Link copiado"); };

  const handleSave = async () => {
    setSavingBono(true);
    try {
      await updateReferidor(referidor.id, {
        comision_personalizada: comisionPersonalizada ? parseInt(comisionPersonalizada, 10) : null,
        meta_bono: metaBono ? parseInt(metaBono, 10) : null,
        monto_bono: montoBono ? parseInt(montoBono, 10) : null,
      } as Partial<Referidor>);
      toast.success("Cambios guardados");
      setEditing(false);
    } catch { toast.error("Error al guardar"); }
    finally { setSavingBono(false); }
  };

  const handleMarcarBonoPagado = async () => {
    if (!confirm("¿Marcar el bono como pagado?")) return;
    try {
      await updateReferidor(referidor.id, { bono_pagado_at: new Date().toISOString() } as Partial<Referidor>);
      toast.success("Bono marcado como pagado");
    } catch { toast.error("Error"); }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/referidores")} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-gray-900 text-xl font-bold">{referidor.nombre}</h1>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              <TipoIcon className="w-3 h-3" /> {cfg.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              referidor.status === "activo" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>{referidor.status}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">Registrado el {formatDate(referidor.created_at)}</p>
        </div>
        <button
          onClick={async () => { await toggleStatus(referidor.id); toast.success(referidor.status === "activo" ? "Desactivado" : "Activado"); }}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          {referidor.status === "activo" ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {referidor.status === "activo" ? "Desactivar" : "Activar"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">Leads totales</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{allLeads.length}</p>
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
          <p className="text-[10px] text-gray-400 mt-1">{referidor.comision_personalizada !== null ? "Personalizada" : `Por defecto (${cfg.label})`}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-oro/30 rounded-xl p-4 shadow-sm">
          <p className="text-gray-600 text-[10px] uppercase tracking-wider font-medium">Total ganado</p>
          <p className="text-oro text-2xl font-bold mt-1">{formatMoney(totalGanado + (bonoGanado && !referidor.bono_pagado_at ? (referidor.monto_bono || 0) : 0))}</p>
          <p className="text-[10px] text-gray-500 mt-1">{convertidos} × {formatMoney(comisionActual)}{bonoGanado && !referidor.bono_pagado_at ? " + bono" : ""}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("perfil")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "perfil" ? "bg-white text-oro shadow-sm" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" /> Perfil
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "leads" ? "bg-white text-oro shadow-sm" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Leads
          {nuevos > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{nuevos}</span>}
        </button>
      </div>

      {/* Tab: Leads */}
      {activeTab === "leads" && (
        <LeadsList
          referidorId={referidor.id}
          referidorCode={referidor.code}
          comisionActual={comisionActual}
        />
      )}

      {/* Tab: Perfil */}
      {activeTab === "perfil" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Info + Link */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-oro" /> Datos personales
              </h3>
              {!editingPerfil ? (
                <button onClick={() => { setEditingPerfil(true); setPerfilForm({ nombre: referidor.nombre, telefono: referidor.telefono, email: referidor.email || "", ciudad: referidor.ciudad || "", rama: referidor.rama || "", rango: referidor.rango || "" }); }} className="flex items-center gap-1 text-xs text-oro hover:text-amber-700">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingPerfil(false)} className="text-xs text-gray-500 hover:text-gray-900">Cancelar</button>
                  <Button size="sm" disabled={savingPerfil} onClick={async () => {
                    setSavingPerfil(true);
                    try {
                      await updateReferidor(referidor.id, {
                        nombre: perfilForm.nombre.trim(),
                        telefono: perfilForm.telefono.trim(),
                        email: perfilForm.email.trim(),
                        ciudad: perfilForm.ciudad.trim(),
                        rama: perfilForm.rama.trim(),
                        rango: perfilForm.rango.trim(),
                      });
                      toast.success("Datos actualizados");
                      setEditingPerfil(false);
                    } catch { toast.error("Error al guardar"); }
                    finally { setSavingPerfil(false); }
                  }}>
                    <Save className="w-3 h-3 mr-1" /> {savingPerfil ? "..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
            {editingPerfil ? (
              <div className="space-y-2.5">
                <div>
                  <label className="text-gray-500 text-[10px] font-medium mb-0.5 block">Nombre</label>
                  <input type="text" value={perfilForm.nombre} onChange={(e) => setPerfilForm((f) => ({ ...f, nombre: e.target.value }))} className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-medium mb-0.5 block">Teléfono</label>
                  <input type="text" value={perfilForm.telefono} onChange={(e) => setPerfilForm((f) => ({ ...f, telefono: e.target.value.replace(/\D/g, "") }))} className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-medium mb-0.5 block">Email</label>
                  <input type="email" value={perfilForm.email} onChange={(e) => setPerfilForm((f) => ({ ...f, email: e.target.value }))} className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-medium mb-0.5 block">Ciudad</label>
                  <input type="text" value={perfilForm.ciudad} onChange={(e) => setPerfilForm((f) => ({ ...f, ciudad: e.target.value }))} className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-medium mb-0.5 block">Rama</label>
                  <input type="text" value={perfilForm.rama} onChange={(e) => setPerfilForm((f) => ({ ...f, rama: e.target.value }))} className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] font-medium mb-0.5 block">Rango</label>
                  <input type="text" value={perfilForm.rango} onChange={(e) => setPerfilForm((f) => ({ ...f, rango: e.target.value }))} className="w-full bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
                </div>
              </div>
            ) : (
              <>
                <InfoRow icon={Hash} label="Cédula" value={referidor.cedula} />
                <InfoRow icon={Phone} label="Teléfono" value={<a href={`tel:+57${referidor.telefono}`} className="hover:text-oro">{referidor.telefono}</a>} />
                {referidor.email && <InfoRow icon={Mail} label="Email" value={<a href={`mailto:${referidor.email}`} className="hover:text-oro break-all">{referidor.email}</a>} />}
                {referidor.ciudad && <InfoRow icon={MapPin} label="Ciudad" value={referidor.ciudad} />}
                {referidor.rama && <InfoRow icon={Shield} label="Rama" value={referidor.rama} />}
                {referidor.rango && <InfoRow icon={Award} label="Rango" value={referidor.rango} />}
                <InfoRow icon={Calendar} label="Registro" value={formatDate(referidor.created_at)} />
              </>
            )}
          </div>

          {/* Referral link */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-oro" /> Link de referido</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <code className="text-oro text-xs font-mono break-all">{referidor.code}</code>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-gray-600 text-[10px] truncate">{referralLink}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleCopyLink} className="flex items-center justify-center gap-1.5 text-xs text-gray-700 hover:text-oro bg-gray-50 hover:bg-amber-50 px-3 py-2 rounded-lg transition-colors border border-gray-200">
                <Copy className="w-3 h-3" /> Copiar
              </button>
              <a href={`https://wa.me/57${referidor.telefono}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-gray-700 hover:text-green-700 bg-gray-50 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-gray-200">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT: Comisión + Leads */}
        <div className="lg:col-span-2 space-y-4">
          {/* Comisión y Bono */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2"><Award className="w-4 h-4 text-oro" /> Comisión y bono</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-oro hover:text-amber-700"><Pencil className="w-3 h-3" /> Editar</button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(false); setComisionPersonalizada(referidor.comision_personalizada !== null ? String(referidor.comision_personalizada) : ""); setMetaBono(referidor.meta_bono ? String(referidor.meta_bono) : ""); setMontoBono(referidor.monto_bono ? String(referidor.monto_bono) : ""); }} className="text-xs text-gray-500 hover:text-gray-900">Cancelar</button>
                  <Button size="sm" onClick={handleSave} disabled={savingBono}><Save className="w-3 h-3 mr-1" /> {savingBono ? "..." : "Guardar"}</Button>
                </div>
              )}
            </div>

            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div>
                <p className="text-gray-500 text-xs mb-1">Comisión por defecto ({cfg.label})</p>
                <p className="text-gray-900 font-bold">{formatMoney(comisionDefault)}</p>
              </div>
              {editing ? (
                <div>
                  <label className="text-gray-600 text-xs font-medium mb-1 block">Comisión personalizada (opcional)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <input type="text" inputMode="numeric" value={comisionPersonalizada} onChange={(e) => setComisionPersonalizada(e.target.value.replace(/\D/g, ""))} placeholder="Vacío = usar valor del tipo" className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full" />
                  </div>
                </div>
              ) : referidor.comision_personalizada !== null && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-800 text-xs font-bold flex items-center gap-1"><Award className="w-3 h-3" /> Comisión personalizada activa</p>
                  <p className="text-amber-900 font-bold text-lg mt-1">{formatMoney(referidor.comision_personalizada)}</p>
                </div>
              )}
            </div>

            {/* Bono */}
            <div className="pt-4 space-y-3">
              <h4 className="text-gray-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-oro" /> Bono por cumplimiento</h4>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Meta (inscritos)</label>
                    <input type="text" inputMode="numeric" value={metaBono} onChange={(e) => setMetaBono(e.target.value.replace(/\D/g, ""))} placeholder="Ej: 10" className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full" />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs font-medium mb-1 block">Monto del bono</label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-sm">$</span>
                      <input type="text" inputMode="numeric" value={montoBono} onChange={(e) => setMontoBono(e.target.value.replace(/\D/g, ""))} placeholder="Ej: 200000" className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full" />
                    </div>
                  </div>
                </div>
              ) : tieneBono ? (
                <div className={`rounded-lg border p-4 ${bonoGanado ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-bold ${bonoGanado ? "text-green-800" : "text-amber-900"}`}>
                      {formatMoney(referidor.monto_bono || 0)} al llegar a {referidor.meta_bono} inscritos
                    </p>
                    <span className={`text-lg font-black ${bonoGanado ? "text-green-700" : "text-amber-700"}`}>{convertidos}/{referidor.meta_bono}</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
                    <div className={`h-full transition-all ${bonoGanado ? "bg-green-500" : "bg-oro"}`} style={{ width: `${progresoBono}%` }} />
                  </div>
                  {bonoGanado && !referidor.bono_pagado_at && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                      <p className="text-green-700 text-xs font-bold">¡Bono ganado! Pendiente de pago</p>
                      <Button size="sm" onClick={handleMarcarBonoPagado}><Check className="w-3 h-3 mr-1" /> Marcar pagado</Button>
                    </div>
                  )}
                  {referidor.bono_pagado_at && <p className="text-green-700 text-xs mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Pagado el {formatDate(referidor.bono_pagado_at)}</p>}
                </div>
              ) : (
                <p className="text-gray-400 text-xs italic">Sin bono configurado. Edita para asignar uno.</p>
              )}
            </div>
          </div>

        </div>
      </div>
      )}
    </div>
  );
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const LEAD_STATUS_CFG: Record<string, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  contactado: { label: "Contactado", color: "bg-blue-50 text-blue-700 border-blue-200" },
  convertido: { label: "Convertido", color: "bg-green-50 text-green-700 border-green-200" },
  completado: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200" },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200" },
  abandonado: { label: "Abandonado", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

function LeadsList({ referidorId, referidorCode, comisionActual }: {
  referidorId: string;
  referidorCode: string;
  comisionActual: number;
}) {
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [leads, setLeads] = useState<import("@/lib/stores/referidor-store").ReferidorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const updateLeadStatus = useReferidorStore((s) => s.updateLeadStatus);

  // Fetch leads for selected month
  useEffect(() => {
    setLoading(true);
    fetch(`/api/referidores/leads?referidor_id=${referidorId}&code=${referidorCode}&year=${filterYear}&month=${filterMonth}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => { setLeads([]); setLoading(false); });
  }, [referidorId, referidorCode, filterYear, filterMonth]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-oro" /> Leads de este aliado</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{leads.length} en {MONTH_NAMES[filterMonth]}</span>
                  {leads.length > 0 && (
                    <button
                      onClick={() => {
                        const headers = ["Nombre", "Teléfono", "Email", "Cédula", "Área de interés", "Plan", "Estado", "Fecha"];
                        const rows = leads.map((l) => [
                          l.nombre,
                          l.telefono,
                          l.email,
                          l.cedula,
                          l.area_interes,
                          l.plan_interes,
                          l.status,
                          new Date(l.created_at).toLocaleDateString("es-CO"),
                        ]);
                        const csv = [headers, ...rows].map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
                        const bom = "\uFEFF";
                        const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `leads_${MONTH_NAMES[filterMonth]}_${filterYear}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success(`${leads.length} leads exportados`);
                      }}
                      className="flex items-center gap-1 text-oro text-[10px] font-medium hover:text-amber-700 bg-oro/5 px-2 py-1 rounded-md border border-oro/20 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="bg-gray-50 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="flex gap-1 flex-wrap">
                  {MONTH_NAMES.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => setFilterMonth(i)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        filterMonth === i
                          ? "bg-oro/10 text-oro border border-oro/30"
                          : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-oro rounded-full animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Sin leads en {MONTH_NAMES[filterMonth]} {filterYear}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const sCfg = LEAD_STATUS_CFG[lead.status] || { label: lead.status, color: "bg-gray-100 text-gray-500 border-gray-200" };
                  return (
                    <div key={lead.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-gray-900 text-sm font-medium">{lead.nombre}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sCfg.color}`}>{sCfg.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-500 text-xs">
                            <a href={`tel:+57${lead.telefono}`} className="flex items-center gap-1 hover:text-oro"><Phone className="w-3 h-3" /> {lead.telefono}</a>
                            {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-oro truncate"><Mail className="w-3 h-3" /> {lead.email}</a>}
                            {lead.cedula && <span>CC {lead.cedula}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-gray-400 text-[10px] flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(lead.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</p>
                          {lead.status === "convertido" && <p className="text-oro text-xs font-bold mt-1">+{formatMoney(comisionActual)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <a href={`https://wa.me/57${lead.telefono}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-green-700"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
                        {lead.status === "nuevo" && (
                          <button onClick={async () => { await updateLeadStatus(lead.id, "contactado"); toast.success("Contactado"); }} className="text-[11px] text-gray-600 hover:text-blue-700">→ Contactado</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
