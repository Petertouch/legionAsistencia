"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getSeguimientos } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import { StatCard } from "@/components/ui/card";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { getDaysUntilDeadline } from "@/lib/pipelines";
import { Users, Scale, Inbox, AlertTriangle, Phone, MessageSquare, Calendar, StickyNote, CalendarClock, Gift, GraduationCap, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLanzaStore } from "@/lib/stores/lanza-store";
import { useTeamStore } from "@/lib/stores/team-store";
import { getCoursesAdmin } from "@/lib/stores/courses-store";
import type { AuthUser } from "@/lib/stores/auth-store";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

export default function DashboardPage() {
  const { user, isAbogado, isAdmin, isProfesor } = useAuth();

  if (isProfesor) return <ProfesorDashboard user={user} />;
  const abogadoFilter = isAbogado ? user?.nombre : undefined;
  const fetchAll = useLanzaStore((s) => s.fetchAll);
  const lanzaCount = useLanzaStore((s) => s.lanzas.length);
  const convertidos = useLanzaStore((s) => s.leads.filter((l) => l.status === "convertido").length);
  const nuevosLeads = useLanzaStore((s) => s.leads.filter((l) => l.status === "nuevo").length);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", abogadoFilter],
    queryFn: () => getDashboardStats(abogadoFilter ? { abogado: abogadoFilter } : undefined),
  });
  const { data: actividad } = useQuery({ queryKey: ["seguimientos-recientes"], queryFn: () => getSeguimientos() });

  if (!stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className={`grid grid-cols-2 ${isAdmin ? "md:grid-cols-5" : "md:grid-cols-3"} gap-2 md:gap-4`}>
        {isAdmin && (
          <StatCard title="Suscriptores" value={stats.totalSuscriptores} icon={<Users className="w-5 h-5" />}
            trend={{ value: `${stats.suscriptoresAlDia} al dia`, positive: true }} />
        )}
        <StatCard title="Casos Abiertos" value={stats.casosAbiertos} icon={<Scale className="w-5 h-5" />} />
        {isAdmin && (
          <StatCard title="Leads Nuevos" value={stats.leadsNuevos} icon={<Inbox className="w-5 h-5" />} />
        )}
        <StatCard title={isAbogado ? "Estancados" : "Pagos Pend."} value={isAbogado ? stats.casosStale : stats.pagosPendientes}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={isAbogado ? { value: `${stats.casosDeadlineCerca} deadline`, positive: false } : { value: `${stats.pagosPendientes} por cobrar`, positive: false }} />
        {isAdmin && (
          <StatCard title="Lanzas" value={lanzaCount} icon={<Gift className="w-5 h-5" />}
            trend={{ value: nuevosLeads > 0 ? `${nuevosLeads} leads nuevos` : `${convertidos} convertidos`, positive: convertidos > 0 }} />
        )}
      </div>

      {/* Urgent cases */}
      {stats.casosUrgentes.length > 0 && (
        <Card className="border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-red-600 font-bold text-xs md:text-sm">Casos urgentes</h3>
          </div>
          <div className="space-y-2">
            {stats.casosUrgentes.map((c) => {
              const deadlineDays = getDaysUntilDeadline(c.fecha_limite);
              return (
                <Link key={c.id} href={`/admin/casos/${c.id}`}
                  className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-red-50 hover:bg-red-50 transition-colors gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 text-xs md:text-sm font-medium truncate">{c.titulo}</p>
                    <p className="text-gray-400 text-[10px] md:text-xs truncate">{c.suscriptor_nombre} — {c.area}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge size="xs">{c.prioridad}</Badge>
                    {deadlineDays !== null && (
                      <span className={`flex items-center gap-0.5 text-[10px] md:text-xs ${deadlineDays <= 3 ? "text-red-600" : "text-yellow-600"}`}>
                        <CalendarClock className="w-3 h-3" />{deadlineDays}d
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Casos por Area */}
        <Card>
          <h3 className="text-gray-900 font-bold text-xs md:text-sm mb-3 md:mb-4">{isAbogado ? "Mis casos por area" : "Casos por Area"}</h3>
          {stats.casosPorArea.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin casos activos</p>
          ) : (
            <div className="space-y-2.5 md:space-y-3">
              {stats.casosPorArea.map(([area, count]) => (
                <div key={area} className="flex items-center justify-between gap-2">
                  <span className="text-gray-600 text-xs md:text-sm truncate">{area}</span>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <div className="w-20 md:w-32 bg-gray-50 rounded-full h-1.5 md:h-2">
                      <div className="bg-oro h-full rounded-full" style={{ width: `${Math.min((count / Math.max(stats.casosAbiertos, 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="text-gray-900 text-xs md:text-sm font-medium w-5 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-gray-900 font-bold text-xs md:text-sm">Actividad Reciente</h3>
            <Link href="/admin/seguimiento" className="text-oro text-[10px] md:text-xs hover:underline">Ver todo</Link>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {actividad?.slice(0, 5).map((seg) => (
              <div key={seg.id} className="flex items-start gap-2.5 md:gap-3">
                <div className="p-1 md:p-1.5 rounded-lg bg-gray-50 text-gray-500 mt-0.5 flex-shrink-0">{TIPO_ICONS[seg.tipo]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-gray-600 text-xs md:text-sm truncate">{seg.descripcion}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-gray-400 text-[10px] md:text-xs truncate">{seg.suscriptor_nombre || seg.lead_nombre}</span>
                    <span className="text-gray-400 text-[10px] md:text-xs flex-shrink-0">
                      {new Date(seg.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Links — hidden on mobile (bottom nav replaces them) */}
      <div className={`hidden md:grid ${isAdmin ? "grid-cols-4" : "grid-cols-2"} gap-3`}>
        {isAdmin && (
          <Link href="/admin/suscriptores/nuevo" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-oro/30 hover:bg-gray-100 transition-all text-sm text-gray-600 hover:text-gray-900">
            <Users className="w-4 h-4 text-oro" />Nuevo Suscriptor
          </Link>
        )}
        <Link href="/admin/casos/nuevo" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-oro/30 hover:bg-gray-100 transition-all text-sm text-gray-600 hover:text-gray-900">
          <Scale className="w-4 h-4 text-oro" />Nuevo Caso
        </Link>
        {isAdmin && (
          <Link href="/admin/leads/nuevo" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-oro/30 hover:bg-gray-100 transition-all text-sm text-gray-600 hover:text-gray-900">
            <Inbox className="w-4 h-4 text-oro" />Nuevo Lead
          </Link>
        )}
        <Link href="/admin/seguimiento" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-oro/30 hover:bg-gray-100 transition-all text-sm text-gray-600 hover:text-gray-900">
          <Phone className="w-4 h-4 text-oro" />Ver Seguimiento
        </Link>
      </div>
    </div>
  );
}

// ── Profesor Dashboard ──────────────────────────────────
function ProfesorDashboard({ user }: { user: AuthUser | null }) {
  const member = useTeamStore((s) => s.abogados.find((a) => a.id === user?.id));
  const { data: allCourses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: getCoursesAdmin,
  });

  const misCursos = (allCourses || []).filter(
    (c) => c.instructor_name === member?.nombre || c.instructor_name === user?.nombre
  );
  const publicados = misCursos.filter((c) => c.status === "PUBLISHED");
  const borradores = misCursos.filter((c) => c.status === "DRAFT");

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: member?.avatar_url ? "transparent" : member?.color || "#8b5cf6" }}>
          {member?.avatar_url ? (
            <img src={member.avatar_url} alt={member.nombre} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-900 font-bold text-xl">{(user?.nombre || "P").split(" ").pop()?.[0]}</span>
          )}
        </div>
        <div>
          <h1 className="text-gray-900 text-xl font-bold">Hola, {user?.nombre?.split(" ")[0]}</h1>
          <p className="text-gray-400 text-sm">{member?.especialidad_academica || "Profesor"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <GraduationCap className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
          <p className="text-gray-900 text-2xl font-bold">{misCursos.length}</p>
          <p className="text-gray-400 text-[10px]">Mis Cursos</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <BookOpen className="w-5 h-5 text-green-600 mx-auto mb-1.5" />
          <p className="text-gray-900 text-2xl font-bold">{publicados.length}</p>
          <p className="text-gray-400 text-[10px]">Publicados</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <Scale className="w-5 h-5 text-yellow-600 mx-auto mb-1.5" />
          <p className="text-gray-900 text-2xl font-bold">{borradores.length}</p>
          <p className="text-gray-400 text-[10px]">Borradores</p>
        </div>
      </div>

      {/* Mis Cursos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" /> Mis Cursos
          </h2>
          <Link href="/admin/cursos" className="text-oro text-xs font-medium flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : misCursos.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No tienes cursos asignados</p>
            <p className="text-gray-300 text-xs mt-1">El admin te asignará cursos desde el panel</p>
          </div>
        ) : (
          <div className="space-y-2">
            {misCursos.map((curso) => (
              <Link key={curso.id} href={`/admin/cursos/${curso.id}`}
                className="block bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-white hover:border-purple-500/20 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-900 text-sm font-medium truncate">{curso.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        curso.status === "PUBLISHED"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-yellow-50 text-yellow-600 border-yellow-200"
                      }`}>
                        {curso.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                      {curso.category && <span>{curso.category.name}</span>}
                      {curso.total_hours > 0 && <span>{curso.total_hours}h</span>}
                      <span className={curso.price === 0 ? "text-green-600" : "text-oro"}>
                        {curso.price === 0 ? "Gratis" : `$${curso.price.toLocaleString("es-CO")}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-5 h-20 md:h-28 animate-pulse" />)}
      </div>
    </div>
  );
}
