"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCaso, getSeguimientos, advanceCaso, revertCaso, updateCasoChecklist, createSeguimiento } from "@/lib/db";
import { PIPELINES, getDaysUntilDeadline, getDaysInStage } from "@/lib/pipelines";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import StageChecklist from "@/components/admin/stage-checklist";
import { ArrowLeft, ChevronLeft, ChevronRight, User, Scale, CalendarClock, Clock, Phone, MessageSquare, Calendar, StickyNote, Check, Share2, Copy, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />,
  reunion: <Calendar className="w-4 h-4" />, nota: <StickyNote className="w-4 h-4" />,
};

const TIPO_OPTIONS = [
  { value: "nota", label: "Nota", icon: StickyNote },
  { value: "llamada", label: "Llamada", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "reunion", label: "Reunion", icon: Calendar },
] as const;

export default function CasoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddSeguimiento, setShowAddSeguimiento] = useState(false);
  const [segTipo, setSegTipo] = useState<"nota" | "llamada" | "whatsapp" | "reunion">("nota");
  const [segDescripcion, setSegDescripcion] = useState("");
  const [segLoading, setSegLoading] = useState(false);

  const { data: caso, refetch } = useQuery({ queryKey: ["caso", id], queryFn: () => getCaso(id) });
  const { data: seguimientos, refetch: refetchSeg } = useQuery({ queryKey: ["seguimientos", { caso_id: id }], queryFn: () => getSeguimientos({ caso_id: id }) });

  if (!caso) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>;

  const pipeline = PIPELINES[caso.area];
  const currentStage = pipeline.stages[caso.etapa_index];
  const deadlineDays = getDaysUntilDeadline(caso.fecha_limite);
  const daysInStage = getDaysInStage(caso.fecha_ingreso_etapa);
  const isCerrado = caso.etapa === "Cerrado";

  const requiredDone = currentStage.checklist.filter((item) => item.required && caso.checklist[item.key]).length;
  const requiredTotal = currentStage.checklist.filter((item) => item.required).length;
  const canAdvance = requiredDone === requiredTotal && !isCerrado;

  const clientLink = `${typeof window !== "undefined" ? window.location.origin : ""}/mi-caso/${caso.id}`;

  const invalidateAll = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["casos-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["casos"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const handleAdvance = async () => {
    await advanceCaso(caso.id);
    invalidateAll();
    toast.success("Caso avanzado a siguiente etapa");
  };

  const handleRevert = async () => {
    await revertCaso(caso.id);
    invalidateAll();
    toast.success("Caso devuelto a etapa anterior");
  };

  const handleToggleChecklist = async (key: string, done: boolean) => {
    await updateCasoChecklist(caso.id, key, done);
    refetch();
  };

  const handleAddSeguimiento = async () => {
    if (!segDescripcion.trim()) return;
    setSegLoading(true);
    await createSeguimiento({
      caso_id: caso.id,
      suscriptor_id: caso.suscriptor_id,
      lead_id: null,
      tipo: segTipo,
      descripcion: segDescripcion.trim(),
    });
    setSegDescripcion("");
    setSegTipo("nota");
    setShowAddSeguimiento(false);
    setSegLoading(false);
    refetchSeg();
    queryClient.invalidateQueries({ queryKey: ["seguimientos"] });
    toast.success("Actividad registrada");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientLink);
    toast.success("Link copiado al portapapeles");
    setShowShareModal(false);
  };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola, puede ver el estado de su caso "${caso.titulo}" en el siguiente enlace:\n${clientLink}`
    );
    const phone = "573176689580";
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    setShowShareModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/casos" className="text-beige/40 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-xl font-bold truncate">{caso.titulo}</h2>
          <p className="text-beige/50 text-sm">{caso.suscriptor_nombre} — {caso.area}</p>
        </div>
        <Badge>{caso.prioridad}</Badge>
        <div className="relative">
          <Button size="sm" variant="secondary" onClick={() => setShowShareModal(!showShareModal)}>
            <Share2 className="w-4 h-4" /> Compartir
          </Button>
          {showShareModal && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-jungle-dark border border-white/10 rounded-xl p-4 shadow-xl z-50 space-y-3">
              <p className="text-white text-sm font-medium">Compartir con cliente</p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-2">
                <input type="text" value={clientLink} readOnly className="flex-1 bg-transparent text-beige/70 text-xs outline-none" />
                <button onClick={handleCopyLink} className="text-oro hover:text-oro/80 transition-colors"><Copy className="w-4 h-4" /></button>
              </div>
              <button onClick={handleShareWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                <MessageSquare className="w-4 h-4" /> Enviar por WhatsApp
              </button>
            </div>
          )}
        </div>
        {caso.etapa_index > 0 && (
          <Button size="sm" variant="ghost" onClick={handleRevert}>
            <ChevronLeft className="w-4 h-4" /> Devolver
          </Button>
        )}
        {!isCerrado && (
          <Button size="sm" onClick={handleAdvance} disabled={!canAdvance}>
            <ChevronRight className="w-4 h-4" /> Avanzar
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {pipeline.stages.map((stage, i) => {
            const isPast = i < caso.etapa_index;
            const isCurrent = i === caso.etapa_index;
            return (
              <div key={stage.name} className="flex items-center flex-shrink-0">
                {i > 0 && <div className={`w-4 sm:w-8 h-px mx-0.5 ${isPast || isCurrent ? "bg-oro" : "bg-white/10"}`} />}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                  isPast ? "bg-green-500/15 text-green-400" : isCurrent ? "bg-oro/20 text-oro border border-oro/30" : "bg-white/5 text-beige/30"
                }`}>
                  {isPast && <Check className="w-3 h-3" />}
                  <span className="hidden sm:inline">{stage.name}</span>
                  <span className="sm:hidden">{stage.name.slice(0, 3)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="flex items-center gap-3">
          <User className="w-4 h-4 text-oro flex-shrink-0" />
          <div className="min-w-0"><p className="text-beige/40 text-[10px]">Abogado</p><p className="text-white text-sm truncate">{caso.abogado}</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <Scale className="w-4 h-4 text-oro flex-shrink-0" />
          <div className="min-w-0"><p className="text-beige/40 text-[10px]">Etapa actual</p><p className="text-white text-sm">{caso.etapa}</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-oro flex-shrink-0" />
          <div><p className="text-beige/40 text-[10px]">Dias en etapa</p><p className="text-white text-sm">{daysInStage}d</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <CalendarClock className={`w-4 h-4 flex-shrink-0 ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-400" : "text-oro"}`} />
          <div><p className="text-beige/40 text-[10px]">Deadline</p>
            <p className={`text-sm ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-400 font-bold" : "text-white"}`}>{deadlineDays !== null ? `${deadlineDays}d` : "Sin limite"}</p>
          </div>
        </Card>
      </div>

      {/* Checklist + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <StageChecklist caso={caso} stage={currentStage} onToggle={handleToggleChecklist} />
          {caso.notas_etapa && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-beige/40 text-xs mb-1">Notas de etapa</p>
              <p className="text-beige/70 text-sm">{caso.notas_etapa}</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-bold">Timeline</h4>
            <button
              onClick={() => setShowAddSeguimiento(!showAddSeguimiento)}
              className="flex items-center gap-1 text-oro text-xs hover:text-oro/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          {/* Add seguimiento form */}
          {showAddSeguimiento && (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <div className="flex gap-1.5">
                {TIPO_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSegTipo(value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      segTipo === value ? "bg-oro/15 text-oro border border-oro/30" : "bg-white/5 text-beige/40 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
              <textarea
                value={segDescripcion}
                onChange={(e) => setSegDescripcion(e.target.value)}
                placeholder="Describe la actividad..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddSeguimiento(false); setSegDescripcion(""); }} className="text-beige/40 text-xs hover:text-white transition-colors px-3 py-1.5">
                  Cancelar
                </button>
                <button
                  onClick={handleAddSeguimiento}
                  disabled={!segDescripcion.trim() || segLoading}
                  className="flex items-center gap-1.5 bg-oro text-jungle-dark text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-oro/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> {segLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {!seguimientos?.length && !showAddSeguimiento ? (
            <p className="text-beige/40 text-sm">Sin actividad registrada</p>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10" />
              {seguimientos?.map((seg) => (
                <div key={seg.id} className="relative flex items-start gap-3">
                  <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-oro bg-jungle-dark" />
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

      {/* Description */}
      <Card>
        <h4 className="text-white text-sm font-bold mb-2">Descripcion del caso</h4>
        <p className="text-beige/70 text-sm leading-relaxed">{caso.descripcion}</p>
      </Card>
    </div>
  );
}
