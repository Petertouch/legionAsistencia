"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSuscriptores, updateSuscriptor } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Plus, Search, Users, Clock, CheckCircle, Undo2 } from "lucide-react";
import { toast } from "sonner";

export default function SuscriptoresPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [pagoFilter, setPagoFilter] = useState("");
  const [showPendientes, setShowPendientes] = useState(false);
  const queryClient = useQueryClient();

  const { data: suscriptores } = useQuery({
    queryKey: ["suscriptores", search, planFilter, pagoFilter],
    queryFn: () => getSuscriptores({ search, plan: planFilter || undefined, estado_pago: pagoFilter || undefined }),
  });

  const { data: pendientes } = useQuery({
    queryKey: ["suscriptores-pendientes"],
    queryFn: () => getSuscriptores({ estado_pago: "Pendiente" }),
  });

  const aprobarMutation = useMutation({
    mutationFn: (id: string) => updateSuscriptor(id, { estado_pago: "Al dia" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suscriptores"] });
      queryClient.invalidateQueries({ queryKey: ["suscriptores-pendientes"] });
      toast.success("Suscriptor aprobado");
    },
  });

  const revertirMutation = useMutation({
    mutationFn: (id: string) => updateSuscriptor(id, { estado_pago: "Vencido" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suscriptores"] });
      queryClient.invalidateQueries({ queryKey: ["suscriptores-pendientes"] });
      toast.success("Suscriptor devuelto a Vencido");
    },
  });

  const pendientesCount = pendientes?.length || 0;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Users className="w-5 h-5 text-oro" />
          <span className="text-beige/50 text-xs md:text-sm">{suscriptores?.length || 0} suscriptores</span>
        </div>
        <div className="flex items-center gap-2">
          {pendientesCount > 0 && (
            <button
              onClick={() => setShowPendientes(!showPendientes)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                showPendientes
                  ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                  : "bg-white/5 border-white/10 text-beige/50 hover:text-yellow-400 hover:border-yellow-500/30"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{pendientesCount} por aprobar</span>
            </button>
          )}
          <Link href="/admin/suscriptores/nuevo">
            <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
          </Link>
        </div>
      </div>

      {/* ══ Pendientes section ══ */}
      {showPendientes && pendientes && pendientes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            <h2 className="text-yellow-400 text-sm font-bold">Pendientes de aprobación</h2>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl divide-y divide-yellow-500/10">
            {pendientes.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 gap-3">
                <Link href={`/admin/suscriptores/${s.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="text-white text-sm font-medium truncate">{s.nombre}</p>
                  <div className="flex items-center gap-2 text-beige/50 text-xs mt-0.5">
                    <span>{s.cedula}</span>
                    <span>•</span>
                    <span>{s.telefono}</span>
                    <span>•</span>
                    <Badge size="xs">{s.plan}</Badge>
                    {s.fecha_inicio && (
                      <>
                        <span>•</span>
                        <span>{new Date(s.fecha_inicio).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                      </>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => aprobarMutation.mutate(s.id)}
                    disabled={aprobarMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button
                    onClick={() => revertirMutation.mutate(s.id)}
                    disabled={revertirMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 text-beige/50 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-40"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Devolver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
        </div>
        <div className="flex gap-2">
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
            <option value="" className="bg-jungle-dark">Plan</option>
            <option value="Base" className="bg-jungle-dark">Base</option>
            <option value="Plus" className="bg-jungle-dark">Plus</option>
            <option value="Elite" className="bg-jungle-dark">Elite</option>
          </select>
          <select value={pagoFilter} onChange={(e) => setPagoFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
            <option value="" className="bg-jungle-dark">Pago</option>
            <option value="Al dia" className="bg-jungle-dark">Al dia</option>
            <option value="Pendiente" className="bg-jungle-dark">Pendiente</option>
            <option value="Vencido" className="bg-jungle-dark">Vencido</option>
          </select>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {suscriptores?.map((s) => (
          <Link key={s.id} href={`/admin/suscriptores/${s.id}`}
            className="block bg-white/5 border border-white/10 rounded-xl p-3.5 hover:bg-white/[0.07] transition-colors active:bg-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-white text-sm font-medium truncate flex-1">{s.nombre}</p>
              <Badge size="xs">{s.estado_pago}</Badge>
            </div>
            <div className="flex items-center gap-3 text-beige/50 text-xs">
              <span>{s.rango}</span>
              <span>•</span>
              <span>{s.rama}</span>
              <span className="ml-auto"><Badge size="xs">{s.plan}</Badge></span>
            </div>
          </Link>
        ))}
        {suscriptores?.length === 0 && <p className="text-center text-beige/40 text-sm py-8">Sin resultados</p>}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-beige/50 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Telefono</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Rama</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Pago</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {suscriptores?.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/suscriptores/${s.id}`} className="text-white hover:text-oro transition-colors font-medium">{s.nombre}</Link>
                  </td>
                  <td className="px-4 py-3 text-beige/60">{s.telefono}</td>
                  <td className="px-4 py-3 text-beige/60 hidden lg:table-cell">{s.rama}</td>
                  <td className="px-4 py-3"><Badge>{s.plan}</Badge></td>
                  <td className="px-4 py-3"><Badge>{s.estado_pago}</Badge></td>
                  <td className="px-4 py-3 text-beige/40 hidden lg:table-cell">
                    {new Date(s.fecha_inicio).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
