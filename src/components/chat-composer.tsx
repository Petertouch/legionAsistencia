"use client";

import React, { useRef } from "react";
import { Bold, Heading1, Heading2, Send, Paperclip, Loader2 } from "lucide-react";

// ── Saneador de HTML del chat ────────────────────────────────────
// Whitelist de etiquetas de formato y se ELIMINAN todos los atributos
// (sin style/on*/href → sin vectores de XSS). Seguro para dangerouslySetInnerHTML.
const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "BR", "DIV", "P", "SPAN", "H1", "H2", "H3", "H4", "UL", "OL", "LI"]);

function escapeText(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

export function sanitizeChatHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return escapeText(html);
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(doc.createTextNode(child.textContent || ""));
      } else {
        for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
        clean(child);
      }
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

export function htmlToText(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}

// Fallback para mensajes antiguos guardados en markdown-lite (**, #, ##).
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>;
    return <React.Fragment key={`${keyBase}-${i}`}>{p}</React.Fragment>;
  });
}
function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;
    if (line.startsWith("## ")) return <p key={i} className="text-sm font-bold leading-snug">{renderInline(line.slice(3), String(i))}</p>;
    if (line.startsWith("# ")) return <p key={i} className="text-base font-bold leading-snug">{renderInline(line.slice(2), String(i))}</p>;
    return <p key={i} className="text-[13px] leading-relaxed break-words">{renderInline(line, String(i))}</p>;
  });
}

// Render de un mensaje: HTML enriquecido (saneado) o markdown-lite (mensajes viejos).
export function renderMessage(content: string): React.ReactNode {
  if (!content) return null;
  if (/<(strong|b|em|i|u|div|p|span|h[1-4]|br|ul|ol|li)\b/i.test(content)) {
    return <div className="chat-rich text-[13px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: sanitizeChatHtml(content) }} />;
  }
  return renderMarkdown(content);
}

// ── Editor WYSIWYG (contentEditable) ─────────────────────────────
export default function ChatComposer({
  onSend, disabled, uploading, onAttach, placeholder = "Escribe un mensaje...",
}: {
  onSend: (html: string) => void;
  disabled?: boolean;
  uploading?: boolean;
  onAttach?: () => void;
  placeholder?: string;
}) {
  const edRef = useRef<HTMLDivElement>(null);

  const cmd = (command: string, value?: string) => {
    edRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const submit = () => {
    const el = edRef.current;
    if (!el || disabled) return;
    const text = (el.textContent || "").trim();
    if (!text) return;
    const html = sanitizeChatHtml(el.innerHTML);
    el.innerHTML = "";
    onSend(html);
  };

  const btn = "p-1.5 rounded-md text-gray-400 hover:text-jungle-dark hover:bg-gray-100 transition-colors";

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Barra de formato */}
      <div className="flex items-center gap-0.5 px-2.5 pt-1.5">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("bold")} className={btn} title="Negrilla"><Bold className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("formatBlock", "H1")} className={btn} title="Título"><Heading1 className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("formatBlock", "H2")} className={btn} title="Subtítulo"><Heading2 className="w-4 h-4" /></button>
        <span className="text-[10px] text-gray-300 ml-1 hidden sm:inline">Enter envía · Shift+Enter salto de línea</span>
      </div>

      {/* Editor + acciones */}
      <div className="flex items-end gap-2 px-3 pb-2.5 pt-1">
        {onAttach && (
          <button type="button" onClick={onAttach} disabled={uploading} title="Adjuntar PDF, Word o Excel"
            className="text-gray-400 hover:text-jungle-dark p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-40">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
        )}
        <div
          ref={edRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          data-placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          className="chat-editor chat-rich flex-1 min-h-[40px] max-h-40 overflow-y-auto bg-gray-50 text-gray-900 text-sm px-4 py-2 rounded-2xl border border-gray-200 focus:border-jungle-dark/40 focus:outline-none leading-relaxed"
        />
        <button type="button" onClick={submit} disabled={disabled} className="bg-jungle-dark text-white p-2.5 rounded-full disabled:opacity-30 hover:bg-jungle transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
