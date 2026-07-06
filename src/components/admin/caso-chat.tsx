"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { logActividad } from "@/lib/db";
import { MessageCircle, Send, Lock, Scale, User } from "lucide-react";
import { toast } from "sonner";

interface Msg { id: string; autor_tipo: string; autor_nombre: string; contenido: string; created_at: string }

export default function CasoChat({ casoId, clienteNombre }: { casoId: string; clienteNombre?: string | null }) {
  const { user, isAbogado } = useAuth();
  const canSend = isAbogado; // solo el abogado puede escribir; el admin solo ve
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-jungle-dark px-4 py-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-oro" />
        <h3 className="text-white font-bold text-sm">Chat con el cliente{clienteNombre ? ` — ${clienteNombre}` : ""}</h3>
        <span className="text-beige/40 text-[10px] ml-auto">{msgs.length} mensaje{msgs.length === 1 ? "" : "s"}</span>
      </div>

      {/* Mensajes */}
      <div className="max-h-[400px] overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
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
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.contenido}</p>
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
        <div ref={endRef} />
      </div>

      {/* Input o aviso de solo-lectura */}
      {canSend ? (
        <form onSubmit={send} className="border-t border-gray-200 px-3 py-2.5 flex gap-2 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje al cliente..."
            className="flex-1 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2 rounded-full border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
          />
          <button type="submit" disabled={!input.trim()} className="bg-jungle-dark text-white p-2.5 rounded-full disabled:opacity-30 hover:bg-jungle transition-colors flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-2 bg-gray-50 text-gray-400 text-xs">
          <Lock className="w-3.5 h-3.5" /> Como administrador solo puedes ver este chat. Solo el abogado asignado puede responder.
        </div>
      )}
    </div>
  );
}
