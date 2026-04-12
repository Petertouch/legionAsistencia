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
import { ArrowLeft, ChevronLeft, ChevronRight, User, Scale, CalendarClock, Clock, Phone, MessageSquare, Calendar, StickyNote, Check, Share2, Copy, Plus, Send, CheckCircle2, Pencil, Trash2, FileText, Upload, Download, Loader2, File } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; nombre: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetch(`/api/documentos?caso_id=${id}`).then((r) => r.json()).then(setDocs).catch(() => {});
  }, [id]);

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { toast.error(uploadData.error || "Error subiendo archivo"); return; }

      const docRes = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suscriptor_id: caso?.suscriptor_id || "",
          caso_id: id,
          nombre: file.name,
          tipo: "otro",
          archivo_url: uploadData.url,
          tamano: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          subido_por: user?.nombre || "Admin",
        }),
      });
      const doc = await docRes.json();
      if (!docRes.ok) { toast.error(doc.error || "Error guardando documento"); return; }
      setDocs((prev) => [doc, ...prev]);
      toast.success("Documento subido");
    } catch { toast.error("Error subiendo documento"); }
    finally { setUploading(false); }
  };

  const handleUploadDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFile(files[0]);
  };

  const { data: caso, refetch } = useQuery({ queryKey: ["caso", id], queryFn: () => getCaso(id) });
  const { data: seguimientos, refetch: refetchSeg } = useQuery({ queryKey: ["seguimientos", { caso_id: id }], queryFn: () => getSeguimientos({ caso_id: id }) });

  if (!caso) return <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 md:h-24 bg-gray-50 rounded-xl" />)}</div>;

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
          <Link href="/admin/casos" className="text-gray-400 hover:text-gray-900 transition-colors p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1 min-w-0">
            <h2 className="text-gray-900 text-base md:text-xl font-bold truncate">{caso.titulo}</h2>
            <p className="text-gray-500 text-xs md:text-sm truncate">{caso.suscriptor_nombre} — {caso.area}</p>
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
                <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-[calc(100vw-2rem)] max-w-72 bg-white border border-gray-200 rounded-xl p-4 shadow-xl z-50 space-y-3">
                  <p className="text-gray-900 text-sm font-medium">Compartir con cliente</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                    <input type="text" value={clientLink} readOnly className="flex-1 bg-transparent text-gray-600 text-xs outline-none min-w-0" />
                    <button onClick={handleCopyLink} className="text-oro hover:text-oro/80 transition-colors flex-shrink-0"><Copy className="w-4 h-4" /></button>
                  </div>
                  <button onClick={handleShareWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-600 text-gray-900 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
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
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 overflow-x-auto">
        <div className="flex items-center gap-0.5 md:gap-1 min-w-max">
          {pipeline.stages.map((stage, i) => {
            const isPast = i < caso.etapa_index;
            const isCurrent = i === caso.etapa_index;
            return (
              <div key={stage.name} className="flex items-center flex-shrink-0">
                {i > 0 && <div className={`w-3 md:w-8 h-px mx-0.5 ${isPast || isCurrent ? "bg-oro" : "bg-gray-100"}`} />}
                <div className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-1 rounded-full text-[9px] md:text-xs font-medium transition-all ${
                  isPast ? "bg-green-50 text-green-600" : isCurrent ? "bg-amber-100 text-oro border border-oro/30" : "bg-gray-50 text-gray-400"
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
          <div className="min-w-0"><p className="text-gray-400 text-[10px]">Abogado</p><p className="text-gray-900 text-xs md:text-sm truncate">{caso.abogado}</p></div>
        </Card>
        <Card className="flex items-center gap-2 md:gap-3">
          <Scale className="w-4 h-4 text-oro flex-shrink-0" />
          <div className="min-w-0"><p className="text-gray-400 text-[10px]">Etapa</p><p className="text-gray-900 text-xs md:text-sm truncate">{caso.etapa}</p></div>
        </Card>
        <Card className="flex items-center gap-2 md:gap-3">
          <Clock className="w-4 h-4 text-oro flex-shrink-0" />
          <div><p className="text-gray-400 text-[10px]">En etapa</p><p className="text-gray-900 text-xs md:text-sm">{daysInStage}d</p></div>
        </Card>
        <Card className="flex items-center gap-2 md:gap-3">
          <CalendarClock className={`w-4 h-4 flex-shrink-0 ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-600" : "text-oro"}`} />
          <div><p className="text-gray-400 text-[10px]">Deadline</p>
            <p className={`text-xs md:text-sm ${deadlineDays !== null && deadlineDays <= 3 ? "text-red-600 font-bold" : "text-gray-900"}`}>{deadlineDays !== null ? `${deadlineDays}d` : "—"}</p>
          </div>
        </Card>
      </div>

      {/* Checklist + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <StageChecklist caso={caso} stage={currentStage} onToggle={handleToggleChecklist} />
          {caso.notas_etapa && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-gray-400 text-[10px] md:text-xs mb-1">Notas de etapa</p>
              <p className="text-gray-600 text-xs md:text-sm">{caso.notas_etapa}</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-900 text-xs md:text-sm font-bold">Timeline</h4>
            <button onClick={() => setShowAddSeguimiento(!showAddSeguimiento)} className="flex items-center gap-1 text-oro text-xs hover:text-oro/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          {showAddSeguimiento && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {TIPO_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setSegTipo(value)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] md:text-xs font-medium transition-colors ${
                      segTipo === value ? "bg-amber-100 text-oro border border-oro/30" : "bg-gray-50 text-gray-400 hover:text-gray-900"
                    }`}>
                    <Icon className="w-3 md:w-3.5 h-3 md:h-3.5" /> {label}
                  </button>
                ))}
              </div>
              <textarea value={segDescripcion} onChange={(e) => setSegDescripcion(e.target.value)} placeholder="Describe la actividad..." rows={2}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs md:text-sm px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddSeguimiento(false); setSegDescripcion(""); }} className="text-gray-400 text-xs hover:text-gray-900 transition-colors px-3 py-1.5">Cancelar</button>
                <button onClick={handleAddSeguimiento} disabled={!segDescripcion.trim() || segLoading}
                  className="flex items-center gap-1.5 bg-oro text-jungle-dark text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-oro/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-3.5 h-3.5" /> {segLoading ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {!seguimientos?.length && !showAddSeguimiento ? (
            <p className="text-gray-400 text-xs md:text-sm">Sin actividad registrada</p>
          ) : (
            <div className="relative pl-5 md:pl-6 space-y-3 md:space-y-4">
              <div className="absolute left-1.5 md:left-2 top-2 bottom-2 w-px bg-gray-100" />
              {seguimientos?.map((seg) => (
                <div key={seg.id} className="relative flex items-start gap-2 md:gap-3">
                  <div className="absolute -left-3.5 md:-left-4 top-1.5 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full border-2 border-oro bg-white" />
                  <div className="p-1 md:p-1.5 rounded-lg bg-gray-50 text-gray-500">{TIPO_ICONS[seg.tipo]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-600 text-xs md:text-sm">{seg.descripcion}</p>
                    <p className="text-gray-400 text-[10px] md:text-xs mt-0.5">
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
            <h4 className="text-gray-900 text-xs md:text-sm font-bold">Datos del consultante</h4>
            {caso.suscriptor_nombre === "Anónimo" && <Badge variant="neutral" size="xs">Anónimo en blog</Badge>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs md:text-sm">
            {caso.suscriptor_nombre_real && <div><p className="text-gray-400 text-[10px]">Nombre real</p><p className="text-gray-900">{caso.suscriptor_nombre_real}</p></div>}
            {caso.suscriptor_cedula && <div><p className="text-gray-400 text-[10px]">Cédula</p><p className="text-gray-900">{caso.suscriptor_cedula}</p></div>}
            {caso.suscriptor_email && <div><p className="text-gray-400 text-[10px]">Email</p><p className="text-gray-900">{caso.suscriptor_email}</p></div>}
          </div>
        </Card>
      )}

      {/* Description */}
      <Card>
        <h4 className="text-gray-900 text-xs md:text-sm font-bold mb-2">{isConsulta ? "Pregunta del consultante" : "Descripción del caso"}</h4>
        <p className="text-gray-600 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{caso.descripcion}</p>
      </Card>

      {/* Consulta: Response section */}
      {isConsulta && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-oro" />
            <h4 className="text-gray-900 text-xs md:text-sm font-bold">Respuesta al consultante</h4>
            {yaRespondida && (
              <span className="flex items-center gap-1 text-green-600 text-[10px] ml-auto">
                <CheckCircle2 className="w-3.5 h-3.5" /> Respondida
              </span>
            )}
          </div>

          {yaRespondida ? (
            <div className="space-y-3">
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{caso.respuesta}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-400">
                <span>Respondida por: <strong className="text-gray-500">{caso.respondido_por}</strong></span>
                <div className="flex items-center gap-3">
                  {caso.respondido_at && (
                    <span>{new Date(caso.respondido_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                  <button onClick={handleEditResp} className="flex items-center gap-1 text-oro hover:text-oro/80 transition-colors" title="Editar respuesta">
                    <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button onClick={handleDeleteResp} className="flex items-center gap-1 text-red-600 hover:text-red-300 transition-colors" title="Eliminar respuesta">
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400 text-xs">
                {editingResp
                  ? "Editando la respuesta. Al guardar se actualizará en el blog."
                  : "Escribe la respuesta orientativa para esta consulta. Al enviar, el caso avanzará a etapa \"Respondida\" y se publicará en el blog."}
              </p>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe tu respuesta legal orientativa aquí..."
                rows={6}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs md:text-sm px-4 py-3 rounded-xl placeholder-gray-400 focus:outline-none focus:border-oro/40 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-[10px]">
                  {respuesta.trim().length > 0 ? `${respuesta.trim().length} caracteres` : "Mínimo 20 caracteres"}
                </p>
                <div className="flex items-center gap-2">
                  {editingResp && (
                    <button
                      onClick={() => { setEditingResp(false); setRespuesta(""); }}
                      className="text-gray-400 text-xs hover:text-gray-900 transition-colors px-3 py-2"
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
      {/* ── Documentos del caso ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-oro" /> Documentos del caso
            {docs.length > 0 && <span className="text-gray-400 text-xs font-normal">({docs.length})</span>}
          </h3>
          <label className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
            uploading ? "bg-gray-50 text-gray-400" : "bg-gray-50 text-gray-500 hover:text-oro hover:bg-amber-50"
          }`}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Subiendo..." : "Subir documento"}
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xlsx,.xls" onChange={handleUploadDoc} disabled={uploading} />
          </label>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed transition-all mb-3 ${
            dragging
              ? "border-oro bg-oro/5 py-8"
              : "border-gray-200 hover:border-gray-200 py-4"
          } ${uploading ? "pointer-events-none opacity-50" : ""}`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-oro animate-spin mb-1" />
            ) : (
              <Upload className={`w-6 h-6 mb-1 transition-colors ${dragging ? "text-oro" : "text-beige/15"}`} />
            )}
            <p className={`text-xs transition-colors ${dragging ? "text-oro font-medium" : "text-gray-400"}`}>
              {uploading ? "Subiendo..." : dragging ? "Suelta aquí para subir" : "Arrastra archivos aquí"}
            </p>
            <p className="text-[10px] text-gray-300 mt-0.5">PDF, Word, Excel, imágenes · max 10MB</p>
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-gray-300 text-xs">Sin documentos aún</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-white transition-colors group">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{doc.nombre}</p>
                  <div className="flex items-center gap-2 text-[10px] mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium ${
                      doc.subido_por === user?.nombre || doc.subido_por === "Admin"
                        ? "bg-amber-100 text-oro"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      <User className="w-2.5 h-2.5" />
                      {doc.subido_por === user?.nombre ? "Tú" : doc.subido_por || "Cliente"}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">{doc.tamano}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">{new Date(doc.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-oro hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100" title="Descargar">
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setDeletingDoc({ id: doc.id, nombre: doc.nombre })}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
      {/* ── Modal confirmar eliminación ── */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !deleteLoading && setDeletingDoc(null)}>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-sm">Eliminar documento</h3>
                <p className="text-gray-400 text-xs mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-gray-600 text-sm truncate">{deletingDoc.nombre}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeletingDoc(null)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  const res = await fetch(`/api/documentos?id=${deletingDoc.id}`, { method: "DELETE" });
                  if (res.ok) {
                    setDocs((prev) => prev.filter((d) => d.id !== deletingDoc.id));
                    toast.success("Documento eliminado");
                  } else {
                    toast.error("Error eliminando documento");
                  }
                  setDeleteLoading(false);
                  setDeletingDoc(null);
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
