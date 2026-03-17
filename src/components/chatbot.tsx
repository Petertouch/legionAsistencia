"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

// ── Knowledge Base ──────────────────────────────────────────────
const KNOWLEDGE = {
  planes: {
    keywords: ["plan", "precio", "costo", "cuanto", "cuánto", "mensual", "pago", "tarifa", "vale", "cobr"],
    response: `**Nuestros planes mensuales:**

🟢 **Plan Base — $50.000/mes**
• Asesoría jurídica ilimitada (WhatsApp, llamada, app)
• Revisión de documentos (1/mes)
• Derecho de petición incluido

🔵 **Plan Plus — $66.000/mes**
• Todo lo del Plan Base
• 2 revisiones de documentos/mes
• Acompañamiento a audiencias (1/semestre)
• Consulta familiar incluida

🟡 **Plan Élite — $80.000/mes**
• Todo lo del Plan Plus
• Documentos ilimitados
• Acompañamiento a audiencias ilimitado
• Línea prioritaria 24/7
• Cobertura grupo familiar

¿Te gustaría afiliarte a alguno? Puedo conectarte con un asesor.`,
  },

  cobertura: {
    keywords: ["area", "área", "cobertura", "especiali", "derecho", "penal", "disciplin", "famili", "civil", "consum", "document"],
    response: `**Áreas que cubrimos:**

⚖️ **Penal Militar** — Defensa en consejos de guerra, investigaciones penales
🛡️ **Disciplinario** — Procesos disciplinarios, descargos, destituciones
👨‍👩‍👧 **Familia** — Divorcios, custodia, alimentos, sucesiones
📋 **Civil** — Contratos, responsabilidad, cobros
🛒 **Consumidor** — Reclamaciones, garantías, servicios públicos
📄 **Documentos** — Derechos de petición, tutelas, contratos

Todo incluido en tu suscripción mensual. ¿Sobre cuál área necesitas más información?`,
  },

  comoFunciona: {
    keywords: ["como funciona", "cómo funciona", "proceso", "paso", "empez", "inici", "registr", "inscrib", "afili"],
    response: `**Así de fácil funciona:**

1️⃣ **Elige tu plan** — Base, Plus o Élite según tus necesidades
2️⃣ **Te asignamos un abogado** — Especialista en tu caso, disponible de inmediato
3️⃣ **Consulta cuando necesites** — Por WhatsApp, llamada o en la app

Sin citas previas. Sin filas. Sin letra pequeña.

¿Listo para empezar? Te puedo conectar con un asesor ahora mismo.`,
  },

  contacto: {
    keywords: ["contacto", "telefono", "teléfono", "llamar", "dirección", "direccion", "oficina", "donde", "dónde", "ubicac", "whatsapp", "correo", "email"],
    response: `**Información de contacto:**

📞 **Teléfonos:**
• 317 668 9580
• 316 054 1006

📍 **Oficina:**
Cra 7 # 81-49, Oficina 301, Bogotá

📧 **Email:**
info@legionjuridica.com

💬 **WhatsApp:** [Escríbenos directamente](https://wa.me/573176689580)

¿Necesitas que te conecte con un abogado ahora?`,
  },

  descargos: {
    keywords: ["descargo", "citacion", "citación", "investig", "sancion", "sanción", "destitu", "suspend"],
    response: `**¿Proceso disciplinario o descargos?**

Esto es lo que hacemos por ti:

✅ Revisamos tu caso de inmediato
✅ Preparamos tu estrategia de defensa
✅ Redactamos los descargos
✅ Te acompañamos a la audiencia

⚠️ **Importante:** El tiempo es clave en estos procesos. Entre más rápido actuemos, mejor.

¿Quieres que un abogado revise tu caso ahora? Te conecto por WhatsApp.`,
  },

  saludo: {
    keywords: ["hola", "buenos", "buenas", "hey", "hi", "saludos", "que tal", "qué tal"],
    response: `¡Hola! 👋 Soy el asistente virtual de **Legión Jurídica**.

Estoy aquí para ayudarte con información sobre:
• 📋 Nuestros **planes y precios**
• ⚖️ **Áreas de cobertura** legal
• 🔄 **Cómo funciona** el servicio
• 📞 **Contacto** con un abogado

¿En qué te puedo ayudar?`,
  },

  urgente: {
    keywords: ["urgente", "urgencia", "emergen", "ahora", "ya", "rapido", "rápido", "inmediato"],
    response: `**¿Caso urgente?** Entendemos la presión.

📞 **Llama ahora:** 317 668 9580
💬 **WhatsApp:** [Contacto directo](https://wa.me/573176689580?text=Tengo%20un%20caso%20urgente)

Un abogado te atiende en minutos. No estás solo en esto.`,
  },

  gracias: {
    keywords: ["gracia", "thank", "genial", "excelente", "perfecto", "listo"],
    response: `¡Con gusto! 💪 Para eso estamos.

Si necesitas algo más, aquí estaré. Y recuerda: puedes hablar directamente con un abogado por WhatsApp en cualquier momento.

[Hablar con un abogado →](https://wa.me/573176689580)`,
  },
};

