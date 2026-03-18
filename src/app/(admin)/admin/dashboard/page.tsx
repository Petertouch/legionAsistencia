"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getSeguimientos } from "@/lib/db";
import { useAuth } from "@/components/providers/auth-provider";
import { StatCard } from "@/components/ui/card";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { getDaysUntilDeadline } from "@/lib/pipelines";
import { Users, Scale, Inbox, AlertTriangle, Phone, MessageSquare, Calendar, StickyNote, CalendarClock, Gift } from "lucide-react";
import Link from "next/link";
import { useLanzaStore } from "@/lib/stores/lanza-store";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

export default function DashboardPage() {
  const { user, isAbogado, isAdmin } = useAuth();
  const abogadoFilter = isAbogado ? user?.nombre : undefined;
  const lanzaData = useLanzaStore((s) => ({ lanzas: s.lanzas.length, leads: s.leads.length, convertidos: s.leads.filter((l) => l.status === "convertido").length, nuevos: s.leads.filter((l) => l.status === "nuevo").length }));

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
          <StatCard title="Lanzas" value={lanzaData.lanzas} icon={<Gift className="w-5 h-5" />}
            trend={{ value: lanzaData.nuevos > 0 ? `${lanzaData.nuevos} leads nuevos` : `${lanzaData.convertidos} convertidos`, positive: lanzaData.convertidos > 0 }} />
        )}
      </div>

      {/* Urgent cases */}
      {stats.casosUrgentes.length > 0 && (
        <Card className="border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-red-400 font-bold text-xs md:text-sm">Casos urgentes</h3>
          </div>
          <div className="space-y-2">
            {stats.casosUrgentes.map((c) => {
              const deadlineDays = getDaysUntilDeadline(c.fecha_limite);
              return (
                <Link key={c.id} href={`/admin/casos/${c.id}`}
                  className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs md:text-sm font-medium truncate">{c.titulo}</p>
                    <p className="text-beige/40 text-[10px] md:text-xs truncate">{c.suscriptor_nombre} — {c.area}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge size="xs">{c.prioridad}</Badge>
                    {deadlineDays !== null && (
                      <span className={`flex items-center gap-0.5 text-[10px] md:text-xs ${deadlineDays <= 3 ? "text-red-400" : "text-yellow-400"}`}>
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
          <h3 className="text-white font-bold text-xs md:text-sm mb-3 md:mb-4">{isAbogado ? "Mis casos por area" : "Casos por Area"}</h3>
          {stats.casosPorArea.length === 0 ? (
            <p className="text-beige/40 text-sm">Sin casos activos</p>
          ) : (
            <div className="space-y-2.5 md:space-y-3">
              {stats.casosPorArea.map(([area, count]) => (
                <div key={area} className="flex items-center justify-between gap-2">
                  <span className="text-beige/70 text-xs md:text-sm truncate">{area}</span>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <div className="w-20 md:w-32 bg-white/5 rounded-full h-1.5 md:h-2">
                      <div className="bg-oro h-full rounded-full" style={{ width: `${Math.min((count / Math.max(stats.casosAbiertos, 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="text-white text-xs md:text-sm font-medium w-5 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-white font-bold text-xs md:text-sm">Actividad Reciente</h3>
            <Link href="/admin/seguimiento" className="text-oro text-[10px] md:text-xs hover:underline">Ver todo</Link>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {actividad?.slice(0, 5).map((seg) => (
              <div key={seg.id} className="flex items-start gap-2.5 md:gap-3">
                <div className="p-1 md:p-1.5 rounded-lg bg-white/5 text-beige/50 mt-0.5 flex-shrink-0">{TIPO_ICONS[seg.tipo]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-beige/80 text-xs md:text-sm truncate">{seg.descripcion}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-beige/40 text-[10px] md:text-xs truncate">{seg.suscriptor_nombre || seg.lead_nombre}</span>
                    <span className="text-beige/30 text-[10px] md:text-xs flex-shrink-0">
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
          <Link href="/admin/suscriptores/nuevo" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-oro/30 hover:bg-white/10 transition-all text-sm text-beige/70 hover:text-white">
            <Users className="w-4 h-4 text-oro" />Nuevo Suscriptor
          </Link>
        )}
        <Link href="/admin/casos/nuevo" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-oro/30 hover:bg-white/10 transition-all text-sm text-beige/70 hover:text-white">
          <Scale className="w-4 h-4 text-oro" />Nuevo Caso
        </Link>
        {isAdmin && (
          <Link href="/admin/leads/nuevo" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-oro/30 hover:bg-white/10 transition-all text-sm text-beige/70 hover:text-white">
            <Inbox className="w-4 h-4 text-oro" />Nuevo Lead
          </Link>
        )}
        <Link href="/admin/seguimiento" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-oro/30 hover:bg-white/10 transition-all text-sm text-beige/70 hover:text-white">
          <Phone className="w-4 h-4 text-oro" />Ver Seguimiento
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 h-20 md:h-28 animate-pulse" />)}
      </div>
    </div>
  );
}
