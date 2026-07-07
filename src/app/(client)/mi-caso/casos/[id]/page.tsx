"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import ChatComposer, { renderRich } from "@/components/chat-composer";
import type { Caso } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import {
  ArrowLeft, Clock, CalendarClock, Check, ArrowRight, User, MessageCircle,
  X, FileText, Upload, Download, Trash2, Loader2, File, Scale,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "info" | "documentos" | "chat";

interface Props { params: Promise<{ id: string }>; }

export default function ClientCaseDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  type ChatMsg = { id: string; sender: string; sender_name: string; content: string; created_at: string; archivo_url?: string | null; archivo_nombre?: string | null };
  const [caseMessages, setCaseMessages] = useState<ChatMsg[]>([]);
  const [mounted, setMounted] = useState(false);
  const [chatUploading, setChatUploading] = useState(false);
  const chatFileRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch(`/api/mensajes?caso_id=${id}`);
      if (!r.ok) return;
      const rows = await r.json();
      setCaseMessages((rows as Record<string, string>[]).map((m) => ({
        id: m.id, sender: m.autor_tipo, sender_name: m.autor_nombre, content: m.contenido, created_at: m.created_at,
        archivo_url: m.archivo_url, archivo_nombre: m.archivo_nombre,
      })));
    } catch { /* silent */ }
  }, [id]);
  const [tab, setTab] = useState<Tab>("info");
  const [chatInput, setChatInput] = useState("");
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !session) router.replace("/mi-caso"); }, [mounted, session, router]);
  // Bajar solo cuando llega un mensaje nuevo (no en cada refresco del polling).
  const prevMsgLen = useRef(0);
  useEffect(() => {
    const isNew = caseMessages.length > prevMsgLen.current;
    prevMsgLen.current = caseMessages.length;
    if (isNew) messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [caseMessages]);
  useEffect(() => {
    if (chatFullscreen) messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [chatFullscreen]);
  // Cargar mensajes del caso + refrescar cada 6s (chat en vivo).
  useEffect(() => {
    if (!mounted || !id) return;
    fetchMessages();
    const t = setInterval(fetchMessages, 6000);
    return () => clearInterval(t);
  }, [mounted, id, fetchMessages]);
  useEffect(() => {
    if (mounted && id) {
      fetch(`/api/documentos?caso_id=${id}`).then((r) => r.json()).then(setDocs).catch(() => {});
    }
  }, [mounted, id]);

  useEffect(() => {
    if (!chatFullscreen) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${window.scrollY}px`;
    const vv = window.visualViewport;
    if (vv) {
      setViewportHeight(vv.height);
      const onResize = () => setViewportHeight(vv.height);
      vv.addEventListener("resize", onResize);
      return () => { vv.removeEventListener("resize", onResize); const sy = document.body.style.top; document.body.style.overflow = ""; document.body.style.position = ""; document.body.style.width = ""; document.body.style.top = ""; window.scrollTo(0, parseInt(sy || "0") * -1); };
    } else {
      setViewportHeight(window.innerHeight);
      return () => { const sy = document.body.style.top; document.body.style.overflow = ""; document.body.style.position = ""; document.body.style.width = ""; document.body.style.top = ""; window.scrollTo(0, parseInt(sy || "0") * -1); };
    }
  }, [chatFullscreen]);

  const [caso, setCaso] = useState<Caso | null>(null);
  const [casoLoading, setCasoLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/casos/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && data.suscriptor_id === session.suscriptor_id) setCaso(data); setCasoLoading(false); })
      .catch(() => setCasoLoading(false));
  }, [id, session]);

  if (!mounted || !session) return null;

  if (casoLoading) return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>;

  if (!caso) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Caso no encontrado</p>
        <Link href="/mi-caso/casos" className="text-jungle-dark text-sm font-medium mt-2 inline-block hover:underline">← Volver</Link>
      </div>
    );
  }

  const pipeline = PIPELINES[caso.area];
  const totalStages = pipeline.stages.length;
  const progressPercent = Math.round(((caso.etapa_index + 1) / totalStages) * 100);
  const currentStage = pipeline.stages[caso.etapa_index];
  const nextStage = caso.etapa_index + 1 < totalStages ? pipeline.stages[caso.etapa_index + 1] : null;
  const isCerrado = caso.etapa === "Cerrado";
  const daysInStage = Math.floor((Date.now() - new Date(caso.fecha_ingreso_etapa).getTime()) / 86400000);

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    // Optimista: se muestra al instante y se confirma con el refetch.
    setCaseMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, sender: "cliente", sender_name: session.nombre, content: text, created_at: new Date().toISOString() }]);
    try {
      const r = await fetch("/api/client/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso_id: caso.id, suscriptor_id: session.suscriptor_id, nombre: session.nombre, contenido: text }),
      });
      if (!r.ok) { toast.error("No se pudo enviar el mensaje"); }
      fetchMessages();
    } catch { toast.error("Error de conexión"); }
  };

  const handleChatFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "doc", "docx", "xls", "xlsx"].includes(ext)) { toast.error("Solo se permiten archivos PDF, Word o Excel"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10MB"); return; }
    setChatUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/client/upload", { method: "POST", body: fd });
      const upd = await up.json();
      if (!up.ok) { toast.error(upd.error || "Error subiendo archivo"); return; }
      setCaseMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, sender: "cliente", sender_name: session.nombre, content: "", created_at: new Date().toISOString(), archivo_url: upd.url, archivo_nombre: file.name }]);
      await fetch("/api/client/mensajes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso_id: caso.id, suscriptor_id: session.suscriptor_id, nombre: session.nombre, archivo_url: upd.url, archivo_nombre: file.name }),
      });
      fetchMessages();
    } catch { toast.error("Error de conexión"); }
    finally { setChatUploading(false); }
  };

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
          suscriptor_id: session.suscriptor_id,
          caso_id: caso.id,
          nombre: file.name,
          tipo: "otro",
          archivo_url: uploadData.url,
          tamano: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          subido_por: session.nombre,
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

  const TABS = [
    { id: "info" as Tab, label: "Información", icon: Scale },
    { id: "documentos" as Tab, label: `Documentos${docs.length > 0 ? ` (${docs.length})` : ""}`, icon: FileText },
    { id: "chat" as Tab, label: `Chat${caseMessages.length > 0 ? ` (${caseMessages.length})` : ""}`, icon: MessageCircle },
  ];

  const TIPO_LABELS: Record<string, string> = { contrato: "Contrato", anexo: "Anexo", identificacion: "ID", otro: "Documento" };

  return (
    <div className="space-y-4">
      {/* Input de archivo del chat (compartido por las dos vistas) */}
      <input ref={chatFileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleChatFile} />

      <Link href="/mi-caso/casos" className="inline-flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mis casos
      </Link>

      {/* Title + Progress */}
      <div>
        <h1 className="text-gray-900 text-xl font-bold">{caso.titulo}</h1>
        <p className="text-gray-500 text-sm">{caso.area} · {caso.abogado}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Progreso</span>
          <span className="text-xs font-bold" style={{ color: isCerrado ? "#22c55e" : "#C29613" }}>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: isCerrado ? "#22c55e" : "#C29613" }} />
        </div>
        <div className="flex items-center justify-between mt-3 gap-0.5">
          {pipeline.stages.map((stage, i) => (
            <div key={stage.name} className="flex flex-col items-center flex-1 min-w-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                i < caso.etapa_index ? "bg-green-500 border-green-500 text-white"
                : i === caso.etapa_index ? "bg-oro border-oro text-white"
                : "bg-gray-100 border-gray-200 text-gray-400"
              }`}>
                {i < caso.etapa_index ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </div>
              <span className={`text-[7px] mt-0.5 text-center leading-tight truncate w-full ${i === caso.etapa_index ? "text-gray-900 font-medium" : "text-gray-400"}`}>{stage.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 relative flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                  active ? "text-jungle-dark" : "text-gray-400 hover:text-gray-600"
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {active && <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-jungle-dark rounded-t-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab: Info ── */}
      {tab === "info" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1"><Clock className="w-3.5 h-3.5" /><span className="text-[10px]">Días en etapa</span></div>
              <p className="text-lg font-bold text-gray-900">{daysInStage}</p>
              <p className="text-[10px] text-gray-400">{caso.etapa}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1"><CalendarClock className="w-3.5 h-3.5" /><span className="text-[10px]">Estimado</span></div>
              <p className="text-lg font-bold text-gray-900">{currentStage.expectedDays}d</p>
              {nextStage && !isCerrado && <p className="text-[10px] text-gray-400 flex items-center gap-0.5"><ArrowRight className="w-2.5 h-2.5" /> {nextStage.name}</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Información</h3>
            <p className="text-gray-600 text-xs leading-relaxed mb-3">{caso.descripcion}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>👤 {caso.abogado}</span>
              {caso.fecha_limite && <span>📅 Límite: {new Date(caso.fecha_limite).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Documentos ── */}
      {tab === "documentos" && (
        <div className="space-y-3">
          {/* Upload / Drop zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-white ${
              dragging
                ? "border-jungle-dark bg-jungle-dark/5 py-8"
                : "border-gray-200 hover:border-jungle-dark/30 py-6"
            } ${uploading ? "pointer-events-none opacity-60" : ""} group`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-jungle-dark animate-spin" />
            ) : (
              <Upload className={`w-6 h-6 transition-colors ${dragging ? "text-jungle-dark" : "text-gray-300 group-hover:text-jungle-dark"}`} />
            )}
            <span className={`text-xs transition-colors ${dragging ? "text-jungle-dark font-medium" : "text-gray-400 group-hover:text-gray-600"}`}>
              {uploading ? "Subiendo..." : dragging ? "Suelta aquí para subir" : "Arrastra archivos o click para subir"}
            </span>
            <span className="text-[10px] text-gray-300">PDF, Word, Excel, imágenes · max 10MB</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xlsx,.xls" onChange={handleUploadDoc} disabled={uploading} />
          </label>

          {/* Documents list */}
          {docs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <File className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hay documentos en este caso</p>
              <p className="text-gray-300 text-xs mt-1">Sube documentos relevantes para tu caso</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group by sender */}
              {(() => {
                const clientDocs = docs.filter((d) => d.subido_por === session.nombre);
                const lawyerDocs = docs.filter((d) => d.subido_por !== session.nombre);
                const getFileIcon = (name: string) => {
                  const ext = name.split(".").pop()?.toLowerCase() || "";
                  if (["pdf"].includes(ext)) return { bg: "bg-red-50", color: "text-red-400", label: "PDF" };
                  if (["doc", "docx"].includes(ext)) return { bg: "bg-blue-50", color: "text-blue-400", label: "DOC" };
                  if (["xls", "xlsx"].includes(ext)) return { bg: "bg-green-50", color: "text-green-500", label: "XLS" };
                  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return { bg: "bg-purple-50", color: "text-purple-400", label: "IMG" };
                  return { bg: "bg-gray-50", color: "text-gray-400", label: "FILE" };
                };

                const renderDocGroup = (title: string, icon: React.ReactNode, groupDocs: typeof docs, accentColor: string) => {
                  if (groupDocs.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {icon}
                        <span className="text-xs font-semibold text-gray-700">{title}</span>
                        <span className="text-[10px] text-gray-400">({groupDocs.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {groupDocs.map((doc) => {
                          const fi = getFileIcon(doc.nombre);
                          return (
                            <div key={doc.id} className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-all group`}>
                              <div className="flex items-center gap-3 p-3">
                                {/* File type icon */}
                                <div className={`w-11 h-11 rounded-xl ${fi.bg} flex flex-col items-center justify-center flex-shrink-0`}>
                                  <FileText className={`w-4 h-4 ${fi.color}`} />
                                  <span className={`text-[8px] font-bold mt-0.5 ${fi.color}`}>{fi.label}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 text-sm font-medium truncate">{doc.nombre}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-400">{doc.tamano}</span>
                                    <span className="text-gray-200">·</span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(doc.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                  </div>
                                </div>

                                {/* Download */}
                                <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer"
                                  className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-jungle-dark hover:bg-gray-100 transition-colors flex-shrink-0">
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                              {/* Accent bar */}
                              <div className={`h-0.5 ${accentColor}`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {renderDocGroup(
                      `Enviados por ${caso.abogado}`,
                      <div className="w-6 h-6 rounded-full bg-oro/15 flex items-center justify-center"><Scale className="w-3 h-3 text-oro" /></div>,
                      lawyerDocs,
                      "bg-gradient-to-r from-oro/40 to-oro/10"
                    )}
                    {renderDocGroup(
                      "Mis documentos",
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><User className="w-3 h-3 text-blue-500" /></div>,
                      clientDocs,
                      "bg-gradient-to-r from-blue-400/40 to-blue-400/10"
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Chat ── */}
      {tab === "chat" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-jungle-dark px-4 py-3 flex items-center gap-2 cursor-pointer sm:cursor-default" onClick={() => setChatFullscreen(true)}>
            <MessageCircle className="w-4 h-4 text-oro" />
            <h3 className="text-white font-bold text-sm">Chat con {caso.abogado}</h3>
            <span className="text-beige/40 text-[10px] ml-auto">{caseMessages.length} mensajes</span>
          </div>

          {/* Desktop: inline chat */}
          <div className="hidden sm:flex sm:flex-col">
            <div className="max-h-[350px] overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {caseMessages.length === 0 && <p className="text-gray-400 text-xs text-center py-6">No hay mensajes aún. Escribe para iniciar.</p>}
              {caseMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "cliente" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.sender === "cliente" ? "bg-jungle-dark text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"}`}>
                    {msg.sender === "abogado" && <p className="text-[10px] font-medium text-oro mb-0.5">{msg.sender_name}</p>}
                    {msg.content && <div>{renderRich(msg.content)}</div>}
                  {msg.archivo_url && (
                    <a href={msg.archivo_url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 mt-1 px-2.5 py-1.5 rounded-lg ${msg.sender === "cliente" ? "bg-white/15 hover:bg-white/25" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"} transition-colors`}>
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[11px] truncate flex-1">{msg.archivo_nombre || "Documento"}</span>
                      <Download className="w-3 h-3 flex-shrink-0 opacity-70" />
                    </a>
                  )}
                    <p className={`text-[9px] mt-1 ${msg.sender === "cliente" ? "text-white/40" : "text-gray-400"}`}>
                      {new Date(msg.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })} {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={!chatFullscreen ? messagesEndRef : undefined} />
            </div>
            <ChatComposer value={chatInput} onChange={setChatInput} onSend={handleSendMessage} uploading={chatUploading} onAttach={() => chatFileRef.current?.click()} />
          </div>

          {/* Mobile: tap to open fullscreen */}
          <div className="sm:hidden px-4 py-3" onClick={() => setChatFullscreen(true)}>
            <p className="text-gray-400 text-xs text-center">Toca para abrir el chat</p>
          </div>
        </div>
      )}

      {/* Chat fullscreen overlay - mobile */}
      {chatFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white sm:hidden" style={{ height: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh" }}>
          <div className="bg-jungle-dark px-4 py-3 flex items-center gap-2 flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-oro" />
            <h3 className="text-white font-bold text-sm flex-1">Chat con {caso.abogado}</h3>
            <button onClick={() => setChatFullscreen(false)} className="text-white/70 hover:text-white p-1 -mr-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 min-h-0">
            {caseMessages.length === 0 && <p className="text-gray-400 text-xs text-center py-6">No hay mensajes aún.</p>}
            {caseMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "cliente" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.sender === "cliente" ? "bg-jungle-dark text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"}`}>
                  {msg.sender === "abogado" && <p className="text-[10px] font-medium text-oro mb-0.5">{msg.sender_name}</p>}
                  {msg.content && <div>{renderRich(msg.content)}</div>}
                  {msg.archivo_url && (
                    <a href={msg.archivo_url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 mt-1 px-2.5 py-1.5 rounded-lg ${msg.sender === "cliente" ? "bg-white/15 hover:bg-white/25" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"} transition-colors`}>
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[11px] truncate flex-1">{msg.archivo_nombre || "Documento"}</span>
                      <Download className="w-3 h-3 flex-shrink-0 opacity-70" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatFullscreen ? messagesEndRef : undefined} />
          </div>
          <div className="flex-shrink-0">
            <ChatComposer value={chatInput} onChange={setChatInput} onSend={handleSendMessage} uploading={chatUploading} onAttach={() => chatFileRef.current?.click()} />
          </div>
        </div>
      )}
    </div>
  );
}
