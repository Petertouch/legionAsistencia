"use client";

import React, { useRef } from "react";
import { Bold, Heading1, Heading2, Send, Paperclip, Loader2 } from "lucide-react";

// ── Render seguro de formato (markdown-lite) ─────────────────────
// Soporta: **negrilla**, "# Título" (grande), "## Subtítulo" (mediano) y
// saltos de línea. Se construyen elementos React (nunca innerHTML), así que
// no hay riesgo de inyección de HTML.
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{p}</React.Fragment>;
  });
}

export function renderRich(text: string): React.ReactNode {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;
    if (line.startsWith("## ")) return <p key={i} className="text-sm font-bold leading-snug mt-0.5">{renderInline(line.slice(3), String(i))}</p>;
    if (line.startsWith("# ")) return <p key={i} className="text-base font-bold leading-snug mt-0.5">{renderInline(line.slice(2), String(i))}</p>;
    return <p key={i} className="text-[13px] leading-relaxed break-words">{renderInline(line, String(i))}</p>;
  });
}

// ── Editor con barra de formato ──────────────────────────────────
export default function ChatComposer({
  value, onChange, onSend, disabled, uploading, onAttach, placeholder = "Escribe un mensaje...",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  uploading?: boolean;
  onAttach?: () => void;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const grow = (ta: HTMLTextAreaElement) => { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; };

  const wrap = (before: string, after: string) => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = value.slice(s, e) || "texto";
    onChange(value.slice(0, s) + before + sel + after + value.slice(e));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); grow(ta); });
  };

  const prefixLine = (prefix: string) => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + prefix.length, s + prefix.length); grow(ta); });
  };

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend();
    const ta = taRef.current; if (ta) ta.style.height = "auto";
  };

  const btn = "p-1.5 rounded-md text-gray-400 hover:text-jungle-dark hover:bg-gray-100 transition-colors";

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Barra de formato */}
      <div className="flex items-center gap-0.5 px-2.5 pt-1.5">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap("**", "**")} className={btn} title="Negrilla"><Bold className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => prefixLine("# ")} className={btn} title="Título"><Heading1 className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => prefixLine("## ")} className={btn} title="Subtítulo"><Heading2 className="w-4 h-4" /></button>
        <span className="text-[10px] text-gray-300 ml-1 hidden sm:inline">Enter envía · Shift+Enter salto de línea</span>
      </div>

      {/* Textarea + acciones */}
      <div className="flex items-end gap-2 px-3 pb-2.5 pt-1">
        {onAttach && (
          <button type="button" onClick={onAttach} disabled={uploading} title="Adjuntar PDF, Word o Excel"
            className="text-gray-400 hover:text-jungle-dark p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-40">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
        )}
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => { onChange(e.target.value); grow(e.target); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          className="flex-1 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm px-4 py-2 rounded-2xl border border-gray-200 focus:border-jungle-dark/40 focus:outline-none resize-none leading-relaxed"
        />
        <button type="button" onClick={submit} disabled={!value.trim() || disabled} className="bg-jungle-dark text-white p-2.5 rounded-full disabled:opacity-30 hover:bg-jungle transition-colors flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
