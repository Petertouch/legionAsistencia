"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useReferidorStore, type Referidor, type ReferidorTipo } from "@/lib/stores/referidor-store";
import {
  getComisionesPorTipo, setComisionesPorTipo, getComisionForReferidor,
  getVendedorConfig, setVendedorConfig,
  type ComisionesPorTipo, type VendedorConfig, DEFAULT_VENDEDOR_CONFIG,
  type ComisionTipo, type PagoFrecuencia,
} from "@/lib/config";
import Button from "@/components/ui/button";
import {
  Gift, Check, Clock, Phone, Mail, DollarSign, Copy, MessageCircle,
  Search, Filter, Users, UserPlus, ToggleLeft, ToggleRight, Plus, X,
  Award, Shield, Heart, Settings, ChevronRight, BadgeDollarSign,
  TrendingUp, CircleDollarSign, Target, Calendar, Link2, MessageSquare,
  Save, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// ─── Config por tipo ───────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; pluralLabel: string; icon: typeof Shield; color: string; bg: string }> = {
  vendedor: { label: "Vendedor", pluralLabel: "Vendedores", icon: BadgeDollarSign, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  lanza: { label: "Lanza", pluralLabel: "Lanzas", icon: Shield, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  esposa: { label: "Esposa", pluralLabel: "Esposas", icon: Heart, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
};

const LEAD_STATUS_CONFIG = {
  nuevo: { label: "Nuevo", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  contactado: { label: "Contactado", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Phone },
  convertido: { label: "Convertido", color: "bg-green-50 text-green-700 border-green-200", icon: Check },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Clock },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || { label: tipo, pluralLabel: tipo + "s", icon: Users, color: "text-gray-700", bg: "bg-gray-100 border-gray-200" };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";
const labelCls = "text-gray-500 text-xs font-medium mb-1.5 block";

const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea", "Civil", "Otro"];

// ═══════════════════════════════════════════════════════════════════════════
export default function ReferidoresPage() {
  const referidores = useReferidorStore((s) => s.referidores);
  const leads = useReferidorStore((s) => s.leads);
  const toggleStatus = useReferidorStore((s) => s.toggleStatus);
  const updateLeadStatus = useReferidorStore((s) => s.updateLeadStatus);
  const createReferidor = useReferidorStore((s) => s.createReferidor);
  const fetchAll = useReferidorStore((s) => s.fetchAll);
  const loaded = useReferidorStore((s) => s.loaded);

  const [tab, setTab] = useState<"referidores" | "leads">("referidores");
  const [tipoFilter, setTipoFilter] = useState<"todos" | ReferidorTipo>("todos");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showVendedorConfig, setShowVendedorConfig] = useState(false);

  const [form, setForm] = useState({
    nombre: "", cedula: "", telefono: "", email: "", ciudad: "",
    rama: "Ejército", rango: "", tipo: "lanza" as ReferidorTipo, notas: "",
  });

  const [comisiones, setComisiones] = useState<ComisionesPorTipo>({ lanza: 100000, esposa: 100000, vendedor: 50000 });
  const [vConfig, setVConfig] = useState<VendedorConfig>(DEFAULT_VENDEDOR_CONFIG);

  useEffect(() => {
    fetchAll();
    getComisionesPorTipo().then(setComisiones);
    getVendedorConfig().then(setVConfig);
  }, [fetchAll]);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const convertidos = leads.filter((l) => l.status === "convertido").length;
    let deudaTotal = 0;
    referidores.forEach((ref) => {
      const cv = leads.filter((l) => l.lanza_id === ref.id && l.status === "convertido").length;
      const com = getComisionForReferidor(comisiones, ref.tipo, ref.comision_personalizada);
      deudaTotal += cv * com;
      if (ref.meta_bono && ref.monto_bono && cv >= ref.meta_bono && !ref.bono_pagado_at) {
        deudaTotal += ref.monto_bono;
      }
    });
    return { totalLeads, convertidos, deudaTotal };
  }, [referidores, leads, comisiones]);

  // ─── Vendedor-specific stats ────────────────────────────────────────────
  const vendedorStats = useMemo(() => {
    const vendedores = referidores.filter((r) => r.tipo === "vendedor");
    return vendedores.map((v) => {
      const myLeads = leads.filter((l) => l.lanza_code === v.code);
      const convertidos = myLeads.filter((l) => l.status === "convertido").length;
      const comisionUnit = v.comision_personalizada ?? (vConfig.comision_tipo === "fijo" ? vConfig.comision_fija : vConfig.comision_fija);
      const cumplioMeta = vConfig.bonificacion_activa && convertidos >= vConfig.bonificacion_meta;
      const bonus = cumplioMeta ? vConfig.bonificacion_monto : 0;
      return { ...v, myLeads, convertidos, total: myLeads.length, comisionTotal: convertidos * comisionUnit + bonus, tasa: myLeads.length > 0 ? Math.round((convertidos / myLeads.length) * 100) : 0, cumplioMeta };
    });
  }, [referidores, leads, vConfig]);

  if (!loaded) {
    return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-xl" />)}</div>;
  }

  const updateForm = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.cedula.trim() || !form.telefono.trim()) {
      toast.error("Nombre, cédula y teléfono son obligatorios");
      return;
    }
    const existing = referidores.find((r) => r.cedula === form.cedula.trim());
    if (existing) {
      toast.error(`Ya existe un aliado con esa cédula (${getTipoConfig(existing.tipo).label})`);
      return;
    }
    const ref = await createReferidor({
      nombre: form.nombre.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      ciudad: form.ciudad.trim(),
      rama: form.rama,
      rango: form.rango.trim(),
      tipo: form.tipo,
      suscriptor_id: null,
      comision_personalizada: null,
      meta_bono: null,
      monto_bono: null,
      bono_pagado_at: null,
      color: null,
      notas: form.notas.trim() || null,
    });
    if (ref) {
      toast.success(`${getTipoConfig(form.tipo).label} creado — código: ${ref.code}`);
      setForm({ nombre: "", cedula: "", telefono: "", email: "", ciudad: "", rama: "Ejército", rango: "", tipo: "lanza", notas: "" });
      setShowForm(false);
    } else {
      toast.error("Error al crear");
    }
  };

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast.success("Link copiado");
  };

  const filteredReferidores = referidores.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.nombre.toLowerCase().includes(q) || r.cedula.includes(q) || r.telefono.includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchTipo = tipoFilter === "todos" || r.tipo === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.nombre.toLowerCase().includes(q) || l.telefono.includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    if (tipoFilter !== "todos") {
      const ref = referidores.find((r) => r.id === l.lanza_id);
      if (!ref || ref.tipo !== tipoFilter) return false;
    }
    return matchSearch && matchStatus;
  });

  // Totals for summary
  const totalReferidores = referidores.length;
  const totalVendedores = referidores.filter((r) => r.tipo === "vendedor").length;
  const totalAliados = referidores.filter((r) => r.tipo !== "vendedor").length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 text-lg md:text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-oro" /> Aliados
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Vendedores internos y aliados externos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="w-4 h-4 mr-1" /> Comisiones
          </Button>
          {tipoFilter === "vendedor" && (
            <Button variant="ghost" onClick={() => setShowVendedorConfig(!showVendedorConfig)}>
              <Target className="w-4 h-4 mr-1" /> Config ventas
            </Button>
          )}
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="w-4 h-4 mr-1" /> Cancelar</> : <><Plus className="w-4 h-4 mr-1" /> Nuevo</>}
          </Button>
        </div>
      </div>

      {/* ═══ COMISIONES CONFIG ═══ */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-oro" /> Comisiones por tipo
          </h3>
          <p className="text-gray-500 text-xs">Estos valores se aplican por defecto según el tipo. Puedes personalizar individualmente.</p>
          <div className="space-y-2">
            {Object.entries(comisiones).map(([tipo, monto]) => {
              const cfg = getTipoConfig(tipo);
              const Icon = cfg.icon;
              return (
                <div key={tipo} className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-gray-500 text-sm">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={monto}
                      onChange={(e) => {
                        const v = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                        setComisiones((c) => ({ ...c, [tipo]: v }));
                      }}
                      className="bg-gray-50 text-gray-900 text-sm px-2 py-1.5 rounded border border-gray-200 focus:border-oro/50 focus:outline-none w-32"
                    />
                    <span className="text-gray-500 text-xs">por inscrito</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nuevo tipo (ej: veterano)"
              id="new-tipo"
              className="bg-gray-50 text-gray-900 text-sm px-3 py-1.5 rounded border border-gray-200 focus:border-oro/50 focus:outline-none flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const input = document.getElementById("new-tipo") as HTMLInputElement;
                const tipo = input.value.trim().toLowerCase();
                if (!tipo) return;
                if (comisiones[tipo]) { toast.error("Ese tipo ya existe"); return; }
                setComisiones((c) => ({ ...c, [tipo]: 100000 }));
                input.value = "";
              }}
            >
              <Plus className="w-3 h-3 mr-1" /> Agregar tipo
            </Button>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch("/api/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "comisiones_por_tipo", value: comisiones }),
                  });
                  if (res.ok) toast.success("Comisiones actualizadas");
                  else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Error al guardar"); }
                } catch { toast.error("Error de conexión"); }
              }}
            >
              <Check className="w-4 h-4 mr-1" /> Guardar comisiones
            </Button>
          </div>
        </div>
      )}

      {/* ═══ VENDEDOR CONFIG PANEL ═══ */}
      {showVendedorConfig && (
        <div className="bg-gray-50 border border-oro/20 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-oro/5">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-oro" />
              <span className="text-gray-900 text-sm font-bold">Configuración de vendedores</span>
            </div>
            <button onClick={() => setShowVendedorConfig(false)} className="p-1 text-gray-400 hover:text-gray-900"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-6">
            {/* Comisiones */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-green-600" />
                <h3 className="text-gray-900 text-sm font-bold">Comisiones vendedores</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Tipo de comisión</label>
                  <select value={vConfig.comision_tipo} onChange={(e) => setVConfig((c) => ({ ...c, comision_tipo: e.target.value as ComisionTipo }))} className={`${inputCls} appearance-none`}>
                    <option value="fijo">Monto fijo por cierre</option>
                    <option value="porcentaje">% del valor del plan</option>
                  </select>
                </div>
                {vConfig.comision_tipo === "fijo" ? (
                  <div>
                    <label className={labelCls}>Monto por cierre (COP)</label>
                    <input type="number" value={vConfig.comision_fija} onChange={(e) => setVConfig((c) => ({ ...c, comision_fija: parseInt(e.target.value) || 0 }))} className={inputCls} min="0" step="5000" />
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>Porcentaje (%)</label>
                    <input type="number" value={vConfig.comision_porcentaje} onChange={(e) => setVConfig((c) => ({ ...c, comision_porcentaje: parseInt(e.target.value) || 0 }))} className={inputCls} min="0" max="100" />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Frecuencia de pago</label>
                  <select value={vConfig.pago_frecuencia} onChange={(e) => setVConfig((c) => ({ ...c, pago_frecuencia: e.target.value as PagoFrecuencia }))} className={`${inputCls} appearance-none`}>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Metas */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-600" />
                <h3 className="text-gray-900 text-sm font-bold">Metas y bonificaciones</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Meta mensual (cierres)</label>
                  <input type="number" value={vConfig.meta_mensual} onChange={(e) => setVConfig((c) => ({ ...c, meta_mensual: parseInt(e.target.value) || 0 }))} className={inputCls} min="0" />
                </div>
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-2">
                      Bonificación
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={vConfig.bonificacion_activa} onChange={(e) => setVConfig((c) => ({ ...c, bonificacion_activa: e.target.checked }))} className="sr-only peer" />
                        <div className="w-8 h-4 bg-gray-100 peer-checked:bg-green-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-beige/40 peer-checked:after:bg-green-400 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                    </span>
                  </label>
                  <input type="number" value={vConfig.bonificacion_meta} onChange={(e) => setVConfig((c) => ({ ...c, bonificacion_meta: parseInt(e.target.value) || 0 }))} className={`${inputCls} ${!vConfig.bonificacion_activa ? "opacity-40" : ""}`} min="0" disabled={!vConfig.bonificacion_activa} />
                </div>
                <div>
                  <label className={labelCls}>Monto del bono (COP)</label>
                  <input type="number" value={vConfig.bonificacion_monto} onChange={(e) => setVConfig((c) => ({ ...c, bonificacion_monto: parseInt(e.target.value) || 0 }))} className={`${inputCls} ${!vConfig.bonificacion_activa ? "opacity-40" : ""}`} min="0" step="10000" disabled={!vConfig.bonificacion_activa} />
                </div>
              </div>
            </div>
            {/* Reglas */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-gray-900 text-sm font-bold">Reglas de cierre</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Días máximos para cerrar</label>
                  <input type="number" value={vConfig.dias_para_cerrar} onChange={(e) => setVConfig((c) => ({ ...c, dias_para_cerrar: parseInt(e.target.value) || 30 }))} className={inputCls} min="1" />
                </div>
                <div>
                  <label className={labelCls}>
                    <span className="flex items-center gap-2">
                      Requiere suscriptor activo
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={vConfig.requiere_suscriptor_activo} onChange={(e) => setVConfig((c) => ({ ...c, requiere_suscriptor_activo: e.target.checked }))} className="sr-only peer" />
                        <div className="w-8 h-4 bg-gray-100 peer-checked:bg-green-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-beige/40 peer-checked:after:bg-green-400 after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            {/* Links */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-oro" />
                <h3 className="text-gray-900 text-sm font-bold">Links y mensajes</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>URL base</label>
                  <input type="text" value={vConfig.url_base} onChange={(e) => setVConfig((c) => ({ ...c, url_base: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mensaje WhatsApp</label>
                  <textarea value={vConfig.mensaje_whatsapp} onChange={(e) => setVConfig((c) => ({ ...c, mensaje_whatsapp: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <button onClick={() => { setVConfig(DEFAULT_VENDEDOR_CONFIG); toast.success("Config restaurada"); }} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar
              </button>
              <Button size="sm" onClick={async () => {
                const ok = await setVendedorConfig(vConfig);
                if (ok) { setShowVendedorConfig(false); toast.success("Configuración guardada"); }
                else toast.error("Error al guardar");
              }}>
                <Save className="w-4 h-4" /> Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE FORM ═══ */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-oro" /> Nuevo aliado
          </h3>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">Tipo *</label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(comisiones).map((tipo) => {
                const cfg = getTipoConfig(tipo);
                const Icon = cfg.icon;
                const active = form.tipo === tipo;
                return (
                  <button
                    key={tipo} type="button"
                    onClick={() => setForm((f) => ({ ...f, tipo }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      active ? `${cfg.bg} ${cfg.color} ring-2 ring-current/20` : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                    <span className="text-[10px] opacity-60">({formatMoney(comisiones[tipo] || 0)})</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" required value={form.nombre} onChange={(e) => updateForm("nombre", e.target.value)} placeholder="Nombre completo *" className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <input type="text" required value={form.cedula} onChange={(e) => updateForm("cedula", e.target.value.replace(/\D/g, ""))} placeholder="Cédula *" inputMode="numeric" className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <input type="tel" required value={form.telefono} onChange={(e) => updateForm("telefono", e.target.value.replace(/\D/g, ""))} placeholder="Teléfono *" inputMode="numeric" className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="Email" className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <input type="text" value={form.ciudad} onChange={(e) => updateForm("ciudad", e.target.value)} placeholder="Ciudad" className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            {form.tipo !== "vendedor" ? (
              <>
                <select value={form.rama} onChange={(e) => updateForm("rama", e.target.value)} className="bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer">
                  {RAMAS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="text" value={form.rango} onChange={(e) => updateForm("rango", e.target.value)} placeholder="Rango / Cargo" className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
              </>
            ) : (
              <div className="sm:col-span-2">
                <textarea value={form.notas} onChange={(e) => updateForm("notas", e.target.value)} rows={1} placeholder="Notas internas..." className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none resize-none" />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit"><Check className="w-4 h-4 mr-1" /> Crear</Button>
          </div>
        </form>
      )}

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Total</p>
          <p className="text-gray-900 text-lg md:text-2xl font-bold">{totalReferidores}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Vendedores</p>
          <p className="text-purple-600 text-lg md:text-2xl font-bold">{totalVendedores}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Aliados</p>
          <p className="text-blue-600 text-lg md:text-2xl font-bold">{totalAliados}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Convertidos</p>
          <p className="text-green-600 text-lg md:text-2xl font-bold">{stats.convertidos}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Deuda</p>
          <p className="text-oro text-lg md:text-2xl font-bold">{formatMoney(stats.deudaTotal)}</p>
        </div>
      </div>

      {/* Vendedor config summary bar (when vendedores filtered) */}
      {tipoFilter === "vendedor" && (
        <div className="flex items-center gap-4 text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2">
          <span>Comisión: <span className="text-oro">{vConfig.comision_tipo === "fijo" ? `$${vConfig.comision_fija.toLocaleString()}/cierre` : `${vConfig.comision_porcentaje}%`}</span></span>
          <span className="text-gray-900/10">|</span>
          <span>Meta: <span className="text-purple-600">{vConfig.meta_mensual} cierres/mes</span></span>
          <span className="text-gray-900/10">|</span>
          <span>Pago: <span className="text-blue-600">{vConfig.pago_frecuencia}</span></span>
          {vConfig.bonificacion_activa && (
            <>
              <span className="text-gray-900/10">|</span>
              <span>Bono: <span className="text-green-600">${vConfig.bonificacion_monto.toLocaleString()} al llegar a {vConfig.bonificacion_meta}</span></span>
            </>
          )}
          <button onClick={() => setShowVendedorConfig(true)} className="ml-auto text-oro hover:underline">Editar</button>
        </div>
      )}

      {/* ═══ TIPO FILTER CHIPS ═══ */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTipoFilter("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            tipoFilter === "todos" ? "bg-amber-100 text-oro border-oro/30" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
          }`}
        >
          Todos ({referidores.length})
        </button>
        {Object.keys(comisiones).map((tipo) => {
          const cfg = getTipoConfig(tipo);
          const Icon = cfg.icon;
          const count = referidores.filter((r) => r.tipo === tipo).length;
          const active = tipoFilter === tipo;
          return (
            <button
              key={tipo}
              onClick={() => setTipoFilter(tipo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                active ? `${cfg.bg} ${cfg.color}` : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-3 h-3" /> {cfg.pluralLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => { setTab("referidores"); setSearch(""); setStatusFilter(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "referidores" ? "bg-amber-100 text-oro" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" /> Aliados ({filteredReferidores.length})
        </button>
        <button
          onClick={() => { setTab("leads"); setSearch(""); setStatusFilter(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "leads" ? "bg-amber-100 text-oro" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Leads ({filteredLeads.length})
        </button>
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={tab === "referidores" ? "Buscar aliado..." : "Buscar lead..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 text-gray-700 text-sm pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer">
            {tab === "referidores" ? (
              <>
                <option value="">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </>
            ) : (
              <>
                <option value="">Todos</option>
                <option value="nuevo">Nuevos</option>
                <option value="contactado">Contactados</option>
                <option value="convertido">Convertidos</option>
                <option value="perdido">Perdidos</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* ═══ REFERIDORES LIST ═══ */}
      {tab === "referidores" && (
        filteredReferidores.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay aliados{search || statusFilter ? " con ese filtro" : " registrados"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReferidores.map((r) => {
              const refLeads = leads.filter((ld) => ld.lanza_id === r.id);
              const refConvertidos = refLeads.filter((ld) => ld.status === "convertido").length;
              const comActual = getComisionForReferidor(comisiones, r.tipo, r.comision_personalizada);
              const cfg = getTipoConfig(r.tipo);
              const Icon = cfg.icon;
              const tieneBono = !!(r.meta_bono && r.monto_bono);
              const bonoGanado = tieneBono && refConvertidos >= (r.meta_bono || 0);

              return (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-medium text-sm">{r.nombre}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          r.status === "activo" ? "bg-green-50 text-green-700 border border-green-200" :
                          r.status === "vacaciones" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                          "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                        <span>CC {r.cedula}</span>
                        {r.tipo !== "vendedor" && r.rama && <span>{r.rama} {r.rango && `• ${r.rango}`}</span>}
                        {r.ciudad && <span>{r.ciudad}</span>}
                      </div>
                    </div>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">{formatDate(r.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <a href={`tel:+57${r.telefono}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                      <Phone className="w-3 h-3" /> {r.telefono}
                    </a>
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                        <Mail className="w-3 h-3" /> {r.email}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <span className="text-gray-500"><span className="text-gray-900 font-medium">{refLeads.length}</span> leads</span>
                    <span className="text-green-700"><span className="font-medium">{refConvertidos}</span> convertidos</span>
                    {refConvertidos > 0 && (
                      <span className="text-oro font-medium"><DollarSign className="w-3 h-3 inline" /> {formatMoney(refConvertidos * comActual)}</span>
                    )}
                    <span className="text-gray-500 text-[11px]">
                      Comisión: <span className="text-gray-900 font-medium">{formatMoney(comActual)}</span>
                      {r.comision_personalizada !== null && <span className="text-oro ml-1">(personalizada)</span>}
                    </span>
                  </div>

                  {tieneBono && (
                    <div className={`rounded-lg border p-2.5 ${bonoGanado ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Award className={`w-3.5 h-3.5 ${bonoGanado ? "text-green-700" : "text-oro"}`} />
                          <span className={bonoGanado ? "text-green-700" : "text-amber-800"}>
                            Bono: {formatMoney(r.monto_bono || 0)} al llegar a {r.meta_bono} inscritos
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold ${bonoGanado ? "text-green-700" : "text-amber-800"}`}>{refConvertidos}/{r.meta_bono}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${bonoGanado ? "bg-green-500" : "bg-oro"}`} style={{ width: `${Math.min(100, (refConvertidos / (r.meta_bono || 1)) * 100)}%` }} />
                      </div>
                      {bonoGanado && !r.bono_pagado_at && <p className="text-green-700 text-[10px] font-bold mt-1">¡Bono ganado! Pendiente de pago</p>}
                      {r.bono_pagado_at && <p className="text-green-700 text-[10px] mt-1">Bono pagado el {formatDate(r.bono_pagado_at)}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => handleCopyLink(r.code)} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-oro bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-gray-200">
                      <Copy className="w-3 h-3" /> {r.code}
                    </button>
                    <a href={`https://wa.me/57${r.telefono}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-gray-200">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    <Link href={`/admin/referidores/${r.id}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-oro bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-gray-200">
                      <ChevronRight className="w-3 h-3" /> Ver perfil
                    </Link>
                    <button
                      onClick={async () => {
                        await toggleStatus(r.id);
                        toast.success(r.status === "activo" ? "Desactivado" : "Activado");
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {r.status === "activo" ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                      {r.status === "activo" ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══ LEADS LIST ═══ */}
      {tab === "leads" && (
        filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay leads{search || statusFilter ? " con ese filtro" : " todavía"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((l) => {
              const config = LEAD_STATUS_CONFIG[l.status];
              const StatusIcon = config.icon;
              const ref = referidores.find((r) => r.id === l.lanza_id);
              const comActual = ref ? getComisionForReferidor(comisiones, ref.tipo, ref.comision_personalizada) : 0;
              return (
                <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-medium text-sm">{l.nombre}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                        {l.area_interes && <span>{l.area_interes}</span>}
                        <span>Plan {l.plan_interes}</span>
                        {ref && (
                          <span className="text-oro flex items-center gap-1">
                            via {ref.nombre}
                            <span className="text-[9px] text-gray-400">({getTipoConfig(ref.tipo).label})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">{formatDate(l.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <a href={`tel:+57${l.telefono}`} className="flex items-center gap-1 hover:text-oro"><Phone className="w-3 h-3" /> {l.telefono}</a>
                    {l.email && <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-oro"><Mail className="w-3 h-3" /> {l.email}</a>}
                    {l.cedula && <span>CC {l.cedula}</span>}
                  </div>
                  {l.mensaje && <p className="text-gray-600 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">&ldquo;{l.mensaje}&rdquo;</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`https://wa.me/57${l.telefono}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-gray-200">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    {l.status === "nuevo" && (
                      <Button size="sm" variant="ghost" onClick={async () => { await updateLeadStatus(l.id, "contactado"); toast.success("Marcado como contactado"); }}>Marcar contactado</Button>
                    )}
                    {l.status !== "convertido" && l.status !== "perdido" && (
                      <Button size="sm" onClick={async () => { await updateLeadStatus(l.id, "convertido"); toast.success(`Lead convertido — ${formatMoney(comActual)} para ${ref?.nombre || "el aliado"}`); }}>
                        <Check className="w-3 h-3 mr-1" /> Convertir — {formatMoney(comActual)}
                      </Button>
                    )}
                    {l.status !== "perdido" && l.status !== "convertido" && (
                      <button onClick={async () => { await updateLeadStatus(l.id, "perdido"); toast("Lead marcado como perdido"); }} className="text-xs text-gray-400 hover:text-red-600">Marcar perdido</button>
                    )}
                  </div>
                  {l.status === "convertido" && ref && (
                    <p className="text-green-700 text-[10px]">Se le debe {formatMoney(comActual)} a {ref.nombre} ({getTipoConfig(ref.tipo).label})</p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Debt summary */}
      {stats.deudaTotal > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-oro font-bold text-sm">Deuda total a aliados</p>
            <p className="text-gray-500 text-xs">{stats.convertidos} convertido{stats.convertidos !== 1 ? "s" : ""} + bonos pendientes</p>
          </div>
          <p className="text-oro text-xl md:text-2xl font-bold">{formatMoney(stats.deudaTotal)}</p>
        </div>
      )}
    </div>
  );
}
