"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { logActividad } from "@/lib/db";
import ChatComposer, { renderRich } from "@/components/chat-composer";
import { MessageCircle, Lock, Scale, User, Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface Msg { id: string; autor_tipo: string; autor_nombre: string; contenido: string; created_at: string; archivo_url?: string | null; archivo_nombre?: string | null }

const ALLOWED_EXT = ["pdf", "doc", "docx", "xls", "xlsx"];

export default function CasoChat({ casoId, clienteNombre }: { casoId: string; clienteNombre?: string | null }) {
  const { user, isAbogado } = useAuth();
  const canSend = isAbogado; // solo el abogado puede escribir; el admin solo ve
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMsgs = useCallback(async () => {
    try {
      const r = await fetch(`/api/mensajes?caso_id=${casoId}`);
      if (r.ok) setMsgs(await r.json());
    } catch { /* silent */ }
  }, [casoId]);

  useEffect(() => {
    fetchMsgs();
    const t = setInterval(fetchMsgs, 6000);
    return () => clearInterval(t);
  }, [fetchMsgs]);
  // Auto-scroll SOLO al llegar un mensaje nuevo y si ya estás cerca del fondo.
  // Mueve solo el contenedor del chat, nunca la página (por eso no usa scrollIntoView).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (prevCount.current === 0 || (msgs.length > prevCount.current && nearBottom)) {
      el.scrollTop = el.scrollHeight;
    }
    prevCount.current = msgs.length;
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((prev) => [...prev, { id: `tmp-${Date.now()}`, autor_tipo: "abogado", autor_nombre: user?.nombre || "Abogado", contenido: text, created_at: new Date().toISOString() }]);
    try {
      const r = await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso_id: casoId, contenido: text }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); toast.error(d.error || "No se pudo enviar"); }
      else logActividad("envio_mensaje", { caso_id: casoId, detalle: text.slice(0, 60) });
      fetchMsgs();
    } catch { toast.error("Error de conexión"); }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXT.includes(ext)) { toast.error("Solo se permiten archivos PDF, Word o Excel"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "documentos");
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upd = await up.json();
      if (!up.ok) { toast.error(upd.error || "Error subiendo archivo"); return; }
      setMsgs((prev) => [...prev, { id: `tmp-${Date.now()}`, autor_tipo: "abogado", autor_nombre: user?.nombre || "Abogado", contenido: "", archivo_url: upd.url, archivo_nombre: file.name, created_at: new Date().toISOString() }]);
      const r = await fetch("/api/mensajes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caso_id: casoId, archivo_url: upd.url, archivo_nombre: file.name }),
      });
      if (r.ok) logActividad("envio_mensaje", { caso_id: casoId, detalle: `📎 ${file.name}` });
      fetchMsgs();
    } catch { toast.error("Error de conexión"); }
    finally { setUploading(false); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-jungle-dark px-4 py-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-oro" />
        <h3 className="text-white font-bold text-sm">Chat con el cliente{clienteNombre ? ` — ${clienteNombre}` : ""}</h3>
        <span className="text-beige/40 text-[10px] ml-auto">{msgs.length} mensaje{msgs.length === 1 ? "" : "s"}</span>
      </div>

      {/* Mensajes */}
      <div ref={listRef} className="max-h-[400px] overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
        {msgs.length === 0 && (
          <p className="text-gray-400 text-xs text-center py-8">Aún no hay mensajes en este caso.</p>
        )}
        {msgs.map((m) => {
          const mine = m.autor_tipo === "abogado"; // el abogado (y el admin observador) ven al abogado a la derecha
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                </div>
              )}
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                mine ? "bg-jungle-dark text-white rounded-br-md" : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
              }`}>
                <p className={`text-[10px] font-medium mb-0.5 ${mine ? "text-oro" : "text-blue-600"}`}>{m.autor_nombre}</p>
                {m.contenido && <div>{renderRich(m.contenido)}</div>}
                {m.archivo_url && (
                  <a href={m.archivo_url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 mt-1 px-2.5 py-2 rounded-lg ${mine ? "bg-white/15 hover:bg-white/25" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"} transition-colors`}>
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs truncate flex-1">{m.archivo_nombre || "Documento"}</span>
                    <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  </a>
                )}
                <p className={`text-[9px] mt-1 ${mine ? "text-white/40" : "text-gray-400"}`}>
                  {new Date(m.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })} {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {mine && (
                <div className="w-7 h-7 rounded-full bg-oro/15 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-3.5 h-3.5 text-oro" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input o aviso de solo-lectura */}
      {canSend ? (
        <>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={onPickFile} disabled={uploading} />
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={send}
            uploading={uploading}
            onAttach={() => fileRef.current?.click()}
            placeholder="Escribe un mensaje al cliente..."
          />
        </>
      ) : (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-2 bg-gray-50 text-gray-400 text-xs">
          <Lock className="w-3.5 h-3.5" /> Como administrador solo puedes ver este chat. Solo el abogado asignado puede responder.
        </div>
      )}
    </div>
  );
}
