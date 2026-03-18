"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTeamStore } from "@/lib/stores/team-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  UsersRound,
  Search,
  Plus,
  Briefcase,
  Scale,
  TrendingUp,
  AlertTriangle,
  Palmtree,
  ChevronRight,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "danger" },
  vacaciones: { label: "Vacaciones", variant: "warning" },
};

export default function EquipoPage() {
  const { abogados } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const filtered = abogados.filter((a) => {
    if (search && !a.nombre.toLowerCase().includes(search.toLowerCase()) && !a.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (estadoFilter && a.estado !== estadoFilter) return false;
    return true;
  });

  // Stats
  const activos = abogados.filter((a) => a.estado === "activo").length;
  const casosActivos = MOCK_CASOS.filter((c) => c.etapa !== "Cerrado");
  const totalCasosActivos = casosActivos.length;
  const promedioCargar = activos > 0 ? Math.round(totalCasosActivos / activos) : 0;
  const abogadoSobrecargado = abogados.some((a) => {
    const susCasos = casosActivos.filter((c) => c.abogado === a.nombre).length;
    return susCasos > a.max_casos;
  });

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <UsersRound className="w-5 h-5 text-oro" />
          <span className="text-beige/50 text-xs md:text-sm">{abogados.length} abogados</span>
        </div>
        <Link href="/admin/equipo/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-beige/40 mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="text-[10px]">Activos</span>
          </div>
          <p className="text-white text-lg font-bold">{activos}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-beige/40 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px]">Prom. carga</span>
          </div>
          <p className="text-white text-lg font-bold">{promedioCargar} <span className="text-beige/40 text-xs font-normal">casos</span></p>
        </div>
        <div className={`bg-white/5 border rounded-xl p-3 ${abogadoSobrecargado ? "border-red-500/30" : "border-white/10"}`}>
          <div className="flex items-center gap-1.5 text-beige/40 mb-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${abogadoSobrecargado ? "text-red-400" : ""}`} />
            <span className="text-[10px]">Sobrecarga</span>
          </div>
          <p className={`text-lg font-bold ${abogadoSobrecargado ? "text-red-400" : "text-green-400"}`}>
            {abogadoSobrecargado ? "Si" : "No"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar abogado..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
        </div>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
          <option value="" className="bg-jungle-dark">Estado</option>
          <option value="activo" className="bg-jungle-dark">Activo</option>
          <option value="inactivo" className="bg-jungle-dark">Inactivo</option>
          <option value="vacaciones" className="bg-jungle-dark">Vacaciones</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((abogado) => {
          const casosAb = MOCK_CASOS.filter((c) => c.abogado === abogado.nombre && c.etapa !== "Cerrado");
          const casosCerrados = MOCK_CASOS.filter((c) => c.abogado === abogado.nombre && c.etapa === "Cerrado");
          const cargaPct = abogado.max_casos > 0 ? Math.round((casosAb.length / abogado.max_casos) * 100) : 0;
          const sobrecargado = casosAb.length > abogado.max_casos;
          const est = ESTADO_CONFIG[abogado.estado];

          return (
            <Link key={abogado.id} href={`/admin/equipo/${abogado.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-oro/20 transition-all group">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: abogado.color }}>
                    {abogado.nombre.split(" ").pop()?.[0] || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-semibold text-sm truncate">{abogado.nombre}</h3>
                      <Badge size="xs" variant={est.variant}>{est.label}</Badge>
                      {abogado.estado === "vacaciones" && <Palmtree className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <p className="text-beige/40 text-xs truncate">{abogado.email}</p>

                    {/* Areas */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {abogado.areas_habilitadas.map((area) => (
                        <span key={area} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                          area === abogado.especialidad
                            ? "bg-oro/15 text-oro border-oro/30 font-medium"
                            : "bg-white/5 text-beige/50 border-white/10"
                        }`}>
                          {area === abogado.especialidad && <Scale className="w-2 h-2 inline mr-0.5 -mt-px" />}
                          {area}
                        </span>
                      ))}
                    </div>

                    {/* Workload bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${Math.min(cargaPct, 100)}%`,
                          backgroundColor: sobrecargado ? "#ef4444" : cargaPct > 75 ? "#eab308" : "#22c55e",
                        }} />
                      </div>
                      <span className={`text-[10px] font-medium ${sobrecargado ? "text-red-400" : "text-beige/40"}`}>
                        {casosAb.length}/{abogado.max_casos}
                      </span>
                      {casosCerrados.length > 0 && (
                        <span className="text-[10px] text-beige/30">• {casosCerrados.length} cerrados</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-beige/20 group-hover:text-oro transition-colors flex-shrink-0 mt-2" />
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-beige/30 text-sm">No se encontraron abogados</p>
          </div>
        )}
      </div>
    </div>
  );
}
