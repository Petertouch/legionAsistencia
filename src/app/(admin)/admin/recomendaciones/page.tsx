"use client";

import { useState, useEffect } from "react";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import Button from "@/components/ui/button";
import { Gift, Check, Clock, Phone, Mail, DollarSign, Copy, MessageCircle, Search, Filter, Users, UserPlus, ToggleLeft, ToggleRight, Plus, X } from "lucide-react";
import { toast } from "sonner";

const LEAD_STATUS_CONFIG = {
  nuevo: { label: "Nuevo", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  contactado: { label: "Contactado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Phone },
  convertido: { label: "Convertido", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: Check },
  perdido: { label: "Perdido", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: Clock },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

export default function RecomendacionesPage() {
  const { lanzas, leads, toggleLanzaStatus, updateLeadStatus, registerLanza, fetchAll, loaded } = useLanzaStore();
  const [tab, setTab] = useState<"lanzas" | "leads">("lanzas");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", cedula: "", telefono: "", email: "", ciudad: "", rama: "Ejército", rango: "" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!loaded) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>;

  const totalLeads = leads.length;
  const convertidos = leads.filter((l) => l.status === "convertido").length;
  const deudaTotal = convertidos * 50000;

  const RAMAS = ["Ejército", "Policía", "Armada", "Fuerza Aérea", "Civil", "Otro"];

  const updateForm = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleCreateLanza = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.cedula.trim() || !form.telefono.trim()) {
      toast.error("Nombre, cédula y teléfono son obligatorios");
      return;
    }
    const existing = lanzas.find((l) => l.cedula === form.cedula.trim());
    if (existing) {
      toast.error("Ya existe un Lanza con esa cédula");
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
      suscriptor_id: null,
    });
    if (lanza) {
      toast.success(`Lanza creado — código: ${lanza.code}`);
      setForm({ nombre: "", cedula: "", telefono: "", email: "", ciudad: "", rama: "Ejército", rango: "" });
      setShowForm(false);
    } else {
      toast.error("Error al crear el Lanza");
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
    return matchSearch && matchStatus;
  });

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.nombre.toLowerCase().includes(q) || l.telefono.includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-lg md:text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-oro" /> Lanzas & Referidos
          </h2>
          <p className="text-beige/40 text-xs md:text-sm mt-0.5">
            Red de recomendadores — $50.000 por cada cliente convertido
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="w-4 h-4 mr-1" /> Cancelar</> : <><Plus className="w-4 h-4 mr-1" /> Nuevo Lanza</>}
        </Button>
      </div>

      {/* Create Lanza Form */}
      {showForm && (
        <form onSubmit={handleCreateLanza} className="bg-white/5 border border-oro/20 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-oro" /> Registrar nuevo Lanza
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" required value={form.nombre} onChange={(e) => updateForm("nombre", e.target.value)}
              placeholder="Nombre completo *"
              className="bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none" />
            <input type="text" required value={form.cedula} onChange={(e) => updateForm("cedula", e.target.value.replace(/\D/g, ""))}
              placeholder="Cédula *" inputMode="numeric"
              className="bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none" />
            <input type="tel" required value={form.telefono} onChange={(e) => updateForm("telefono", e.target.value.replace(/\D/g, ""))}
              placeholder="Teléfono *" inputMode="numeric"
              className="bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)}
              placeholder="Email"
              className="bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none" />
            <input type="text" value={form.ciudad} onChange={(e) => updateForm("ciudad", e.target.value)}
              placeholder="Ciudad"
              className="bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none" />
            <select value={form.rama} onChange={(e) => updateForm("rama", e.target.value)}
              className="bg-white/5 text-beige/70 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer">
              {RAMAS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="text" value={form.rango} onChange={(e) => updateForm("rango", e.target.value)}
              placeholder="Rango / Cargo"
              className="bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">
              <Check className="w-4 h-4 mr-1" /> Crear Lanza
            </Button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Lanzas</p>
          <p className="text-white text-lg md:text-2xl font-bold">{lanzas.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Leads</p>
          <p className="text-white text-lg md:text-2xl font-bold">{totalLeads}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Convertidos</p>
          <p className="text-green-400 text-lg md:text-2xl font-bold">{convertidos}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
          <p className="text-beige/40 text-[10px] md:text-xs">Deuda</p>
          <p className="text-oro text-lg md:text-2xl font-bold">{formatMoney(deudaTotal)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => { setTab("lanzas"); setSearch(""); setStatusFilter(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "lanzas" ? "bg-oro/15 text-oro" : "text-beige/50 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> Lanzas ({lanzas.length})
        </button>
        <button
          onClick={() => { setTab("leads"); setSearch(""); setStatusFilter(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "leads" ? "bg-oro/15 text-oro" : "text-beige/50 hover:text-white"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Leads ({totalLeads})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input
            type="text"
            placeholder={tab === "lanzas" ? "Buscar lanza..." : "Buscar lead..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 text-white placeholder-beige/30 text-sm pl-9 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 text-beige/70 text-sm pl-9 pr-8 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
          >
            {tab === "lanzas" ? (
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

      {/* Lanzas Tab */}
      {tab === "lanzas" && (
        filteredLanzas.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-beige/20 mx-auto mb-3" />
            <p className="text-beige/40 text-sm">No hay lanzas{search || statusFilter ? " con ese filtro" : " registrados"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLanzas.map((l) => {
              const lanzaLeads = leads.filter((ld) => ld.lanza_id === l.id);
              const lanzaConvertidos = lanzaLeads.filter((ld) => ld.status === "convertido").length;
              return (
                <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{l.nombre}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          l.status === "activo" ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-beige/40 text-xs mt-1">
                        <span>CC {l.cedula}</span>
                        <span>{l.rama} {l.rango && `• ${l.rango}`}</span>
                        {l.ciudad && <span>{l.ciudad}</span>}
                      </div>
                    </div>
                    <span className="text-beige/30 text-[10px] flex-shrink-0">{formatDate(l.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-beige/50">
                    <a href={`tel:+57${l.telefono}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                      <Phone className="w-3 h-3" /> {l.telefono}
                    </a>
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-oro transition-colors">
                        <Mail className="w-3 h-3" /> {l.email}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-beige/50">
                      <span className="text-white font-medium">{lanzaLeads.length}</span> leads
                    </span>
                    <span className="text-green-400">
                      <span className="font-medium">{lanzaConvertidos}</span> convertidos
                    </span>
                    {lanzaConvertidos > 0 && (
                      <span className="text-oro font-medium">
                        <DollarSign className="w-3 h-3 inline" /> {formatMoney(lanzaConvertidos * 50000)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopyLink(l.code)}
                      className="flex items-center gap-1.5 text-xs text-beige/50 hover:text-oro bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-oro/10 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Link: {l.code}
                    </button>
                    <a
                      href={`https://wa.me/57${l.telefono}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-beige/50 hover:text-green-400 bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    <button
                      onClick={async () => {
                        await toggleLanzaStatus(l.id);
                        toast.success(l.status === "activo" ? "Lanza desactivado" : "Lanza activado");
                      }}
                      className="flex items-center gap-1.5 text-xs text-beige/50 hover:text-white bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
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
            <UserPlus className="w-10 h-10 text-beige/20 mx-auto mb-3" />
            <p className="text-beige/40 text-sm">No hay leads{search || statusFilter ? " con ese filtro" : " todavía"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((l) => {
              const config = LEAD_STATUS_CONFIG[l.status];
              const StatusIcon = config.icon;
              const lanza = lanzas.find((lz) => lz.id === l.lanza_id);
              return (
                <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{l.nombre}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-beige/40 text-xs mt-1">
                        {l.area_interes && <span>{l.area_interes}</span>}
                        <span>Plan {l.plan_interes}</span>
                        {lanza && <span className="text-oro">via {lanza.nombre}</span>}
                      </div>
                    </div>
                    <span className="text-beige/30 text-[10px] flex-shrink-0">{formatDate(l.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-beige/50">
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
                    <p className="text-beige/40 text-xs bg-white/5 rounded-lg px-3 py-2">
                      &ldquo;{l.mensaje}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://wa.me/57${l.telefono}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-beige/50 hover:text-green-400 bg-white/5 px-2.5 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                    {l.status === "nuevo" && (
                      <Button size="sm" variant="ghost" onClick={async () => { await updateLeadStatus(l.id, "contactado"); toast.success("Marcado como contactado"); }}>
                        Marcar contactado
                      </Button>
                    )}
                    {l.status !== "convertido" && l.status !== "perdido" && (
                      <Button size="sm" onClick={async () => { await updateLeadStatus(l.id, "convertido"); toast.success("Lead convertido — $50.000 para el Lanza"); }}>
                        <Check className="w-3 h-3 mr-1" /> Convertir — {formatMoney(50000)}
                      </Button>
                    )}
                    {l.status !== "perdido" && l.status !== "convertido" && (
                      <button
                        onClick={async () => { await updateLeadStatus(l.id, "perdido"); toast("Lead marcado como perdido"); }}
                        className="text-xs text-beige/30 hover:text-red-400 transition-colors"
                      >
                        Marcar perdido
                      </button>
                    )}
                  </div>

                  {l.status === "convertido" && lanza && (
                    <p className="text-green-400/60 text-[10px]">
                      Se le debe {formatMoney(50000)} a {lanza.nombre}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Debt summary */}
      {deudaTotal > 0 && (
        <div className="bg-oro/5 border border-oro/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-oro font-bold text-sm">Deuda total a Lanzas</p>
            <p className="text-beige/40 text-xs">{convertidos} lead{convertidos !== 1 ? "s" : ""} convertido{convertidos !== 1 ? "s" : ""}</p>
          </div>
          <p className="text-oro text-xl md:text-2xl font-bold">{formatMoney(deudaTotal)}</p>
        </div>
      )}
    </div>
  );
}
