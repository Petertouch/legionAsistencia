"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeads } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Plus, Search, Inbox } from "lucide-react";

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [fuenteFilter, setFuenteFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  const { data: leads } = useQuery({
    queryKey: ["leads", search, fuenteFilter, estadoFilter],
    queryFn: () => getLeads({ search, fuente: fuenteFilter || undefined, estado: estadoFilter || undefined }),
  });

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <Inbox className="w-5 h-5 text-oro" />
          <span className="text-gray-500 text-xs md:text-sm">{leads?.length || 0} leads</span>
        </div>
        <Link href="/admin/leads/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40" />
        </div>
        <div className="flex gap-2">
          <select value={fuenteFilter} onChange={(e) => setFuenteFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
            <option value="" className="bg-white">Fuente</option>
            {["chatbot", "web", "referido", "whatsapp"].map((f) => (
              <option key={f} value={f} className="bg-white">{f}</option>
            ))}
          </select>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
            <option value="" className="bg-white">Estado</option>
            {["Nuevo", "Contactado", "Interesado", "Convertido", "Perdido"].map((e) => (
              <option key={e} value={e} className="bg-white">{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {leads?.map((l) => (
          <Link key={l.id} href={`/admin/leads/${l.id}`}
            className="block bg-gray-50 border border-gray-200 rounded-xl p-3.5 hover:bg-white transition-colors active:bg-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-900 text-sm font-medium truncate flex-1 mr-2">{l.nombre}</p>
              <Badge size="xs">{l.estado}</Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <span>{l.area_interes}</span>
              <span>•</span>
              <Badge size="xs" variant="neutral">{l.fuente}</Badge>
            </div>
          </Link>
        ))}
        {leads?.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Sin resultados</p>}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Área</th>
                <th className="text-left px-4 py-3 font-medium">Fuente</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads?.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="text-gray-900 hover:text-oro transition-colors font-medium">{l.nombre}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.telefono}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{l.area_interes}</td>
                  <td className="px-4 py-3"><Badge variant="neutral">{l.fuente}</Badge></td>
                  <td className="px-4 py-3"><Badge>{l.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
