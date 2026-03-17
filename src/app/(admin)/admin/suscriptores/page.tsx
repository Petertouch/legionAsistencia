"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSuscriptores } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Plus, Search, Users } from "lucide-react";

export default function SuscriptoresPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [pagoFilter, setPagoFilter] = useState("");

  const { data: suscriptores, isLoading } = useQuery({
    queryKey: ["suscriptores", search, planFilter, pagoFilter],
    queryFn: () => getSuscriptores({ search, plan: planFilter || undefined, estado_pago: pagoFilter || undefined }),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-oro" />
          <span className="text-beige/50 text-sm">{suscriptores?.length || 0} suscriptores</span>
        </div>
        <Link href="/admin/suscriptores/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, telefono..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none"
        >
          <option value="" className="bg-jungle-dark">Todos los planes</option>
          <option value="Base" className="bg-jungle-dark">Base</option>
          <option value="Plus" className="bg-jungle-dark">Plus</option>
          <option value="Elite" className="bg-jungle-dark">Elite</option>
        </select>
        <select
          value={pagoFilter}
          onChange={(e) => setPagoFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none"
        >
          <option value="" className="bg-jungle-dark">Todos los pagos</option>
          <option value="Al dia" className="bg-jungle-dark">Al dia</option>
          <option value="Pendiente" className="bg-jungle-dark">Pendiente</option>
          <option value="Vencido" className="bg-jungle-dark">Vencido</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-beige/50 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Telefono</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Rama</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Pago</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : suscriptores?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-beige/40">
                    No se encontraron suscriptores
                  </td>
                </tr>
              ) : (
                suscriptores?.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/suscriptores/${s.id}`} className="text-white hover:text-oro transition-colors font-medium">
                        {s.nombre}
                      </Link>
                      <p className="text-beige/40 text-xs mt-0.5 sm:hidden">{s.telefono}</p>
                    </td>
                    <td className="px-4 py-3 text-beige/60 hidden sm:table-cell">{s.telefono}</td>
                    <td className="px-4 py-3 text-beige/60 hidden md:table-cell">{s.rama}</td>
                    <td className="px-4 py-3"><Badge>{s.plan}</Badge></td>
                    <td className="px-4 py-3"><Badge>{s.estado_pago}</Badge></td>
                    <td className="px-4 py-3 text-beige/40 hidden lg:table-cell">
                      {new Date(s.fecha_inicio).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
