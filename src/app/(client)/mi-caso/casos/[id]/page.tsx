"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useClientStore } from "@/lib/stores/client-store";
import { useMessagesStore } from "@/lib/stores/messages-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import { ArrowLeft, Clock, CalendarClock, Check, ArrowRight, User, MessageCircle, Send, X } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ClientCaseDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const session = useClientStore((s) => s.session);
  const messages = useMessagesStore((s) => s.messages);
  const getMessages = useMessagesStore((s) => s.getMessages);
  const addMessage = useMessagesStore((s) => s.addMessage);
  const [mounted, setMounted] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !session) router.replace("/mi-caso");
  }, [mounted, session, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatFullscreen]);

  // Lock body scroll + track visual viewport for keyboard resize
  useEffect(() => {
    if (!chatFullscreen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    // Prevent iOS bounce/scroll
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${window.scrollY}px`;

    const vv = window.visualViewport;
    if (vv) {
      setViewportHeight(vv.height);
      const onResize = () => {
        setViewportHeight(vv.height);
      };
      vv.addEventListener("resize", onResize);
      return () => {
        vv.removeEventListener("resize", onResize);
        const scrollY = document.body.style.top;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = "";
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      };
    } else {
      setViewportHeight(window.innerHeight);
      return () => {
        const scrollY = document.body.style.top;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = "";
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      };
    }
  }, [chatFullscreen]);

  if (!mounted || !session) return null;

  const caso = MOCK_CASOS.find((c) => c.id === id && c.suscriptor_id === session.suscriptor_id);

  if (!caso) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Caso no encontrado</p>
        <Link href="/mi-caso/casos" className="text-jungle-dark text-sm font-medium mt-2 inline-block hover:underline">
          ← Volver a mis casos
        </Link>
      </div>
    );
  }

  const pipeline = PIPELINES[caso.area];
  const totalStages = pipeline.stages.length;
  const progressPercent = Math.round(((caso.etapa_index + 1) / totalStages) * 100);
  const currentStage = pipeline.stages[caso.etapa_index];
  const nextStage = caso.etapa_index + 1 < totalStages ? pipeline.stages[caso.etapa_index + 1] : null;
  const isCerrado = caso.etapa === "Cerrado";
  const daysInStage = Math.floor((Date.now() - new Date(caso.fecha_ingreso_etapa).getTime()) / (1000 * 60 * 60 * 24));
  const caseMessages = getMessages(caso.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    addMessage({
      caso_id: caso.id,
      sender: "cliente",
      sender_name: session.nombre,
      content: chatInput.trim(),
    });
    setChatInput("");
    // Keep focus on input after sending
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/mi-caso/casos" className="inline-flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mis casos
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-gray-900 text-xl font-bold">{caso.titulo}</h1>
        <p className="text-gray-500 text-sm">{caso.area} • {caso.abogado}</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Progreso del caso</span>
          <span className="text-xs font-bold" style={{ color: isCerrado ? "#22c55e" : "#C29613" }}>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: isCerrado ? "#22c55e" : "#C29613" }} />
        </div>

        {/* Stage dots */}
        <div className="flex items-center justify-between mt-3 gap-0.5">
          {pipeline.stages.map((stage, i) => {
            const isPast = i < caso.etapa_index;
            const isCurrent = i === caso.etapa_index;
            return (
              <div key={stage.name} className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                  isPast ? "bg-green-500 border-green-500 text-white"
                  : isCurrent ? "bg-oro border-oro text-white"
                  : "bg-gray-100 border-gray-200 text-gray-400"
                }`}>
                  {isPast ? <Check className="w-2.5 h-2.5" /> : i + 1}
                </div>
                <span className={`text-[7px] mt-0.5 text-center leading-tight truncate w-full ${
                  isCurrent ? "text-gray-900 font-medium" : "text-gray-400"
                }`}>{stage.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage + info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px]">Días en etapa</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{daysInStage}</p>
          <p className="text-[10px] text-gray-400">Etapa: {caso.etapa}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <CalendarClock className="w-3.5 h-3.5" />
            <span className="text-[10px]">Estimado</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{currentStage.expectedDays}d</p>
          {nextStage && !isCerrado && (
            <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <ArrowRight className="w-2.5 h-2.5" /> {nextStage.name}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" /> Información
        </h3>
        <p className="text-gray-600 text-xs leading-relaxed mb-3">{caso.descripcion}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>👤 {caso.abogado}</span>
          {caso.fecha_limite && (
            <span>📅 Límite: {new Date(caso.fecha_limite).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
          )}
        </div>
      </div>

      {/* Chat with lawyer - inline (default) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          className="bg-jungle-dark px-4 py-3 flex items-center gap-2 cursor-pointer sm:cursor-default"
          onClick={() => setChatFullscreen(true)}
        >
          <MessageCircle className="w-4 h-4 text-oro" />
          <h3 className="text-white font-bold text-sm">Chat con {caso.abogado}</h3>
          <span className="text-beige/40 text-[10px] ml-auto">{caseMessages.length} mensajes</span>
        </div>

        {/* Desktop: inline chat */}
        <div className="hidden sm:flex sm:flex-col">
          <div className="max-h-[300px] overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {caseMessages.length === 0 && (
              <p className="text-gray-400 text-xs text-center py-6">No hay mensajes aún. Escribe para iniciar la conversación.</p>
            )}
            {caseMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "cliente" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === "cliente"
                    ? "bg-jungle-dark text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                }`}>
                  {msg.sender === "abogado" && (
                    <p className="text-[10px] font-medium text-oro mb-0.5">{msg.sender_name}</p>
                  )}
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${msg.sender === "cliente" ? "text-white/40" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })} {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={!chatFullscreen ? messagesEndRef : undefined} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-gray-200 px-3 py-2.5 flex gap-2 bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2 rounded-full border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-jungle-dark text-white p-2 rounded-full disabled:opacity-30 hover:bg-jungle transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Mobile: tap to open fullscreen */}
        <div className="sm:hidden px-4 py-3" onClick={() => setChatFullscreen(true)}>
          <p className="text-gray-400 text-xs text-center">Toca para abrir el chat</p>
        </div>
      </div>

      {/* Chat fullscreen overlay - mobile only */}
      {chatFullscreen && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white sm:hidden"
          style={{ height: viewportHeight > 0 ? `${viewportHeight}px` : "100dvh" }}
        >
          {/* Header - fixed height */}
          <div className="bg-jungle-dark px-4 py-3 flex items-center gap-2 flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-oro" />
            <h3 className="text-white font-bold text-sm flex-1">Chat con {caso.abogado}</h3>
            <button
              onClick={() => setChatFullscreen(false)}
              className="text-white/70 hover:text-white p-1 -mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages - fills all available space */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 min-h-0">
            {caseMessages.length === 0 && (
              <p className="text-gray-400 text-xs text-center py-6">No hay mensajes aún. Escribe para iniciar la conversación.</p>
            )}
            {caseMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "cliente" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === "cliente"
                    ? "bg-jungle-dark text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                }`}>
                  {msg.sender === "abogado" && (
                    <p className="text-[10px] font-medium text-oro mb-0.5">{msg.sender_name}</p>
                  )}
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${msg.sender === "cliente" ? "text-white/40" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })} {new Date(msg.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatFullscreen ? messagesEndRef : undefined} />
          </div>

          {/* Input - fixed at bottom, never moves */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 px-3 py-2.5 flex gap-2 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2 rounded-full border border-gray-200 focus:border-jungle-dark/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-jungle-dark text-white p-2 rounded-full disabled:opacity-30 hover:bg-jungle transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
