"use client";

import { useState, useEffect } from "react";
import { useQuestionsStore, type PreguntaPublica } from "@/lib/stores/questions-store";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  MessageCircle,
  Search,
  Clock,
  CheckCircle2,
  Send,
  Trash2,
  Phone,
  X,
  ChevronDown,
} from "lucide-react";

export default function ConsultasPage() {
  const { preguntas, responder, deletePregunta } = useQuestionsStore();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"todas" | "pendiente" | "respondida">("todas");
  const [search, setSearch] = useState("");
  const [responding, setResponding] = useState<string | null>(null);
  const [respuestaText, setRespuestaText] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const filtered = preguntas.filter((p) => {
    if (filter !== "todas" && p.estado !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.pregunta.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q);
    }
    return true;
  });

  const pendientes = preguntas.filter((p) => p.estado === "pendiente").length;
  const respondidas = preguntas.filter((p) => p.estado === "respondida").length;

  const handleResponder = (id: string) => {
    if (!respuestaText.trim()) return;
    responder(id, respuestaText.trim());
    setResponding(null);
    setRespuestaText("");
  };

  const getTimeSince = (date: string) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Hace menos de 1h";
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <MessageCircle className="w-5 h-5 text-oro" />
          <span className="text-beige/50 text-xs md:text-sm">{preguntas.length} consultas</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className={`bg-white/5 border rounded-xl p-3 cursor-pointer transition-all ${
          filter === "todas" ? "border-oro/30" : "border-white/10 hover:border-white/20"
        }`} onClick={() => setFilter("todas")}>
          <p className="text-beige/40 text-[10px] mb-0.5">Total</p>
          <p className="text-white text-lg font-bold">{preguntas.length}</p>
        </div>
        <div className={`bg-white/5 border rounded-xl p-3 cursor-pointer transition-all ${
          filter === "pendiente" ? "border-orange-500/30" : "border-white/10 hover:border-white/20"
        }`} onClick={() => setFilter("pendiente")}>
          <div className="flex items-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-orange-400" />
            <p className="text-beige/40 text-[10px]">Pendientes</p>
          </div>
          <p className={`text-lg font-bold ${pendientes > 0 ? "text-orange-400" : "text-white"}`}>{pendientes}</p>
        </div>
        <div className={`bg-white/5 border rounded-xl p-3 cursor-pointer transition-all ${
          filter === "respondida" ? "border-green-500/30" : "border-white/10 hover:border-white/20"
        }`} onClick={() => setFilter("respondida")}>
          <div className="flex items-center gap-1 mb-0.5">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <p className="text-beige/40 text-[10px]">Respondidas</p>
          </div>
          <p className="text-white text-lg font-bold">{respondidas}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar consulta..."
          className="w-full bg-white/5 border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg placeholder-beige/30 focus:outline-none focus:border-oro/40" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className={`bg-white/5 border rounded-xl overflow-hidden transition-all ${
            p.estado === "pendiente" ? "border-orange-500/20" : "border-white/10"
          }`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold">{p.nombre}</span>
                  <Badge size="xs" variant={p.estado === "pendiente" ? "warning" : "success"}>
                    {p.estado === "pendiente" ? "Pendiente" : "Respondida"}
                  </Badge>
                  <span className="text-beige/30 text-[10px]">{p.rama} • {p.area}</span>
                </div>
                <span className="text-beige/30 text-[10px] whitespace-nowrap">{getTimeSince(p.created_at)}</span>
              </div>

              <p className="text-beige/70 text-sm leading-relaxed mb-2">{p.pregunta}</p>

              {/* Contact + actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`https://wa.me/57${p.telefono.replace(/\D/g, "")}`} target="_blank"
                  className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 transition-colors">
                  <Phone className="w-3 h-3" /> {p.telefono}
                </a>
                {p.estado === "pendiente" && (
                  <button onClick={() => { setResponding(responding === p.id ? null : p.id); setRespuestaText(""); }}
                    className="inline-flex items-center gap-1 text-[10px] text-oro hover:text-oro-light transition-colors ml-auto">
                    <Send className="w-3 h-3" /> Responder
                  </button>
                )}
                {p.estado === "respondida" && (
                  <button onClick={() => setResponding(responding === p.id ? null : p.id)}
                    className="inline-flex items-center gap-1 text-[10px] text-beige/30 hover:text-beige/50 transition-colors ml-auto">
                    <ChevronDown className={`w-3 h-3 transition-transform ${responding === p.id ? "rotate-180" : ""}`} /> Ver respuesta
                  </button>
                )}
                <button onClick={() => deletePregunta(p.id)}
                  className="inline-flex items-center gap-1 text-[10px] text-red-400/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Response area */}
              {responding === p.id && p.estado === "pendiente" && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <textarea
                    value={respuestaText} onChange={(e) => setRespuestaText(e.target.value)}
                    placeholder="Escribe la respuesta orientativa..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg placeholder-beige/20 focus:outline-none focus:border-oro/40 resize-none mb-2"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setResponding(null)}>Cancelar</Button>
                    <Button size="sm" onClick={() => handleResponder(p.id)} disabled={!respuestaText.trim()}>
                      <Send className="w-3 h-3" /> Enviar respuesta
                    </Button>
                  </div>
                </div>
              )}

              {/* Show existing response */}
              {responding === p.id && p.estado === "respondida" && p.respuesta && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-beige/50 text-xs leading-relaxed">{p.respuesta}</p>
                  <p className="text-beige/20 text-[9px] mt-1.5">
                    Respondida el {p.responded_at ? new Date(p.responded_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-beige/30 text-sm">
              {filter === "pendiente" ? "No hay consultas pendientes" : "No se encontraron consultas"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