const FALLBACK = `No tengo información específica sobre eso, pero un abogado de Legión puede ayudarte.

Puedo informarte sobre:
• 📋 **Planes y precios**
• ⚖️ **Áreas de cobertura**
• 🔄 **Cómo funciona**
• 📞 **Contacto**

O si prefieres, te conecto directamente con un asesor por [WhatsApp](https://wa.me/573176689580).`;

// ── Chat Logic ──────────────────────────────────────────────────
function findResponse(input: string): string {
  const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const topic of Object.values(KNOWLEDGE)) {
    for (const keyword of topic.keywords) {
      const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(normalizedKeyword)) {
        return topic.response;
      }
    }
  }
  return FALLBACK;
}

interface Message {
  role: "bot" | "user";
  content: string;
  timestamp: Date;
}

// ── Quick Reply Buttons ─────────────────────────────────────────
const QUICK_REPLIES = [
  { label: "Planes y precios", message: "¿Cuáles son los planes?" },
  { label: "Áreas de cobertura", message: "¿Qué áreas cubren?" },
  { label: "Cómo funciona", message: "¿Cómo funciona el servicio?" },
  { label: "Contacto", message: "¿Cómo los contacto?" },
];

// ── Markdown-lite renderer ──────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Links
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-oro underline hover:text-oro-light">$1</a>'
    );
    // Emoji bullets (keep as-is, they look good)
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: processed }} />
      </span>
    );
  });
}

// ── Component ───────────────────────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: `¡Hola! 👋 Soy el asistente virtual de **Legión Jurídica**.

Estoy aquí para ayudarte con información sobre nuestros servicios legales para militares y policías.

¿En qué te puedo ayudar?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = useCallback((text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMessage: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = findResponse(msg);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: response, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[70vh] bg-jungle-dark border border-oro/20 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-jungle to-jungle-dark px-4 py-3 flex items-center gap-3 border-b border-oro/10">
          <div className="relative">
            <div className="w-10 h-10 bg-oro/20 rounded-full flex items-center justify-center">
              <Image
                src="/images/logo.svg"
                alt="Legion"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-jungle-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">Legión Jurídica</h3>
            <p className="text-green-400 text-xs">En línea • Respuesta inmediata</p>
          </div>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[50vh] scrollbar-thin">
          {messages.map((msg, i) => (
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

          {/* Quick replies after first message */}
          {messages.length === 1 && !isTyping && (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleSend(qr.message)}
                  className="text-xs bg-oro/10 text-oro border border-oro/30 px-3 py-1.5 rounded-full hover:bg-oro/20 transition-colors"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 px-3 py-2.5 flex gap-2 bg-jungle-dark/80">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/10 text-white placeholder-beige/40 text-sm px-4 py-2.5 rounded-full border border-white/10 focus:border-oro/40 focus:outline-none transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="bg-oro text-jungle-dark p-2.5 rounded-full disabled:opacity-30 hover:bg-oro-light transition-colors flex-shrink-0"
            aria-label="Enviar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-1.5 text-[10px] text-beige/30 bg-jungle-dark border-t border-white/5">
          Asistente virtual • Para casos específicos contacta un abogado
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-20 sm:right-24 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 sm:hover:scale-110 safe-bottom ${
          isOpen
            ? "bg-red-500/90 hover:bg-red-600 rotate-0"
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
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-jungle-dark flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </span>
          </>
        )}
      </button>
    </>
  );
}
