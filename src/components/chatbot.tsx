"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { KeyRound, LogOut } from "lucide-react";
import { useKnowledgeStore } from "@/lib/stores/knowledge-store";
import { useReferralStore } from "@/lib/stores/referral-store";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface DisplayMessage {
  role: "bot" | "user";
  content: string;
  timestamp: Date;
}

interface ClientContext {
  nombre: string;
  plan: string;
  estado_pago: string;
  casos: Array<{
    id: string;
    titulo: string;
    area: string;
    etapa: string;
    progreso: string;
    abogado: string;
    prioridad: string;
    descripcion: string;
    fecha_limite: string | null;
    cerrado: boolean;
  }>;
}

const QUICK_REPLIES = [
  { label: "Planes y precios", message: "¿Cuáles son los planes y precios?" },
  { label: "Áreas de cobertura", message: "¿Qué áreas legales cubren?" },
  { label: "Cómo funciona", message: "¿Cómo funciona el servicio?" },
  { label: "Contacto", message: "¿Cómo los contacto?" },
];

const CLIENT_QUICK_REPLIES = [
  { label: "Estado de mis casos", message: "¿Cuál es el estado de mis casos?" },
  { label: "Próximos pasos", message: "¿Cuáles son los próximos pasos de mis casos?" },
  { label: "Hablar con abogado", message: "Necesito hablar con mi abogado" },
  { label: "Mi plan", message: "¿Qué plan tengo y qué incluye?" },
  { label: "🎁 Recomendar amigo", message: "Quiero recomendar a un amigo" },
];

