"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useClientStore } from "@/lib/stores/client-store";
import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import { MessageCircle, Send, X, Bot } from "lucide-react";

interface DisplayMessage {
  role: "bot" | "user";
  content: string;
}

interface ApiMessage {
  role: "assistant" | "user";
  content: string;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-jungle-dark underline hover:text-jungle">$1</a>'
    );
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: processed }} />
      </span>
    );
  });
}

export default function ClientChatBot() {
  const session = useClientStore((s) => s.session);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  // Lock scroll on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Build client context from session + mock cases
  const getClientContext = useCallback(() => {
    if (!session) return null;
    const casos = MOCK_CASOS.filter((c) => c.suscriptor_id === session.suscriptor_id);
    return {
      nombre: session.nombre,
      plan: session.plan,
      estado_pago: session.estado_pago,
      casos: casos.map((c) => {
        const pipeline = PIPELINES[c.area];
        const progress = Math.round(((c.etapa_index + 1) / pipeline.stages.length) * 100);
        return {
          id: c.id,
          titulo: c.titulo,
          area: c.area,
          etapa: c.etapa,
          progreso: `${progress}%`,
          abogado: c.abogado,
          prioridad: c.prioridad,
          descripcion: c.descripcion,
          fecha_limite: c.fecha_limite,
          cerrado: c.etapa === "Cerrado",
        };
      }),
    };
  }, [session]);

  // Init welcome message
  useEffect(() => {
    if (isOpen && !initialized && session) {
      const ctx = getClientContext();
      const casosActivos = ctx?.casos.filter((c) => !c.cerrado).length || 0;
      setMessages([{
        role: "bot",
        content: `¡Hola, **${session.nombre.split(" ")[0]}**! 👋\n\nSoy tu asistente legal de **Legión Jurídica**. Tengo acceso a la información de tus ${casosActivos} caso${casosActivos !== 1 ? "s" : ""} activo${casosActivos !== 1 ? "s" : ""}.\n\n¿En qué te puedo ayudar?`,
      }]);
      setInitialized(true);
    }
  }, [isOpen, initialized, session, getClientContext]);

  const QUICK_REPLIES = [
    { label: "Estado de mis casos", msg: "¿Cuál es el estado de mis casos?" },
    { label: "Próximos pasos", msg: "¿Cuáles son los próximos pasos de mis casos?" },
    { label: "Hablar con abogado", msg: "Necesito hablar con mi abogado" },
  ];

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    const newHistory: ApiMessage[] = [...chatHistory, { role: "user", content: msg }];
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory,
          clientContext: getClientContext(),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      const reply: ApiMessage = { role: "assistant", content: data.content };
      setChatHistory([...newHistory, reply]);
      setMessages((prev) => [...prev, { role: "bot", content: data.content }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "Lo siento, hubo un error. Intenta de nuevo o contáctanos por [WhatsApp](https://wa.me/573176689580)." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!session) return null;

  return (
    <>
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-5 w-14 h-14 bg-jungle-dark rounded-full flex items-center justify-center shadow-lg hover:bg-jungle transition-colors active:scale-90 z-40 group"
          aria-label="Asistente Legal"
        >
          <Bot className="w-6 h-6 text-oro" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-5 sm:w-[380px] sm:h-[520px] bg-white sm:rounded-2xl sm:shadow-2xl flex flex-col z-50 sm:border sm:border-gray-200">
          {/* Header */}
          <div className="bg-jungle-dark px-4 py-3 flex items-center justify-between sm:rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-oro" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Asistente Legal</p>
                <p className="text-beige/40 text-[10px]">Sobre tus casos · En línea</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-beige/40 hover:text-white p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-jungle-dark text-white rounded-2xl rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md"
                }`}>
                  {msg.role === "bot" ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Quick replies (only after first message) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((qr) => (
                  <button key={qr.msg} onClick={() => handleSend(qr.msg)}
                    className="text-xs font-medium text-jungle-dark bg-jungle-dark/5 border border-jungle-dark/10 px-3 py-1.5 rounded-full hover:bg-jungle-dark/10 transition-colors">
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre tus casos..."
                disabled={isTyping}
                className="flex-1 bg-gray-50 border border-gray-200 text-sm text-gray-900 px-4 py-2.5 rounded-xl placeholder-gray-400 focus:outline-none focus:border-jungle-dark/40 disabled:opacity-50"
              />
              <button type="submit" disabled={!input.trim() || isTyping}
                className="bg-jungle-dark text-white p-2.5 rounded-xl hover:bg-jungle transition-colors disabled:opacity-30 active:scale-95">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
