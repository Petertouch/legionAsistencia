"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTeamStore } from "@/lib/stores/team-store";
import { PIPELINES, getStaleLevel } from "@/lib/pipelines";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  UsersRound, Search, Plus, Briefcase, Scale, TrendingUp,
  AlertTriangle, Palmtree, ChevronRight, Activity, Clock,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "danger" },
  vacaciones: { label: "Vacaciones", variant: "warning" },
};

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  admin: { label: "Admin", cls: "bg-amber-100 text-oro border-oro/30" },
  abogado: { label: "Abogado", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  profesor: { label: "Profesor", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

interface ActivoCaso { area: string; etapa: string; etapa_index: number; fecha_ingreso_etapa: string }
interface ResumenEntry { activos: ActivoCaso[]; cerrados: number; ultima_actividad: string | null; acciones_7d: number }
type Resumen = Record<string, ResumenEntry>;

function statsDe(entry: ResumenEntry | undefined) {
  const activos = entry?.activos || [];
  const estancados = activos.filter((c) => {
    const st = PIPELINES[c.area as keyof typeof PIPELINES]?.stages[c.etapa_index];
    return st && getStaleLevel(c.fecha_ingreso_etapa, st.expectedDays) === "danger";
  }).length;
  return {
    activos: activos.length,
    cerrados: entry?.cerrados || 0,
    estancados,
    ultima: entry?.ultima_actividad || null,
    acciones7d: entry?.acciones_7d || 0,
  };
}

function fmtUltima(v: string | null) {
  if (!v) return "Sin actividad";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  if (diff < 3600_000) return "hace minutos";
  if (diff < 86400_000) return `hoy ${d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800_000) return "ayer";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function EquipoPage() {
  const { abogados } = useTeamStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [resumen, setResumen] = useState<Resumen>({});

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    fetch("/api/equipo/resumen").then((r) => (r.ok ? r.json() : {})).then(setResumen).catch(() => {});
  }, []);
  if (!mounted) return null;

  // Solo abogados en este módulo (profesores van en /admin/profesores)
  const soloAbogados = abogados.filter((a) => a.role !== "profesor");
  const filtered = soloAbogados.filter((a) => {
    if (search && !a.nombre.toLowerCase().includes(search.toLowerCase()) && !a.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (estadoFilter && a.estado !== estadoFilter) return false;
    if (roleFilter && a.role !== roleFilter) return false;
    return true;
  });

  const abogadosRol = abogados.filter((a) => a.role === "abogado");
  const abogadosActivos = abogadosRol.filter((a) => a.estado === "activo");
  const totalActivos = abogadosRol.reduce((sum, a) => sum + statsDe(resumen[a.id]).activos, 0);
  const promedioCargar = abogadosActivos.length > 0 ? Math.round(totalActivos / abogadosActivos.length) : 0;
  const abogadoSobrecargado = abogadosRol.some((a) => statsDe(resumen[a.id]).activos > a.max_casos && a.max_casos > 0);

  // Dashboard comparativo: abogados ordenados por casos activos.
  const dashboard = [...abogadosRol]
    .map((a) => ({ member: a, s: statsDe(resumen[a.id]) }))
    .sort((x, y) => y.s.activos - x.s.activos);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <UsersRound className="w-5 h-5 text-oro" />
          <span className="text-gray-500 text-xs md:text-sm">{filtered.length} de {soloAbogados.length} miembros</span>
        </div>
        <Link href="/admin/equipo/nuevo">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuevo</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><Briefcase className="w-3.5 h-3.5" /><span className="text-[10px]">Abogados activos</span></div>
          <p className="text-gray-900 text-lg font-bold">{abogadosActivos.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><TrendingUp className="w-3.5 h-3.5" /><span className="text-[10px]">Prom. carga</span></div>
          <p className="text-gray-900 text-lg font-bold">{promedioCargar} <span className="text-gray-400 text-xs font-normal">casos</span></p>
        </div>
        <div className={`bg-gray-50 border rounded-xl p-3 ${abogadoSobrecargado ? "border-red-500/30" : "border-gray-200"}`}>
          <div className="flex items-center gap-1.5 text-gray-400 mb-1"><AlertTriangle className={`w-3.5 h-3.5 ${abogadoSobrecargado ? "text-red-600" : ""}`} /><span className="text-[10px]">Sobrecarga</span></div>
          <p className={`text-lg font-bold ${abogadoSobrecargado ? "text-red-600" : "text-green-600"}`}>{abogadoSobrecargado ? "Si" : "No"}</p>
        </div>
      </div>

      {/* Dashboard comparativo del equipo */}
      {dashboard.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-oro" />
            <h2 className="text-gray-900 font-bold text-sm">Avance de los abogados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left font-medium px-4 py-2">Abogado</th>
                  <th className="text-center font-medium px-2 py-2">Carga</th>
                  <th className="text-center font-medium px-2 py-2">Activos</th>
                  <th className="text-center font-medium px-2 py-2">Cerrados</th>
                  <th className="text-center font-medium px-2 py-2">Estancados</th>
                  <th className="text-center font-medium px-2 py-2">Acc. 7d</th>
                  <th className="text-left font-medium px-3 py-2">Última act.</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dashboard.map(({ member, s }) => {
                  const cargaPct = member.max_casos > 0 ? Math.round((s.activos / member.max_casos) * 100) : 0;
                  const sobre = s.activos > member.max_casos && member.max_casos > 0;
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: member.color }}>
                            {member.nombre.split(" ").pop()?.[0] || "?"}
                          </div>
                          <span className="text-gray-900 truncate">{member.nombre}</span>
                          {member.estado !== "activo" && <span className="text-[9px] text-gray-400">({member.estado})</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(cargaPct, 100)}%`, backgroundColor: sobre ? "#ef4444" : cargaPct > 75 ? "#eab308" : "#22c55e" }} />
                          </div>
                          <span className={`text-[10px] ${sobre ? "text-red-600 font-bold" : "text-gray-400"}`}>{s.activos}/{member.max_casos}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-gray-900 font-medium">{s.activos}</td>
                      <td className="px-2 py-2.5 text-center text-gray-500">{s.cerrados}</td>
                      <td className={`px-2 py-2.5 text-center font-medium ${s.estancados > 0 ? "text-orange-600" : "text-gray-300"}`}>{s.estancados}</td>
                      <td className={`px-2 py-2.5 text-center font-medium ${s.acciones7d > 0 ? "text-oro" : "text-gray-300"}`}>{s.acciones7d}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{fmtUltima(s.ultima)}</td>
                      <td className="px-2 py-2.5">
                        <Link href={`/admin/equipo/${member.id}/actividad`} className="text-oro hover:text-oro/70 text-xs font-medium whitespace-nowrap flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar miembro..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-oro/40 appearance-none">
          <option value="" className="bg-white">Rol</option>
          <option value="admin" className="bg-white">Admin</option>
          <option value="abogado" className="bg-white">Abogado</option>
        </select>
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
          const s = statsDe(resumen[member.id]);
          const cargaPct = member.max_casos > 0 ? Math.round((s.activos / member.max_casos) * 100) : 0;
          const sobrecargado = s.activos > member.max_casos && member.max_casos > 0;
          const est = ESTADO_CONFIG[member.estado];

          return (
            <div key={member.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-oro/20 transition-all">
              <div className="flex items-start gap-3">
                <Link href={`/admin/equipo/${member.id}`} className="flex items-start gap-3 flex-1 min-w-0 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0" style={{ backgroundColor: member.color }}>
                    {member.nombre.split(" ").pop()?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-gray-900 font-semibold text-sm truncate group-hover:text-oro transition-colors">{member.nombre}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${(ROLE_CONFIG[member.role] || ROLE_CONFIG.abogado).cls}`}>
                        {(ROLE_CONFIG[member.role] || ROLE_CONFIG.abogado).label}
                      </span>
                      <Badge size="xs" variant={est.variant}>{est.label}</Badge>
                      {member.estado === "vacaciones" && <Palmtree className="w-3 h-3 text-yellow-600" />}
                    </div>
                    <p className="text-gray-400 text-xs truncate">{member.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.areas_habilitadas.map((area) => (
                        <span key={area} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                          area === member.especialidad ? "bg-amber-100 text-oro border-oro/30 font-medium" : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                          {area === member.especialidad && <Scale className="w-2 h-2 inline mr-0.5 -mt-px" />}
                          {area}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[140px]">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(cargaPct, 100)}%`, backgroundColor: sobrecargado ? "#ef4444" : cargaPct > 75 ? "#eab308" : "#22c55e" }} />
                      </div>
                      <span className={`text-[10px] font-medium ${sobrecargado ? "text-red-600" : "text-gray-400"}`}>{s.activos}/{member.max_casos}</span>
                      {s.cerrados > 0 && <span className="text-[10px] text-gray-400">• {s.cerrados} cerrados</span>}
                      {s.estancados > 0 && <span className="text-[10px] text-orange-600 font-medium">• {s.estancados} estancados</span>}
                    </div>
                  </div>
                </Link>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Link href={`/admin/equipo/${member.id}/actividad`}
                    className="inline-flex items-center gap-1 text-oro hover:bg-amber-50 border border-oro/20 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors">
                    <Activity className="w-3.5 h-3.5" /> Actividad
                  </Link>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3" /> {fmtUltima(s.ultima)}
                  </span>
                </div>
              </div>
            </div>
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
