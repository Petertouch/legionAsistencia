"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanzaStore, type Lanza, type AliadoTipo } from "@/lib/stores/lanza-store";
import {
  getComisionesPorTipo,
  setComisionesPorTipo,
  getComisionForAliado,
  type ComisionesPorTipo,
} from "@/lib/config";
import Button from "@/components/ui/button";
import {
  Gift, Check, Clock, Phone, Mail, DollarSign, Copy, MessageCircle,
  Search, Filter, Users, UserPlus, ToggleLeft, ToggleRight, Plus, X,
  Pencil, Award, Shield, Heart, Settings, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const LEAD_STATUS_CONFIG = {
  nuevo: { label: "Nuevo", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  contactado: { label: "Contactado", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Phone },
  convertido: { label: "Convertido", color: "bg-green-50 text-green-700 border-green-200", icon: Check },
  perdido: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200", icon: Clock },
};

const TIPO_CONFIG: Record<string, { label: string; pluralLabel: string; icon: typeof Shield; color: string; bg: string }> = {
  lanza: { label: "Lanza", pluralLabel: "Lanzas", icon: Shield, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  esposa: { label: "Esposa", pluralLabel: "Esposas", icon: Heart, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
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

export default function RecomendacionesPage() {
  const lanzas = useLanzaStore((s) => s.lanzas);
  const leads = useLanzaStore((s) => s.leads);
  const toggleLanzaStatus = useLanzaStore((s) => s.toggleLanzaStatus);
  const updateLeadStatus = useLanzaStore((s) => s.updateLeadStatus);
  const updateLanza = useLanzaStore((s) => s.updateLanza);
  const registerLanza = useLanzaStore((s) => s.registerLanza);
  const fetchAll = useLanzaStore((s) => s.fetchAll);
  const loaded = useLanzaStore((s) => s.loaded);

  const [tab, setTab] = useState<"aliados" | "leads">("aliados");
  const [tipoFilter, setTipoFilter] = useState<"todos" | AliadoTipo>("todos");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [form, setForm] = useState({
    nombre: "", cedula: "", telefono: "", email: "", ciudad: "",
    rama: "Ejército", rango: "", tipo: "lanza" as AliadoTipo,
  });
  const [comisiones, setComisiones] = useState<ComisionesPorTipo>({ lanza: 100000, esposa: 100000 });
  const [editingAliado, setEditingAliado] = useState<Lanza | null>(null);

  useEffect(() => {
    fetchAll();
    getComisionesPorTipo().then(setComisiones);
  }, [fetchAll]);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const convertidos = leads.filter((l) => l.status === "convertido").length;
    let deudaTotal = 0;
    lanzas.forEach((lanza) => {
      const cv = leads.filter((l) => l.lanza_id === lanza.id && l.status === "convertido").length;
      const com = getComisionForAliado(comisiones, lanza.tipo, lanza.comision_personalizada);
      deudaTotal += cv * com;

      // Check bonos
      if (lanza.meta_bono && lanza.monto_bono && cv >= lanza.meta_bono && !lanza.bono_pagado_at) {
        deudaTotal += lanza.monto_bono;
      }
    });
    return { totalLeads, convertidos, deudaTotal };
  }, [lanzas, leads, comisiones]);

  if (!loaded) {
    return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-xl" />)}</div>;
  }

  const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea", "Civil", "Otro"];

  const updateForm = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleCreateAliado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.cedula.trim() || !form.telefono.trim()) {
      toast.error("Nombre, cédula y teléfono son obligatorios");
      return;
    }
    const existing = lanzas.find((l) => l.cedula === form.cedula.trim());
    if (existing) {
      toast.error(`Ya existe un aliado con esa cédula (${getTipoConfig(existing.tipo).label})`);
      return;
    }
    const lanza = await registerLanza({
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
    });
    if (lanza) {
      toast.success(`${getTipoConfig(form.tipo).label} creado — código: ${lanza.code}`);
      setForm({ nombre: "", cedula: "", telefono: "", email: "", ciudad: "", rama: "Ejército", rango: "", tipo: "lanza" });
      setShowForm(false);
    } else {
      toast.error("Error al crear el aliado");
    }
  };

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast.success("Link copiado");
  };

  const filteredLanzas = lanzas.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.nombre.toLowerCase().includes(q) || l.cedula.includes(q) || l.telefono.includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchTipo = tipoFilter === "todos" || l.tipo === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.nombre.toLowerCase().includes(q) || l.telefono.includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    if (tipoFilter !== "todos") {
      const lanza = lanzas.find((lz) => lz.id === l.lanza_id);
      if (!lanza || lanza.tipo !== tipoFilter) return false;
    }
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 text-lg md:text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-oro" /> Aliados & Referidos
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Red de recomendadores que generan inscripciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="w-4 h-4 mr-1" /> Comisiones
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="w-4 h-4 mr-1" /> Cancelar</> : <><Plus className="w-4 h-4 mr-1" /> Nuevo Aliado</>}
          </Button>
        </div>
      </div>

      {/* Comisiones Config */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-oro" /> Comisiones por tipo
          </h3>
          <p className="text-gray-500 text-xs">Estos valores se aplican por defecto a cada aliado nuevo según su tipo. Puedes personalizar la comisión de cada aliado individualmente desde su perfil.</p>
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
                const ok = await setComisionesPorTipo(comisiones);
                if (ok) toast.success("Comisiones actualizadas");
                else toast.error("Error al guardar");
              }}
            >
              <Check className="w-4 h-4 mr-1" /> Guardar comisiones
            </Button>
          </div>
        </div>
      )}

      {/* Create Aliado Form */}
      {showForm && (
        <form onSubmit={handleCreateAliado} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-oro" /> Registrar nuevo aliado
          </h3>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">Tipo de aliado *</label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(comisiones).map((tipo) => {
                const cfg = getTipoConfig(tipo);
                const Icon = cfg.icon;
                const active = form.tipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
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
            <input type="text" required value={form.nombre} onChange={(e) => updateForm("nombre", e.target.value)}
              placeholder="Nombre completo *"
              className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <input type="text" required value={form.cedula} onChange={(e) => updateForm("cedula", e.target.value.replace(/\D/g, ""))}
              placeholder="Cédula *" inputMode="numeric"
              className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <input type="tel" required value={form.telefono} onChange={(e) => updateForm("telefono", e.target.value.replace(/\D/g, ""))}
              placeholder="Teléfono *" inputMode="numeric"
              className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)}
              placeholder="Email"
              className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <input type="text" value={form.ciudad} onChange={(e) => updateForm("ciudad", e.target.value)}
              placeholder="Ciudad"
              className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
            <select value={form.rama} onChange={(e) => updateForm("rama", e.target.value)}
              className="bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer">
              {RAMAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="text" value={form.rango} onChange={(e) => updateForm("rango", e.target.value)}
              placeholder="Rango / Cargo"
              className="bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">
              <Check className="w-4 h-4 mr-1" /> Crear Aliado
            </Button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Aliados</p>
          <p className="text-gray-900 text-lg md:text-2xl font-bold">{lanzas.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm">
          <p className="text-gray-500 text-[10px] md:text-xs">Leads</p>
          <p className="text-gray-900 text-lg md:text-2xl font-bold">{stats.totalLeads}</p>
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

      {/* Tipo filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTipoFilter("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            tipoFilter === "todos" ? "bg-amber-100 text-oro border-oro/30" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
          }`}
        >
          Todos ({lanzas.length})
        </button>
        {Object.keys(comisiones).map((tipo) => {
          const cfg = getTipoConfig(tipo);
          const Icon = cfg.icon;
          const count = lanzas.filter((l) => l.tipo === tipo).length;
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => { setTab("aliados"); setSearch(""); setStatusFilter(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "aliados" ? "bg-amber-100 text-oro" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" /> Aliados ({filteredLanzas.length})
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={tab === "aliados" ? "Buscar aliado..." : "Buscar lead..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 text-sm pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 text-gray-700 text-sm pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none appearance-none cursor-pointer"
          >
            {tab === "aliados" ? (
              <>
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </>
            ) : (
              <>
                <option value="">Todos los estados</option>
                <option value="nuevo">Nuevos</option>
                <option value="contactado">Contactados</option>
                <option value="convertido">Convertidos</option>
                <option value="perdido">Perdidos</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Aliados Tab */}
      {tab === "aliados" && (
        filteredLanzas.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay aliados{search || statusFilter ? " con ese filtro" : " registrados"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLanzas.map((l) => {
              const lanzaLeads = leads.filter((ld) => ld.lanza_id === l.id);
              const lanzaConvertidos = lanzaLeads.filter((ld) => ld.status === "convertido").length;
              const comActual = getComisionForAliado(comisiones, l.tipo, l.comision_personalizada);
              const cfg = getTipoConfig(l.tipo);
              const Icon = cfg.icon;
              const tieneBono = !!(l.meta_bono && l.monto_bono);
              const bonoGanado = tieneBono && lanzaConvertidos >= (l.meta_bono || 0);

              return (
                <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-medium text-sm">{l.nombre}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          l.status === "activo" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                        <span>CC {l.cedula}</span>
                        <span>{l.rama} {l.rango && `• ${l.rango}`}</span>
                        {l.ciudad && <span>{l.ciudad}</span>}
                      </div>
                    </div>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">{formatDate(l.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <a href={`tel:+57${l.telefono}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                      <Phone className="w-3 h-3" /> {l.telefono}
                    </a>
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                        <Mail className="w-3 h-3" /> {l.email}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <span className="text-gray-500">
                      <span className="text-gray-900 font-medium">{lanzaLeads.length}</span> leads
                    </span>
                    <span className="text-green-700">
                      <span className="font-medium">{lanzaConvertidos}</span> convertidos
                    </span>
                    {lanzaConvertidos > 0 && (
                      <span className="text-oro font-medium">
                        <DollarSign className="w-3 h-3 inline" /> {formatMoney(lanzaConvertidos * comActual)}
                      </span>
                    )}
                    <span className="text-gray-500 text-[11px]">
                      Comisión por inscrito: <span className="text-gray-900 font-medium">{formatMoney(comActual)}</span>
                      {l.comision_personalizada !== null && <span className="text-oro ml-1">(personalizada)</span>}
                    </span>
                  </div>

                  {/* Bono progress */}
                  {tieneBono && (
                    <div className={`rounded-lg border p-2.5 ${bonoGanado ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Award className={`w-3.5 h-3.5 ${bonoGanado ? "text-green-700" : "text-oro"}`} />
                          <span className={bonoGanado ? "text-green-700" : "text-amber-800"}>
                            Bono: {formatMoney(l.monto_bono || 0)} al llegar a {l.meta_bono} inscritos
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold ${bonoGanado ? "text-green-700" : "text-amber-800"}`}>
                          {lanzaConvertidos}/{l.meta_bono}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${bonoGanado ? "bg-green-500" : "bg-oro"}`}
                          style={{ width: `${Math.min(100, (lanzaConvertidos / (l.meta_bono || 1)) * 100)}%` }}
                        />
                      </div>
                      {bonoGanado && !l.bono_pagado_at && (
                        <p className="text-green-700 text-[10px] font-bold mt-1">¡Bono ganado! Pendiente de pago</p>
                      )}
                      {l.bono_pagado_at && (
                        <p className="text-green-700 text-[10px] mt-1">Bono pagado el {formatDate(l.bono_pagado_at)}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopyLink(l.code)}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-oro bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-gray-200"
                    >
                      <Copy className="w-3 h-3" /> {l.code}
                    </button>
                    <a
                      href={`https://wa.me/57${l.telefono}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-gray-200"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    <Link
                      href={`/admin/recomendaciones/${l.id}`}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-oro bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-gray-200"
                    >
                      <ChevronRight className="w-3 h-3" /> Ver perfil
                    </Link>
                    <button
                      onClick={async () => {
                        await toggleLanzaStatus(l.id);
                        toast.success(l.status === "activo" ? "Aliado desactivado" : "Aliado activado");
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {l.status === "activo" ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                      {l.status === "activo" ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Leads Tab */}
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
              const lanza = lanzas.find((lz) => lz.id === l.lanza_id);
              const comActual = lanza ? getComisionForAliado(comisiones, lanza.tipo, lanza.comision_personalizada) : 0;
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
                        {lanza && (
                          <span className="text-oro flex items-center gap-1">
                            via {lanza.nombre}
                            <span className="text-[9px] text-gray-400">({getTipoConfig(lanza.tipo).label})</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 text-[10px] flex-shrink-0">{formatDate(l.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <a href={`tel:+57${l.telefono}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                      <Phone className="w-3 h-3" /> {l.telefono}
                    </a>
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                        <Mail className="w-3 h-3" /> {l.email}
                      </a>
                    )}
                    {l.cedula && <span>CC {l.cedula}</span>}
                  </div>

                  {l.mensaje && (
                    <p className="text-gray-600 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      &ldquo;{l.mensaje}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://wa.me/57${l.telefono}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-700 bg-gray-50 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-gray-200"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    {l.status === "nuevo" && (
                      <Button size="sm" variant="ghost" onClick={async () => { await updateLeadStatus(l.id, "contactado"); toast.success("Marcado como contactado"); }}>
                        Marcar contactado
                      </Button>
                    )}
                    {l.status !== "convertido" && l.status !== "perdido" && (
                      <Button size="sm" onClick={async () => { await updateLeadStatus(l.id, "convertido"); toast.success(`Lead convertido — ${formatMoney(comActual)} para ${lanza?.nombre || "el aliado"}`); }}>
                        <Check className="w-3 h-3 mr-1" /> Convertir — {formatMoney(comActual)}
                      </Button>
                    )}
                    {l.status !== "perdido" && l.status !== "convertido" && (
                      <button
                        onClick={async () => { await updateLeadStatus(l.id, "perdido"); toast("Lead marcado como perdido"); }}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Marcar perdido
                      </button>
                    )}
                  </div>

                  {l.status === "convertido" && lanza && (
                    <p className="text-green-700 text-[10px]">
                      Se le debe {formatMoney(comActual)} a {lanza.nombre} ({getTipoConfig(lanza.tipo).label})
                    </p>
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
            <p className="text-gray-500 text-xs">{stats.convertidos} lead{stats.convertidos !== 1 ? "s" : ""} convertido{stats.convertidos !== 1 ? "s" : ""} + bonos pendientes</p>
          </div>
          <p className="text-oro text-xl md:text-2xl font-bold">{formatMoney(stats.deudaTotal)}</p>
        </div>
      )}

      {/* Edit Aliado Modal */}
      {editingAliado && (
        <EditAliadoModal
          aliado={editingAliado}
          comisionDefault={comisiones[editingAliado.tipo] || 100000}
          leads={leads.filter((l) => l.lanza_id === editingAliado.id && l.status === "convertido").length}
          onClose={() => setEditingAliado(null)}
          onSave={async (updates) => {
            try {
              await updateLanza(editingAliado.id, updates);
              toast.success("Aliado actualizado");
              setEditingAliado(null);
            } catch {
              toast.error("Error al actualizar");
            }
          }}
        />
      )}
    </div>
  );
}

function EditAliadoModal({
  aliado, comisionDefault, leads, onClose, onSave,
}: {
  aliado: Lanza;
  comisionDefault: number;
  leads: number;
  onClose: () => void;
  onSave: (updates: Partial<Lanza>) => Promise<void>;
}) {
  const [comisionPersonalizada, setComisionPersonalizada] = useState<string>(
    aliado.comision_personalizada !== null ? String(aliado.comision_personalizada) : ""
  );
  const [metaBono, setMetaBono] = useState<string>(aliado.meta_bono ? String(aliado.meta_bono) : "");
  const [montoBono, setMontoBono] = useState<string>(aliado.monto_bono ? String(aliado.monto_bono) : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Lanza> = {
      comision_personalizada: comisionPersonalizada ? parseInt(comisionPersonalizada, 10) : null,
      meta_bono: metaBono ? parseInt(metaBono, 10) : null,
      monto_bono: montoBono ? parseInt(montoBono, 10) : null,
    };
    await onSave(updates);
  };

  const cfg = TIPO_CONFIG[aliado.tipo] || { label: aliado.tipo, icon: Users, color: "text-gray-700", bg: "bg-gray-100 border-gray-200", pluralLabel: aliado.tipo + "s" };
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-gray-900 font-bold flex items-center gap-2">
            <Pencil className="w-4 h-4 text-oro" /> Editar aliado
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-gray-900 font-medium">{aliado.nombre}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                <Icon className="w-3 h-3" /> {cfg.label}
              </span>
              <span className="text-gray-400 text-xs">{aliado.code}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-oro" /> Comisión
            </h4>
            <p className="text-gray-500 text-xs mb-2">
              Por defecto: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(comisionDefault)} (de tipo {cfg.label})
            </p>
            <label className="text-gray-600 text-xs font-medium mb-1 block">Comisión personalizada (opcional)</label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={comisionPersonalizada}
                onChange={(e) => setComisionPersonalizada(e.target.value.replace(/\D/g, ""))}
                placeholder="Dejar vacío para usar la del tipo"
                className="bg-gray-50 text-gray-900 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-oro" /> Bono por cumplimiento
            </h4>
            <p className="text-gray-500 text-xs mb-3">
              Llevarás un seguimiento del progreso. Cuando alcance la meta, el bono se suma a la deuda.
            </p>
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
            {metaBono && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-amber-800 font-medium">Progreso actual</span>
                  <span className="text-amber-800 font-bold">{leads}/{metaBono}</span>
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-oro transition-all"
                    style={{ width: `${Math.min(100, (leads / parseInt(metaBono, 10)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit"><Check className="w-4 h-4 mr-1" /> Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