const INITIAL_MESSAGE = `¡Hola! 👋 Soy **Gral. Pantoja**, tu asistente virtual de **Legión Jurídica**.

Estoy aquí para ayudarte con información sobre nuestros servicios legales para militares y policías.

🔐 Si eres **cliente**, puedes identificarte para consultar el estado de tus casos.

¿En qué te puedo ayudar?`;

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-oro underline hover:text-oro-light">$1</a>'
    );
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: processed }} />
      </span>
    );
  });
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    { role: "bot", content: INITIAL_MESSAGE, timestamp: new Date() },
  ]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  const [mounted, setMounted] = useState(false);

  // Referral flow state
  const [referralStep, setReferralStep] = useState<"idle" | "name" | "phone" | "email">("idle");
  const [referralData, setReferralData] = useState({ name: "", phone: "", email: "" });
  const addReferral = useReferralStore((s) => s.addReferral);
  const allKnowledgeItems = useKnowledgeStore((s) => s.items);
  const knowledgeItems = mounted ? allKnowledgeItems.filter((i) => i.activo) : [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, isTyping, showAuthForm, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
      }
    }
  }, [isOpen]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/chat-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim(), clave }),
      });

      if (res.status === 401) {
        setAuthError("Contrasena incorrecta.");
        setAuthLoading(false);
        return;
      }
      if (!res.ok) {
        setAuthError("Cedula no encontrada. Verifica el numero.");
        setAuthLoading(false);
        return;
      }

      const data: ClientContext = await res.json();
      setClientContext(data);
      setShowAuthForm(false);
      setCedula("");
      setClave("");

      const casosCount = data.casos.length;
      const casosActivos = data.casos.filter((c) => !c.cerrado).length;

      const welcomeMsg = `✅ **¡Bienvenido, ${data.nombre}!**

Estás identificado como cliente del **Plan ${data.plan}**.

📋 Tienes **${casosCount} caso${casosCount !== 1 ? "s" : ""}** registrado${casosCount !== 1 ? "s" : ""} (${casosActivos} activo${casosActivos !== 1 ? "s" : ""}).

Puedes preguntarme sobre el estado de tus casos, próximos pasos, o cualquier duda sobre tu plan.

**¿Qué te gustaría saber?**`;

      setDisplayMessages((prev) => [
        ...prev,
        { role: "bot", content: welcomeMsg, timestamp: new Date() },
      ]);
      setChatHistory([]);
    } catch {
      setAuthError("Error de conexion. Intenta de nuevo.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setClientContext(null);
    setChatHistory([]);
    setDisplayMessages((prev) => [
      ...prev,
      { role: "bot", content: "👋 Sesión cerrada. Puedes seguir consultando información general o identificarte de nuevo.", timestamp: new Date() },
    ]);
  };

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    // Detect login intent
    if (!clientContext && (
      msg.toLowerCase().includes("identificar") ||
      msg.toLowerCase().includes("mi caso") ||
      msg.toLowerCase().includes("mis caso") ||
      msg.toLowerCase().includes("mi proceso") ||
      msg.toLowerCase().includes("mis proceso") ||
      msg.toLowerCase().includes("cedula") ||
      msg.toLowerCase().includes("cédula") ||
      msg.toLowerCase().includes("ingresar") ||
      msg.toLowerCase().includes("login") ||
      msg.toLowerCase().includes("acceder")
    )) {
      setDisplayMessages((prev) => [
        ...prev,
        { role: "user", content: msg, timestamp: new Date() },
        { role: "bot", content: "🔐 Para consultar tus casos, necesito verificar tu identidad. Ingresa tus datos abajo:", timestamp: new Date() },
      ]);
      setInput("");
      setShowAuthForm(true);
      return;
    }

    // Detect referral intent
    const isReferralIntent = (
      msg.toLowerCase().includes("recomendar") ||
      msg.toLowerCase().includes("referir") ||
      msg.toLowerCase().includes("referido") ||
      msg.toLowerCase().includes("recomendacion") ||
      msg.toLowerCase().includes("recomendación") ||
      msg.toLowerCase().includes("invitar") ||
      msg.toLowerCase().includes("ganar") ||
      msg.toLowerCase().includes("mes gratis")
    );

    if (isReferralIntent && !clientContext) {
      setDisplayMessages((prev) => [
        ...prev,
        { role: "user", content: msg, timestamp: new Date() },
        { role: "bot", content: "🎁 ¡Genial que quieras recomendar a alguien! Pero primero necesito verificar tu identidad.\n\n🔐 **Ingresa tu cédula y contraseña** abajo para continuar:", timestamp: new Date() },
      ]);
      setInput("");
      setShowAuthForm(true);
      return;
    }

    if (isReferralIntent && clientContext && referralStep === "idle") {
      setDisplayMessages((prev) => [
        ...prev,
        { role: "user", content: msg, timestamp: new Date() },
        { role: "bot", content: "🎁 **¡Programa de recomendaciones!**\n\nPor cada amigo que se afilie, te regalamos **$50.000** (un mes gratis).\n\n¿Cuál es el **nombre completo** de la persona que quieres recomendar?", timestamp: new Date() },
      ]);
      setInput("");
      setReferralStep("name");
      return;
    }

    // Handle referral flow steps
    if (referralStep !== "idle") {
      if (referralStep === "name") {
        setReferralData((d) => ({ ...d, name: msg }));
        setDisplayMessages((prev) => [
          ...prev,
          { role: "user", content: msg, timestamp: new Date() },
          { role: "bot", content: `👍 **${msg}**. Ahora dime su **número de teléfono** (celular).`, timestamp: new Date() },
        ]);
        setInput("");
        setReferralStep("phone");
        return;
      }
      if (referralStep === "phone") {
        const phone = msg.replace(/\D/g, "");
        setReferralData((d) => ({ ...d, phone }));
        setDisplayMessages((prev) => [
          ...prev,
          { role: "user", content: msg, timestamp: new Date() },
          { role: "bot", content: `📱 **${phone}**. Por último, su **correo electrónico** (o escribe "no tiene").`, timestamp: new Date() },
        ]);
        setInput("");
        setReferralStep("email");
        return;
      }
      if (referralStep === "email") {
        const email = msg.toLowerCase().includes("no tiene") ? "Sin email" : msg.trim();
        const finalData = { ...referralData, email };

        const referral = addReferral({
          referrer_name: clientContext!.nombre,
          referrer_cedula: clientContext!.casos[0]?.id || "",
          referrer_suscriptor_id: "",
          referred_name: finalData.name,
          referred_phone: finalData.phone,
          referred_email: finalData.email,
        });

        const link = `${window.location.origin}?ref=${referral.code}`;

        setDisplayMessages((prev) => [
          ...prev,
          { role: "user", content: msg, timestamp: new Date() },
          { role: "bot", content: `✅ **¡Recomendación registrada!**\n\n👤 **${finalData.name}**\n📱 ${finalData.phone}\n📧 ${finalData.email}\n\n🔗 Este es el link para tu amigo:\n[${link}](${link})\n\nCuando tu amigo se afilie, te acreditamos **$50.000** como recompensa. ¡Compártele el link!\n\n**¿Quieres recomendar a alguien más?**`, timestamp: new Date() },
        ]);
        setInput("");
        setReferralStep("idle");
        setReferralData({ name: "", phone: "", email: "" });
        return;
      }
    }

    setDisplayMessages((prev) => [
      ...prev,
      { role: "user", content: msg, timestamp: new Date() },
    ]);
    setInput("");
    setIsTyping(true);

    const newHistory: Message[] = [...chatHistory, { role: "user", content: msg }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory,
          clientContext: clientContext || undefined,
          knowledge: knowledgeItems.map((k) => ({ pregunta: k.pregunta, respuesta: k.respuesta, categoria: k.categoria })),
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const botResponse = data.content;

      setChatHistory([...newHistory, { role: "assistant", content: botResponse }]);
      setDisplayMessages((prev) => [
        ...prev,
        { role: "bot", content: botResponse, timestamp: new Date() },
      ]);
    } catch {
      setDisplayMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Lo siento, hubo un error. Puedes contactarnos directamente por [WhatsApp](https://wa.me/573176689580).",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, chatHistory, clientContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = clientContext ? CLIENT_QUICK_REPLIES : QUICK_REPLIES;
  const showQuickReplies = displayMessages.length <= 2 && !isTyping && !showAuthForm;

  return (
    <>
      {/* Chat Window — fullscreen on mobile, floating on desktop */}
      <div
        className={`fixed z-50 bg-jungle-dark flex flex-col overflow-hidden transition-all duration-300
          ${isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }
          inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:border-oro/20 sm:shadow-2xl sm:shadow-black/40
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-jungle to-jungle-dark px-4 py-3 flex items-center gap-3 border-b border-oro/10 flex-shrink-0">
          <div className="relative">
            <div className="w-10 h-10 bg-oro/20 rounded-full flex items-center justify-center">
              <Image src="/images/logo.svg" alt="Legion" width={24} height={24} className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-jungle-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">Gral. Pantoja</h3>
            {clientContext ? (
              <p className="text-oro text-xs truncate">🔓 {clientContext.nombre}</p>
            ) : (
              <p className="text-green-400 text-xs">En línea • Asistente IA</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!clientContext ? (
              <button
                onClick={() => {
                  setShowAuthForm(true);
                  setDisplayMessages((prev) => [
                    ...prev,
                    { role: "bot", content: "🔐 Para consultar tus casos, ingresa tus datos abajo:", timestamp: new Date() },
                  ]);
                }}
                className="text-beige/40 hover:text-oro transition-colors p-1.5"
                aria-label="Identificarse"
                title="Identificarse como cliente"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="text-beige/40 hover:text-red-400 transition-colors p-1.5"
                aria-label="Cerrar sesion"
                title="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-beige/50 hover:text-white transition-colors p-1"
              aria-label="Cerrar chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
          {displayMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-oro/90 text-jungle-dark rounded-br-md"
                    : "bg-white/10 text-beige rounded-bl-md"
                }`}
              >
                {msg.role === "bot" ? renderMarkdown(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-beige/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-beige/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-beige/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Auth Form inline */}
          {showAuthForm && !clientContext && (
            <div className="flex justify-start">
              <form onSubmit={handleAuth} className="bg-white/10 rounded-2xl rounded-bl-md p-3.5 space-y-2.5 w-[85%]">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Numero de cedula"
                  value={cedula}
                  onChange={(e) => { setCedula(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                  className="w-full bg-white/10 text-white placeholder-beige/40 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                  required
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Contrasena"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-beige/40 text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                  required
                />
                {authError && <p className="text-red-400 text-xs">{authError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={authLoading || !cedula.trim() || !clave}
                    className="flex-1 bg-oro text-jungle-dark text-xs font-semibold py-2 rounded-lg disabled:opacity-40 hover:bg-oro-light transition-colors"
                  >
                    {authLoading ? "Verificando..." : "Ingresar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAuthForm(false); setCedula(""); setClave(""); setAuthError(""); }}
                    className="px-3 text-beige/40 text-xs hover:text-beige/60 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick replies */}
          {showQuickReplies && (
            <div className="flex flex-wrap gap-2 pt-1">
              {quickReplies.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleSend(qr.message)}
                  className="text-xs bg-oro/10 text-oro border border-oro/30 px-3 py-1.5 rounded-full hover:bg-oro/20 transition-colors"
                >
                  {qr.label}
                </button>
              ))}
              {!clientContext && (
                <button
                  onClick={() => {
                    setShowAuthForm(true);
                    setDisplayMessages((prev) => [
                      ...prev,
                      { role: "bot", content: "🔐 Para consultar tus casos, ingresa tus datos abajo:", timestamp: new Date() },
                    ]);
                  }}
                  className="text-xs bg-white/5 text-beige/60 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  🔐 Soy cliente
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 px-3 py-2.5 flex gap-2 bg-jungle-dark/80 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={clientContext ? "Pregunta sobre tus casos..." : "Escribe tu pregunta..."}
            className="flex-1 bg-white/10 text-white placeholder-beige/40 text-sm px-4 py-2.5 rounded-full border border-white/10 focus:border-oro/40 focus:outline-none transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="bg-oro text-jungle-dark p-2.5 rounded-full disabled:opacity-30 hover:bg-oro-light transition-colors flex-shrink-0"
            aria-label="Enviar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-1.5 text-[10px] text-beige/30 bg-jungle-dark border-t border-white/5 flex-shrink-0 pb-safe">
          {clientContext ? `🔓 Sesion activa • ${clientContext.nombre}` : "Potenciado por IA • Para casos específicos contacta un abogado"}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-20 sm:right-24 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 sm:hover:scale-110 safe-bottom ${
          isOpen
            ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto bg-red-500/90 hover:bg-red-600 rotate-0"
            : "bg-gradient-to-br from-jungle to-jungle-dark border-2 border-oro/40 hover:border-oro"
        }`}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-oro" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-jungle-dark flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </span>
          </>
        )}
      </button>
    </>
  );
}
