"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSuscriptores, updateSuscriptor } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  Plus, Search, Users, UserPlus, CheckCircle, XCircle, Undo2,
  Phone, Mail, Calendar, Shield, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { triggerMail } from "@/lib/send-mail";

type Tab = "nuevos" | "suscriptores";

export default function SuscriptoresPage() {
  const queryClient = useQueryClient();

  // ── Tab & filters ──
  const [tab, setTab] = useState<Tab>("nuevos");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [pagoFilter, setPagoFilter] = useState("");

  // ── Data ──
  const { data: nuevos } = useQuery({
    queryKey: ["suscriptores-pendientes"],
    queryFn: () => getSuscriptores({ estado_pago: "Pendiente" }),
  });

  const { data: suscriptores } = useQuery({
    queryKey: ["suscriptores-activos", search, planFilter, pagoFilter],
    queryFn: () => getSuscriptores({
      search,
      plan: planFilter || undefined,
      estado_pago: pagoFilter || undefined,
      orderBy: "updated_at",
    }),
  });

  // Excluir pendientes de la tabla de suscriptores (van en su propia tab)
  const suscriptoresActivos = suscriptores?.filter((s) => s.estado_pago !== "Pendiente") || [];

  const nuevosCount = nuevos?.length || 0;
  const activeTab = nuevosCount === 0 && tab === "nuevos" ? "suscriptores" : tab;

  // ── Actions ──
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"aprobar" | "rechazar" | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["suscriptores"] });
    queryClient.invalidateQueries({ queryKey: ["suscriptores-activos"] });
    queryClient.invalidateQueries({ queryKey: ["suscriptores-pendientes"] });
  };

  const handleAprobar = async (id: string, nombre: string, email?: string, plan?: string) => {
    setLoadingId(id);
    setLoadingAction("aprobar");
    try {
      await updateSuscriptor(id, { estado_pago: "Al dia" });
      invalidateAll();
      toast.success(`${nombre} admitido como suscriptor`);
      // Enviar email de bienvenida
      if (email) {
        triggerMail({
          slug: "bienvenida",
          to: email,
          variables: { nombre, plan: plan || "Base", email, fecha: new Date().toLocaleDateString("es-CO") },
        }).then((sent) => { if (sent) toast.success(`Email de bienvenida enviado a ${email}`); });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aprobar");
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  const handleDevolverAPendiente = async (id: string, nombre: string) => {
    if (!confirm(`¿Devolver a "${nombre}" a Nuevos Inscritos?`)) return;
    setLoadingId(id);
    setLoadingAction("rechazar");
    try {
      await updateSuscriptor(id, { estado_pago: "Pendiente" });
      invalidateAll();
      toast.success(`${nombre} devuelto a Nuevos Inscritos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al devolver");
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  const handleRechazar = async (id: string, nombre: string, email?: string) => {
    if (!confirm(`¿Rechazar la inscripción de "${nombre}"?\n\nSe marcará como Vencido y no tendrá acceso.`)) return;
    setLoadingId(id);
    setLoadingAction("rechazar");
    try {
      await updateSuscriptor(id, { estado_pago: "Vencido" });
      invalidateAll();
      toast.success(`Inscripción de ${nombre} rechazada`);
      // Enviar email de rechazo
      if (email) {
        triggerMail({
          slug: "inscripcion-rechazada",
          to: email,
          variables: { nombre, email },
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al rechazar");
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  const timeSince = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days} días`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-lg font-bold">Suscriptores</h1>
        <Link href="/admin/suscriptores/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setTab("nuevos")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "nuevos"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "text-beige/50 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Nuevos Inscritos
          {nuevosCount > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              activeTab === "nuevos"
                ? "bg-yellow-500/30 text-yellow-300"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {nuevosCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("suscriptores")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "suscriptores"
              ? "bg-green-500/15 text-green-400 border border-green-500/20"
              : "text-beige/50 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Users className="w-4 h-4" />
          Suscriptores
          <span className="text-xs text-beige/30">{suscriptoresActivos.length}</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB: Nuevos Inscritos                                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === "nuevos" && (
        <>
          {nuevosCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-green-500/50" />
              </div>
              <p className="text-white font-medium">Todo al día</p>
              <p className="text-beige/40 text-sm mt-1">No hay inscripciones pendientes de revisión</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-beige/40 text-xs px-1">
                {nuevosCount} {nuevosCount === 1 ? "persona se inscribió" : "personas se inscribieron"} y {nuevosCount === 1 ? "espera" : "esperan"} tu aprobación
              </p>

              {nuevos?.map((s) => {
                const isLoading = loadingId === s.id;

                return (
                  <div
                    key={s.id}
                    className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all ${
                      isLoading ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {/* Card content */}
                    <Link
                      href={`/admin/suscriptores/${s.id}`}
                      className="block p-4 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{s.nombre}</p>
                            <p className="text-beige/40 text-xs mt-0.5">
                              {s.rango} — {s.rama}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge size="xs">{s.plan}</Badge>
                          <ChevronRight className="w-4 h-4 text-beige/20" />
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 ml-[52px] text-xs text-beige/50">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {s.cedula}
                        </span>
                        {s.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {s.telefono}
                          </span>
                        )}
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {s.email}
                          </span>
                        )}
                        {(s.created_at || s.fecha_inicio) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {timeSince(s.created_at || s.fecha_inicio)}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Action bar */}
                    <div className="flex border-t border-white/10">
                      <button
                        onClick={() => handleAprobar(s.id, s.nombre, s.email, s.plan)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isLoading && loadingAction === "aprobar" ? "Aprobando..." : "Admitir"}
                      </button>
                      <div className="w-px bg-white/10" />
                      <button
                        onClick={() => handleRechazar(s.id, s.nombre, s.email)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-beige/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4" />
                        {isLoading && loadingAction === "rechazar" ? "Rechazando..." : "Rechazar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB: Suscriptores activos                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === "suscriptores" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none"
              >
                <option value="" className="bg-jungle-dark">Plan</option>
                <option value="Base" className="bg-jungle-dark">Base</option>
                <option value="Plus" className="bg-jungle-dark">Plus</option>
                <option value="Elite" className="bg-jungle-dark">Elite</option>
              </select>
              <select
                value={pagoFilter}
                onChange={(e) => setPagoFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none"
              >
                <option value="" className="bg-jungle-dark">Estado</option>
                <option value="Al dia" className="bg-jungle-dark">Al dia</option>
                <option value="Vencido" className="bg-jungle-dark">Vencido</option>
              </select>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {suscriptoresActivos.map((s) => (
              <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <Link
                  href={`/admin/suscriptores/${s.id}`}
                  className="block p-3.5 hover:bg-white/[0.07] transition-colors active:bg-white/10"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white text-sm font-medium truncate flex-1">{s.nombre}</p>
                    <Badge size="xs">{s.estado_pago}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-beige/50 text-xs">
                    <span>{s.rango}</span>
                    <span>·</span>
                    <span>{s.rama}</span>
                    <span className="ml-auto"><Badge size="xs">{s.plan}</Badge></span>
                  </div>
                </Link>
                <button
                  onClick={() => handleDevolverAPendiente(s.id, s.nombre)}
                  disabled={loadingId === s.id}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-beige/40 hover:text-yellow-400 hover:bg-yellow-500/10 border-t border-white/10 transition-colors disabled:opacity-40"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Devolver a Nuevos Inscritos
                </button>
              </div>
            ))}
            {suscriptoresActivos.length === 0 && (
              <p className="text-center text-beige/40 text-sm py-8">Sin resultados</p>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-beige/50 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Rama</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Desde</th>
                    <th className="text-right px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {suscriptoresActivos.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/suscriptores/${s.id}`} className="text-white hover:text-oro transition-colors font-medium">
                          {s.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-beige/60">{s.telefono}</td>
                      <td className="px-4 py-3 text-beige/60 hidden lg:table-cell">{s.rama}</td>
                      <td className="px-4 py-3"><Badge>{s.plan}</Badge></td>
                      <td className="px-4 py-3"><Badge>{s.estado_pago}</Badge></td>
                      <td className="px-4 py-3 text-beige/40 hidden lg:table-cell">
                        {formatDate(s.fecha_inicio)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDevolverAPendiente(s.id, s.nombre)}
                          disabled={loadingId === s.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg text-beige/40 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-40"
                          title="Devolver a Nuevos Inscritos"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {suscriptoresActivos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-beige/40 text-sm py-8">
                        Sin resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
