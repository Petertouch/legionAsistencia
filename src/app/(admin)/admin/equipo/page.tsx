"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTeamStore } from "@/lib/stores/team-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  UsersRound, Search, Plus, Briefcase, Scale, TrendingUp,
  AlertTriangle, Palmtree, ChevronRight,
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

  // Solo abogados en este módulo (profesores van en /admin/profesores)
  const soloAbogados = abogados.filter((a) => a.role !== "profesor");

  const filtered = soloAbogados.filter((a) => {
    if (search && !a.nombre.toLowerCase().includes(search.toLowerCase()) && !a.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (estadoFilter && a.estado !== estadoFilter) return false;
    return true;
  });

  // Stats (only for abogados)
  const abogadosActivos = abogados.filter((a) => a.role === "abogado" && a.estado === "activo");
  const casosActivos = MOCK_CASOS.filter((c) => c.etapa !== "Cerrado");
  const totalCasosActivos = casosActivos.length;
  const promedioCargar = abogadosActivos.length > 0 ? Math.round(totalCasosActivos / abogadosActivos.length) : 0;
  const abogadoSobrecargado = abogados.some((a) => {
    if (a.role !== "abogado") return false;
    const susCasos = casosActivos.filter((c) => c.abogado === a.nombre).length;
    return susCasos > a.max_casos;
  });

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <UsersRound className="w-5 h-5 text-oro" />
          <span className="text-gray-500 text-xs md:text-sm">
            {soloAbogados.length} abogados
          </span>
        </div>
        <Link href="/admin/equipo/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="text-[10px]">Activos</span>
          </div>
          <p className="text-gray-900 text-lg font-bold">{abogadosActivos.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px]">Prom. carga</span>
          </div>
          <p className="text-gray-900 text-lg font-bold">{promedioCargar} <span className="text-gray-400 text-xs font-normal">casos</span></p>
        </div>
        <div className={`bg-gray-50 border rounded-xl p-3 ${abogadoSobrecargado ? "border-red-500/30" : "border-gray-200"}`}>
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${abogadoSobrecargado ? "text-red-600" : ""}`} />
            <span className="text-[10px]">Sobrecarga</span>
          </div>
          <p className={`text-lg font-bold ${abogadoSobrecargado ? "text-red-600" : "text-green-600"}`}>
            {abogadoSobrecargado ? "Si" : "No"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar miembro..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40" />
        </div>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
          <option value="" className="bg-white">Estado</option>
          <option value="activo" className="bg-white">Activo</option>
          <option value="inactivo" className="bg-white">Inactivo</option>
          <option value="vacaciones" className="bg-white">Vacaciones</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((member) => {
          const casosAb = MOCK_CASOS.filter((c) => c.abogado === member.nombre && c.etapa !== "Cerrado");
          const casosCerrados = MOCK_CASOS.filter((c) => c.abogado === member.nombre && c.etapa === "Cerrado");
          const cargaPct = member.max_casos > 0 ? Math.round((casosAb.length / member.max_casos) * 100) : 0;
          const sobrecargado = casosAb.length > member.max_casos;
          const est = ESTADO_CONFIG[member.estado];

          return (
            <Link key={member.id} href={`/admin/equipo/${member.id}`}>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-white/8 hover:border-oro/20 transition-all group">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: member.color }}>
                    {member.nombre.split(" ").pop()?.[0] || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-gray-900 font-semibold text-sm truncate">{member.nombre}</h3>
                      <Badge size="xs" variant={est.variant}>{est.label}</Badge>
                      {member.estado === "vacaciones" && <Palmtree className="w-3 h-3 text-yellow-600" />}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{member.email}</p>

                    {/* Areas + workload */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.areas_habilitadas.map((area) => (
                            <span key={area} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                              area === member.especialidad
                                ? "bg-amber-100 text-oro border-oro/30 font-medium"
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}>
                              {area === member.especialidad && <Scale className="w-2 h-2 inline mr-0.5 -mt-px" />}
                              {area}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${Math.min(cargaPct, 100)}%`,
                              backgroundColor: sobrecargado ? "#ef4444" : cargaPct > 75 ? "#eab308" : "#22c55e",
                            }} />
                          </div>
                          <span className={`text-[10px] font-medium ${sobrecargado ? "text-red-600" : "text-gray-400"}`}>
                            {casosAb.length}/{member.max_casos}
                          </span>
                          {casosCerrados.length > 0 && (
                            <span className="text-[10px] text-gray-400">• {casosCerrados.length} cerrados</span>
                          )}
                        </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-oro transition-colors flex-shrink-0 mt-2" />
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No se encontraron miembros</p>
          </div>
        )}
      </div>
    </div>
  );
}
