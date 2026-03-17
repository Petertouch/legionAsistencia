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

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", search, fuenteFilter, estadoFilter],
    queryFn: () => getLeads({ search, fuente: fuenteFilter || undefined, estado: estadoFilter || undefined }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="w-5 h-5 text-oro" />
          <span className="text-beige/50 text-sm">{leads?.length || 0} leads</span>
        </div>
        <Link href="/admin/leads/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, telefono..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
        </div>
        <select value={fuenteFilter} onChange={(e) => setFuenteFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
          <option value="" className="bg-jungle-dark">Todas las fuentes</option>
          {["chatbot", "web", "referido", "whatsapp"].map((f) => (
            <option key={f} value={f} className="bg-jungle-dark">{f}</option>
          ))}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
          <option value="" className="bg-jungle-dark">Todos los estados</option>
          {["Nuevo", "Contactado", "Interesado", "Convertido", "Perdido"].map((e) => (
            <option key={e} value={e} className="bg-jungle-dark">{e}</option>
          ))}
        </select>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-beige/50 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Telefono</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Area de interes</th>
                <th className="text-left px-4 py-3 font-medium">Fuente</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 bg-white/5 rounded animate-pulse" /></td></tr>
                ))
              ) : leads?.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-beige/40">No se encontraron leads</td></tr>
              ) : (
                leads?.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${l.id}`} className="text-white hover:text-oro transition-colors font-medium">{l.nombre}</Link>
                      <p className="text-beige/40 text-xs mt-0.5 sm:hidden">{l.telefono}</p>
                    </td>
                    <td className="px-4 py-3 text-beige/60 hidden sm:table-cell">{l.telefono}</td>
                    <td className="px-4 py-3 text-beige/60 hidden md:table-cell">{l.area_interes}</td>
                    <td className="px-4 py-3"><Badge variant="neutral">{l.fuente}</Badge></td>
                    <td className="px-4 py-3"><Badge>{l.estado}</Badge></td>
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
