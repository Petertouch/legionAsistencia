"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCasos, getDashboardStats } from "@/lib/db";
import { PIPELINES, AREAS, type CaseArea } from "@/lib/pipelines";
import { useCasosStore } from "@/lib/stores/casos-store";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import PipelineTabs from "@/components/admin/pipeline-tabs";
import StatsBar from "@/components/admin/stats-bar";
import KanbanBoard from "@/components/admin/kanban-board";
import { Plus, Search, LayoutGrid, List, Scale } from "lucide-react";

export default function CasosPage() {
  const { viewMode, setViewMode, selectedArea, setSelectedArea } = useCasosStore();
  const [search, setSearch] = useState("");
  const { user, isAbogado } = useAuth();

  // When abogado, filter by their name
  const abogadoFilter = isAbogado ? user?.nombre : undefined;

  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => getDashboardStats() });

  const { data: allCasos } = useQuery({
    queryKey: ["casos", abogadoFilter],
    queryFn: () => getCasos(abogadoFilter ? { abogado: abogadoFilter } : undefined),
  });

  // Count active cases per area for tabs
  const areaCounts: Record<string, number> = {};
  allCasos?.forEach((c) => {
    if (c.etapa !== "Cerrado") areaCounts[c.area] = (areaCounts[c.area] || 0) + 1;
  });

  // Filtered cases for table view
  const { data: filteredCasos } = useQuery({
    queryKey: ["casos", selectedArea, search, abogadoFilter],
    queryFn: () => getCasos({ area: selectedArea, search: search || undefined, abogado: abogadoFilter }),
  });

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-oro" />
          <StatsBar
            activos={stats?.casosAbiertos ?? 0}
            stale={stats?.casosStale ?? 0}
            deadlines={stats?.casosDeadlineCerca ?? 0}
          />
        </div>
        <Link href="/admin/casos/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo Caso</Button>
        </Link>
      </div>

      {/* Pipeline tabs */}
      <PipelineTabs selected={selectedArea} onSelect={setSelectedArea} counts={areaCounts} />

      {/* View toggle + search */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "kanban" ? "bg-oro/15 text-oro" : "text-beige/40 hover:text-white"}`}
            title="Vista Kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("tabla")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "tabla" ? "bg-oro/15 text-oro" : "text-beige/40 hover:text-white"}`}
            title="Vista Tabla"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        {viewMode === "tabla" && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por titulo, cliente, abogado..."
              className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <KanbanBoard area={selectedArea} abogadoFilter={abogadoFilter} />
      ) : (
        <TableView casos={filteredCasos || []} />
      )}
    </div>
  );
}

function TableView({ casos }: { casos: import("@/lib/mock-data").Caso[] }) {
  return (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {casos.length === 0 ? (
          <p className="text-center text-beige/40 text-sm py-8">No se encontraron casos</p>
        ) : (
          casos.map((c) => (
            <Link key={c.id} href={`/admin/casos/${c.id}`}
              className="block bg-white/5 border border-white/10 rounded-xl p-3.5 hover:bg-white/[0.07] transition-colors active:bg-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white text-sm font-medium truncate flex-1 mr-2">{c.titulo}</p>
                <Badge size="xs">{c.prioridad}</Badge>
              </div>
              <div className="flex items-center gap-2 text-beige/50 text-xs">
                <span className="truncate">{c.suscriptor_nombre}</span>
                <span>•</span>
                <span>{c.etapa}</span>
                {c.fecha_limite && <span className="ml-auto text-beige/30">{new Date(c.fecha_limite).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>}
              </div>
            </Link>
          ))
        )}
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-beige/50 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Caso</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Etapa</th>
                <th className="text-left px-4 py-3 font-medium">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Abogado</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {casos.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/casos/${c.id}`} className="text-white hover:text-oro transition-colors font-medium">{c.titulo}</Link>
                    <p className="text-beige/40 text-xs mt-0.5">{c.area}</p>
                  </td>
                  <td className="px-4 py-3 text-beige/60">{c.suscriptor_nombre}</td>
                  <td className="px-4 py-3"><Badge variant="neutral">{c.etapa}</Badge></td>
                  <td className="px-4 py-3"><Badge>{c.prioridad}</Badge></td>
                  <td className="px-4 py-3 text-beige/60 hidden lg:table-cell">{c.abogado}</td>
                  <td className="px-4 py-3 text-beige/40 hidden lg:table-cell">
                    {c.fecha_limite ? new Date(c.fecha_limite).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
