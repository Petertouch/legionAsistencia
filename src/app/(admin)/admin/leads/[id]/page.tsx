"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLead, getSeguimientos } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, StickyNote, UserPlus } from "lucide-react";
import { toast } from "sonner";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lead } = useQuery({ queryKey: ["lead", id], queryFn: () => getLead(id) });
  const { data: seguimientos } = useQuery({ queryKey: ["seguimientos", { lead_id: id }], queryFn: () => getSeguimientos({ lead_id: id }) });

  if (!lead) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>;

  const handleConvert = () => {
    toast.success("Lead convertido a suscriptor (mock)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/leads" className="text-beige/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h2 className="text-white text-xl font-bold">{lead.nombre}</h2>
          <p className="text-beige/50 text-sm">Lead — {lead.fuente}</p>
        </div>
        <Badge>{lead.estado}</Badge>
        {lead.estado !== "Convertido" && lead.estado !== "Perdido" && (
          <Button size="sm" onClick={handleConvert}><UserPlus className="w-4 h-4" /> Convertir</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-oro" />
          <div>
            <p className="text-beige/40 text-xs">Telefono</p>
            <p className="text-white text-sm">{lead.telefono}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-oro" />
          <div>
            <p className="text-beige/40 text-xs">Email</p>
            <p className="text-white text-sm">{lead.email}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-oro" />
          <div>
            <p className="text-beige/40 text-xs">Area de interes</p>
            <p className="text-white text-sm">{lead.area_interes}</p>
          </div>
        </Card>
      </div>

      {lead.notas && (
        <Card>
          <h3 className="text-white font-bold text-sm mb-2">Notas</h3>
          <p className="text-beige/70 text-sm">{lead.notas}</p>
        </Card>
      )}

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
                    {new Date(seg.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
