"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import Button from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Clock, Send, CheckCircle } from "lucide-react";

interface ConsultaBlog {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  area: string;
  pregunta: string;
  status: string;
  respuesta: string | null;
  respondido_por: string | null;
  respondido_at: string | null;
  created_at: string;
}

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<ConsultaBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/consultas-blog")
      .then((r) => (r.ok ? r.json() : []))
      .then(setConsultas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendientes = consultas.filter((c) => c.status === "pendiente");
  const respondidas = consultas.filter((c) => c.status === "respondida");

  const handleResponder = async (id: string) => {
    if (!respuesta.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/consultas-blog/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulta_id: id, respuesta: respuesta.trim(), respondido_por: user?.nombre || "Abogado" }),
      });
      if (res.ok) {
        setConsultas((prev) => prev.map((c) => c.id === id ? { ...c, status: "respondida", respuesta: respuesta.trim(), respondido_por: user?.nombre || "Abogado", respondido_at: new Date().toISOString() } : c));
        setRespondingId(null);
        setRespuesta("");
        toast.success("Respuesta enviada al correo del consultante");
      } else {
        toast.error("Error al responder");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSending(false);
    }
  };

  const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-oro" /> Consultas orientativas gratuitas
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Preguntas del blog. Al responder, la respuesta se envía al correo del consultante.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {pendientes.length > 0 && (
            <span className="bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full border border-red-200">
              {pendientes.length} pendiente{pendientes.length === 1 ? "" : "s"}
            </span>
          )}
          <span className="text-green-600 font-medium">{respondidas.length} respondida{respondidas.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-16">Cargando consultas…</p>
      ) : consultas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aún no hay consultas gratuitas.</p>
        </div>
      ) : (
        <>
          {/* Pendientes */}
          <div className="space-y-2">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pendientes
            </p>
            {pendientes.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center bg-gray-50 border border-gray-200 rounded-xl">
                No hay consultas pendientes 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {pendientes.map((c) => (
                  <div key={c.id} className="bg-white border-2 border-oro/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> PENDIENTE
                      </span>
                      <span className="text-gray-900 font-medium text-sm">{c.nombre} {c.apellido}</span>
                      <span className="text-gray-400 text-[10px]">{c.area}</span>
                      <span className="text-gray-400 text-[10px] ml-auto">{fechaCorta(c.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs mb-2">
                      <span>{c.email}</span>
                      <span>{c.telefono}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                      <p className="text-gray-800 text-sm">&ldquo;{c.pregunta}&rdquo;</p>
                    </div>
                    {respondingId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={respuesta}
                          onChange={(e) => setRespuesta(e.target.value)}
                          placeholder="Escribe tu respuesta orientativa..."
                          rows={4}
                          className="w-full bg-white border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40 resize-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { setRespondingId(null); setRespuesta(""); }} className="text-gray-400 text-xs hover:text-gray-700">Cancelar</button>
                          <Button size="sm" onClick={() => handleResponder(c.id)} disabled={sending || !respuesta.trim()}>
                            <Send className="w-3 h-3" /> {sending ? "Enviando..." : "Responder y enviar al correo"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingId(c.id)}
                        className="flex items-center gap-1.5 text-oro text-xs font-medium hover:text-amber-700 transition-colors"
                      >
                        <Send className="w-3 h-3" /> Responder
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Respondidas */}
          {respondidas.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 pt-2">
                <CheckCircle className="w-3.5 h-3.5" /> Respondidas
              </p>
              <div className="space-y-2">
                {respondidas.map((c) => (
                  <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> RESPONDIDA
                      </span>
                      <span className="text-gray-900 font-medium text-sm">{c.nombre} {c.apellido}</span>
                      <span className="text-gray-400 text-[10px]">{c.area}</span>
                      {c.respondido_por && <span className="text-gray-400 text-[10px] ml-auto">por {c.respondido_por}</span>}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 mb-1.5">
                      <p className="text-gray-500 text-xs">&ldquo;{c.pregunta}&rdquo;</p>
                    </div>
                    {c.respuesta && (
                      <div className="bg-white border-l-2 border-oro/40 px-3 py-2">
                        <p className="text-gray-700 text-sm whitespace-pre-line">{c.respuesta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
