"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCaso, getSeguimientos, advanceCaso, revertCaso, updateCasoChecklist, createSeguimiento, respondConsulta, deleteConsultaRespuesta } from "@/lib/db";
import { PIPELINES, getDaysUntilDeadline, getDaysInStage } from "@/lib/pipelines";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import StageChecklist from "@/components/admin/stage-checklist";
import { useAuth } from "@/components/providers/auth-provider";
import { ArrowLeft, ChevronLeft, ChevronRight, User, Scale, CalendarClock, Clock, Phone, MessageSquare, Calendar, StickyNote, Check, Share2, Copy, Plus, Send, CheckCircle2, Pencil, Trash2 } from "lucide-react";
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
  const [respuesta, setRespuesta] = useState("");
  const [respLoading, setRespLoading] = useState(false);
  const [editingResp, setEditingResp] = useState(false);
  const { user } = useAuth();

  const { data: caso, refetch } = useQuery({ queryKey: ["caso", id], queryFn: () => getCaso(id) });
  const { data: seguimientos, refetch: refetchSeg } = useQuery({ queryKey: ["seguimientos", { caso_id: id }], queryFn: () => getSeguimientos({ caso_id: id }) });

  if (!caso) return <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 md:h-24 bg-white/5 rounded-xl" />)}</div>;

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

  const handleAdvance = async () => { await advanceCaso(caso.id); invalidateAll(); toast.success("Caso avanzado"); };
  const handleRevert = async () => { await revertCaso(caso.id); invalidateAll(); toast.success("Caso devuelto"); };

  const handleToggleChecklist = async (key: string, done: boolean) => {
    await updateCasoChecklist(caso.id, key, done);
    refetch();
  };

  const handleAddSeguimiento = async () => {
    if (!segDescripcion.trim()) return;
    setSegLoading(true);
    await createSeguimiento({ caso_id: caso.id, suscriptor_id: caso.suscriptor_id, lead_id: null, tipo: segTipo, descripcion: segDescripcion.trim() });
    setSegDescripcion(""); setSegTipo("nota"); setShowAddSeguimiento(false); setSegLoading(false);
    refetchSeg();
    queryClient.invalidateQueries({ queryKey: ["seguimientos"] });
    toast.success("Actividad registrada");
  };

  const handleCopyLink = () => { navigator.clipboard.writeText(clientLink); toast.success("Link copiado"); setShowShareModal(false); };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(`Hola, puede ver el estado de su caso "${caso.titulo}" en:\n${clientLink}`);
    window.open(`https://wa.me/573176689580?text=${msg}`, "_blank");
    setShowShareModal(false);
  };

  const handleRespond = async () => {
    if (!respuesta.trim()) return;
    setRespLoading(true);
    await respondConsulta(caso.id, respuesta.trim(), user?.nombre || caso.abogado);
    setRespuesta("");
    setRespLoading(false);
    setEditingResp(false);
    invalidateAll();
    toast.success(editingResp ? "Respuesta actualizada" : "Consulta respondida");
  };

  const handleDeleteResp = async () => {
    await deleteConsultaRespuesta(caso.id);
    setRespuesta("");
    setEditingResp(false);
    invalidateAll();
    toast.success("Respuesta eliminada");
  };

  const handleEditResp = () => {
    setRespuesta(caso.respuesta || "");
    setEditingResp(true);
  };

  const isConsulta = caso.area === "Consulta";
  const yaRespondida = !!caso.respuesta && !editingResp;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 md:gap-4 mb-2">
          <Link href="/admin/casos" className="text-beige/40 hover:text-white transition-colors p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-base md:text-xl font-bold truncate">{caso.titulo}</h2>
            <p className="text-beige/50 text-xs md:text-sm truncate">{caso.suscriptor_nombre} — {caso.area}</p>
          </div>
          <Badge>{caso.prioridad}</Badge>
        </div>
        {/* Action buttons — row that wraps on mobile */}
        <div className="flex items-center gap-2 ml-8 md:ml-12">
          <div className="relative">
            <Button size="sm" variant="secondary" onClick={() => setShowShareModal(!showShareModal)}>
              <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Compartir</span>
            </Button>
            {showShareModal && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareModal(false)} />
                <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-[calc(100vw-2rem)] max-w-72 bg-jungle-dark border border-white/10 rounded-xl p-4 shadow-xl z-50 space-y-3">
                  <p className="text-white text-sm font-medium">Compartir con cliente</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-2">
                    <input type="text" value={clientLink} readOnly className="flex-1 bg-transparent text-beige/70 text-xs outline-none min-w-0" />
                    <button onClick={handleCopyLink} className="text-oro hover:text-oro/80 transition-colors flex-shrink-0"><Copy className="w-4 h-4" /></button>
                  </div>
                  <button onClick={handleShareWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    <MessageSquare className="w-4 h-4" /> Enviar por WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
          {caso.etapa_index > 0 && (
            <Button size="sm" variant="ghost" onClick={handleRevert}>
              <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Devolver</span>
            </Button>
          )}
          {!isCerrado && (
            <Button size="sm" onClick={handleAdvance} disabled={!canAdvance}>
              <span className="hidden sm:inline">Avanzar</span> <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 overflow-x-auto">
        <div className="flex items-center gap-0.5 md:gap-1 min-w-max">
          {pipeline.stages.map((stage, i) => {
            const isPast = i < caso.etapa_index;
            const isCurrent = i === caso.etapa_index;
            return (
              <div key={stage.name} className="flex items-center flex-shrink-0">
                {i > 0 && <div className={`w-3 md:w-8 h-px mx-0.5 ${isPast || isCurrent ? "bg-oro" : "bg-white/10"}`} />}
                <div className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-1 rounded-full text-[9px] md:text-xs font-medium transition-all ${
                  isPast ? "bg-green-500/15 text-green-400" : isCurrent ? "bg-oro/20 text-oro border border-oro/30" : "bg-white/5 text-beige/30"
                }`}>
                  {isPast && <Check className="w-2.5 md:w-3 h-2.5 md:h-3" />}
                  <span className="hidden md:inline">{stage.name}</span>
                  <span className="md:hidden">{stage.name.slice(0, 4)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="flex items-center gap-2 md:gap-3">
          <User className="w-4 h-4 text-oro flex-shrink-0" />
          <div className="min-w-0"><p className="text-beige/40 text-[10px]">Abogado</p><p className="text-white text-xs md:text-sm truncate">{caso.abogado}</p></div>
        </Card>
        <Card className="flex items-center gap-2 md:gap-3">
          <Scale className="w-4 h-4 text-oro flex-shrink-0" />
          <div className="min-w-0"><p className="text-beige/40 text-[10px]">Etapa</p><p className="text-white text-xs md:text-sm truncate">{caso.etapa}</p></div>
        </Card>
        <Card className="flex items-center gap-2 md:gap-3">
          <Clock className="w-4 h-4 text-oro flex-shrink-0" />
          <div><p className="text-beige/40 text-[10px]">En etapa</p><p className="text-white text-xs md:text-sm">{daysInStage}d</p></div>
        </Card>
        <Card className="flex items-center gap-2 md:gap-3">
          <CalendarClock className={`w-4 h-4 flex-shrink-0 ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-400" : "text-oro"}`} />
          <div><p className="text-beige/40 text-[10px]">Deadline</p>
            <p className={`text-xs md:text-sm ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-400 font-bold" : "text-white"}`}>{deadlineDays !== null ? `${deadlineDays}d` : "—"}</p>
          </div>
        </Card>
      </div>

      {/* Checklist + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <StageChecklist caso={caso} stage={currentStage} onToggle={handleToggleChecklist} />
          {caso.notas_etapa && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-beige/40 text-[10px] md:text-xs mb-1">Notas de etapa</p>
              <p className="text-beige/70 text-xs md:text-sm">{caso.notas_etapa}</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-xs md:text-sm font-bold">Timeline</h4>
            <button onClick={() => setShowAddSeguimiento(!showAddSeguimiento)} className="flex items-center gap-1 text-oro text-xs hover:text-oro/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          {showAddSeguimiento && (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {TIPO_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setSegTipo(value)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] md:text-xs font-medium transition-colors ${
                      segTipo === value ? "bg-oro/15 text-oro border border-oro/30" : "bg-white/5 text-beige/40 hover:text-white"
                    }`}>
                    <Icon className="w-3 md:w-3.5 h-3 md:h-3.5" /> {label}
                  </button>
                ))}
              </div>
              <textarea value={segDescripcion} onChange={(e) => setSegDescripcion(e.target.value)} placeholder="Describe la actividad..." rows={2}
                className="w-full bg-white/5 border border-white/10 text-white text-xs md:text-sm px-3 py-2 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddSeguimiento(false); setSegDescripcion(""); }} className="text-beige/40 text-xs hover:text-white transition-colors px-3 py-1.5">Cancelar</button>
                <button onClick={handleAddSeguimiento} disabled={!segDescripcion.trim() || segLoading}
                  className="flex items-center gap-1.5 bg-oro text-jungle-dark text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-oro/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-3.5 h-3.5" /> {segLoading ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {!seguimientos?.length && !showAddSeguimiento ? (
            <p className="text-beige/40 text-xs md:text-sm">Sin actividad registrada</p>
          ) : (
            <div className="relative pl-5 md:pl-6 space-y-3 md:space-y-4">
              <div className="absolute left-1.5 md:left-2 top-2 bottom-2 w-px bg-white/10" />
              {seguimientos?.map((seg) => (
                <div key={seg.id} className="relative flex items-start gap-2 md:gap-3">
                  <div className="absolute -left-3.5 md:-left-4 top-1.5 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full border-2 border-oro bg-jungle-dark" />
                  <div className="p-1 md:p-1.5 rounded-lg bg-white/5 text-beige/50">{TIPO_ICONS[seg.tipo]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-beige/80 text-xs md:text-sm">{seg.descripcion}</p>
                    <p className="text-beige/30 text-[10px] md:text-xs mt-0.5">
                      {new Date(seg.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Consulta: real identity (always visible to admin even if anonymous) */}
      {caso.area === "Consulta" && (caso.suscriptor_nombre_real || caso.suscriptor_cedula || caso.suscriptor_email) && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-oro" />
            <h4 className="text-white text-xs md:text-sm font-bold">Datos del consultante</h4>
            {caso.suscriptor_nombre === "Anónimo" && <Badge variant="neutral" size="xs">Anónimo en blog</Badge>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs md:text-sm">
            {caso.suscriptor_nombre_real && <div><p className="text-beige/40 text-[10px]">Nombre real</p><p className="text-white">{caso.suscriptor_nombre_real}</p></div>}
            {caso.suscriptor_cedula && <div><p className="text-beige/40 text-[10px]">Cédula</p><p className="text-white">{caso.suscriptor_cedula}</p></div>}
            {caso.suscriptor_email && <div><p className="text-beige/40 text-[10px]">Email</p><p className="text-white">{caso.suscriptor_email}</p></div>}
          </div>
        </Card>
      )}

      {/* Description */}
      <Card>
        <h4 className="text-white text-xs md:text-sm font-bold mb-2">{isConsulta ? "Pregunta del consultante" : "Descripción del caso"}</h4>
        <p className="text-beige/70 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{caso.descripcion}</p>
      </Card>

      {/* Consulta: Response section */}
      {isConsulta && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-oro" />
            <h4 className="text-white text-xs md:text-sm font-bold">Respuesta al consultante</h4>
            {yaRespondida && (
              <span className="flex items-center gap-1 text-green-400 text-[10px] ml-auto">
                <CheckCircle2 className="w-3.5 h-3.5" /> Respondida
              </span>
            )}
          </div>

          {yaRespondida ? (
            <div className="space-y-3">
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                <p className="text-beige/80 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{caso.respuesta}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-xs text-beige/40">
                <span>Respondida por: <strong className="text-beige/60">{caso.respondido_por}</strong></span>
                <div className="flex items-center gap-3">
                  {caso.respondido_at && (
                    <span>{new Date(caso.respondido_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                  <button onClick={handleEditResp} className="flex items-center gap-1 text-oro hover:text-oro/80 transition-colors" title="Editar respuesta">
                    <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button onClick={handleDeleteResp} className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors" title="Eliminar respuesta">
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-beige/40 text-xs">
                {editingResp
                  ? "Editando la respuesta. Al guardar se actualizará en el blog."
                  : "Escribe la respuesta orientativa para esta consulta. Al enviar, el caso avanzará a etapa \"Respondida\" y se publicará en el blog."}
              </p>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe tu respuesta legal orientativa aquí..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 text-white text-xs md:text-sm px-4 py-3 rounded-xl placeholder-beige/30 focus:outline-none focus:border-oro/40 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <p className="text-beige/30 text-[10px]">
                  {respuesta.trim().length > 0 ? `${respuesta.trim().length} caracteres` : "Mínimo 20 caracteres"}
                </p>
                <div className="flex items-center gap-2">
                  {editingResp && (
                    <button
                      onClick={() => { setEditingResp(false); setRespuesta(""); }}
                      className="text-beige/40 text-xs hover:text-white transition-colors px-3 py-2"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleRespond}
                    disabled={respuesta.trim().length < 20 || respLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-oro to-oro-light text-jungle-dark text-xs md:text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-oro/20"
                  >
                    <Send className="w-4 h-4" /> {respLoading ? "Enviando..." : editingResp ? "Guardar cambios" : "Enviar respuesta"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
