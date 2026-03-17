"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getSuscriptor, getCasosBySuscriptor, getSeguimientos } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Scale, MessageSquare, StickyNote } from "lucide-react";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

export default function SuscriptorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: suscriptor } = useQuery({ queryKey: ["suscriptor", id], queryFn: () => getSuscriptor(id) });
  const { data: casos } = useQuery({ queryKey: ["casos-suscriptor", id], queryFn: () => getCasosBySuscriptor(id) });
  const { data: seguimientos } = useQuery({ queryKey: ["seguimientos", { suscriptor_id: id }], queryFn: () => getSeguimientos({ suscriptor_id: id }) });

  if (!suscriptor) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/suscriptores" className="text-beige/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h2 className="text-white text-xl font-bold">{suscriptor.nombre}</h2>
          <p className="text-beige/50 text-sm">{suscriptor.rango} — {suscriptor.rama}</p>
        </div>
        <Badge>{suscriptor.plan}</Badge>
        <Badge>{suscriptor.estado_pago}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3"><Phone className="w-4 h-4 text-oro" /><div><p className="text-beige/40 text-xs">Telefono</p><p className="text-white text-sm">{suscriptor.telefono}</p></div></Card>
        <Card className="flex items-center gap-3"><Mail className="w-4 h-4 text-oro" /><div><p className="text-beige/40 text-xs">Email</p><p className="text-white text-sm">{suscriptor.email}</p></div></Card>
        <Card className="flex items-center gap-3"><MapPin className="w-4 h-4 text-oro" /><div><p className="text-beige/40 text-xs">Rama / Rango</p><p className="text-white text-sm">{suscriptor.rama} — {suscriptor.rango}</p></div></Card>
        <Card className="flex items-center gap-3"><Calendar className="w-4 h-4 text-oro" /><div><p className="text-beige/40 text-xs">Suscrito desde</p><p className="text-white text-sm">{new Date(suscriptor.fecha_inicio).toLocaleDateString("es-CO")}</p></div></Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2"><Scale className="w-4 h-4 text-oro" /> Casos ({casos?.length || 0})</h3>
          <Link href={`/admin/casos/nuevo?suscriptor=${id}`}><Button size="sm" variant="secondary">+ Nuevo caso</Button></Link>
        </div>
        {casos?.length === 0 ? (
          <p className="text-beige/40 text-sm">Sin casos registrados</p>
        ) : (
          <div className="space-y-2">
            {casos?.map((c) => (
              <Link key={c.id} href={`/admin/casos/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-white text-sm">{c.titulo}</p>
                  <p className="text-beige/40 text-xs">{c.area} — {c.etapa}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{c.prioridad}</Badge>
                  <span className="text-beige/30 text-xs">{c.abogado}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-white font-bold text-sm mb-4">Seguimiento</h3>
        {seguimientos?.length === 0 ? (
          <p className="text-beige/40 text-sm">Sin actividad registrada</p>
        ) : (
          <div className="space-y-3">
            {seguimientos?.map((seg) => (
              <div key={seg.id} className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-white/5 text-beige/50">{TIPO_ICONS[seg.tipo]}</div>
                <div>
                  <p className="text-beige/80 text-sm">{seg.descripcion}</p>
                  <p className="text-beige/30 text-xs mt-0.5">
                    {new Date(seg.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {seg.caso_area && ` — ${seg.caso_area}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
