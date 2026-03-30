"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTeamStore } from "@/lib/stores/team-store";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { UserPen, Search, Plus, BookOpen, ChevronRight, Palmtree } from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "danger" },
  vacaciones: { label: "Vacaciones", variant: "warning" },
};

export default function ProfesoresPage() {
  const { abogados } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const profesores = abogados.filter((a) => a.role === "profesor");

  const filtered = profesores.filter((p) => {
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.especialidad_academica.toLowerCase().includes(search.toLowerCase())) return false;
    if (estadoFilter && p.estado !== estadoFilter) return false;
    return true;
  });

  const activos = profesores.filter((p) => p.estado === "activo").length;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <UserPen className="w-5 h-5 text-oro" />
          <span className="text-beige/50 text-xs md:text-sm">
            {profesores.length} profesores · {activos} activos
          </span>
        </div>
        <Link href="/admin/profesores/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo profesor</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o especialidad..."
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
        {filtered.map((prof) => {
          const est = ESTADO_CONFIG[prof.estado];
          return (
            <Link key={prof.id} href={`/admin/equipo/${prof.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-purple-500/20 transition-all group">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: prof.avatar_url ? "transparent" : prof.color }}>
                    {prof.avatar_url ? (
                      <img src={prof.avatar_url} alt={prof.nombre} className="w-full h-full object-cover" />
                    ) : (
                      prof.nombre.split(" ").pop()?.[0] || "?"
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-semibold text-sm truncate">{prof.nombre}</h3>
                      <Badge size="xs" variant={est.variant}>{est.label}</Badge>
                      {prof.estado === "vacaciones" && <Palmtree className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <p className="text-beige/40 text-xs truncate">{prof.email}</p>
                    {prof.especialidad_academica && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <BookOpen className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400/80">{prof.especialidad_academica}</span>
                      </div>
                    )}
                    {prof.bio && (
                      <p className="text-beige/30 text-[11px] mt-1 line-clamp-1">{prof.bio}</p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-beige/20 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPen className="w-10 h-10 text-beige/10 mb-3" />
            <p className="text-beige/30 text-sm">No hay profesores registrados</p>
            <p className="text-beige/20 text-xs mt-1">Crea uno para asociarlo a los cursos</p>
          </div>
        )}
      </div>
    </div>
  );
}
