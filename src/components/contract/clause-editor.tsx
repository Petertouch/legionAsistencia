"use client";

import { useRef } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, GripVertical, Bold } from "lucide-react";

export interface Clausula {
  titulo: string;
  contenido: string;
}

interface ClauseEditorProps {
  clausulas: Clausula[];
  onChange: (clausulas: Clausula[]) => void;
  sectionLabel: string;
}

export default function ClauseEditor({ clausulas, onChange, sectionLabel }: ClauseEditorProps) {
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const update = (index: number, field: keyof Clausula, value: string) => {
    const updated = [...clausulas];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const wrapBold = (index: number) => {
    const ta = textareaRefs.current[index];
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const selected = ta.value.slice(start, end) || "texto";
    const after = ta.value.slice(end);
    const newValue = `${before}**${selected}**${after}`;
    update(index, "contenido", newValue);
    // Restore selection inside the bold markers
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + 2, start + 2 + selected.length);
    }, 0);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...clausulas];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index: number) => {
    if (index >= clausulas.length - 1) return;
    const updated = [...clausulas];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const remove = (index: number) => {
    onChange(clausulas.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...clausulas, { titulo: "NUEVA CLÁUSULA", contenido: "" }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900 font-bold text-sm">{sectionLabel}</h3>
        <span className="text-gray-400 text-xs">{clausulas.length} cláusulas</span>
      </div>

      {clausulas.map((c, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 group hover:border-gray-300 transition-colors shadow-sm"
        >
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <GripVertical className="w-4 h-4 text-gray-300 mx-auto" />
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i >= clausulas.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={c.titulo}
                onChange={(e) => update(i, "titulo", e.target.value)}
                className="w-full bg-gray-50 text-oro font-bold text-xs px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none"
                placeholder="Título de la cláusula"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => wrapBold(i)}
                  title="Negrilla (selecciona texto y haz click)"
                  className="px-2 py-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <span className="text-gray-400 text-[10px]">
                  Usa <code className="bg-gray-100 px-1 rounded">**texto**</code> para negrilla · Enter para nueva línea
                </span>
              </div>
              <textarea
                ref={(el) => { textareaRefs.current[i] = el; }}
                value={c.contenido}
                onChange={(e) => update(i, "contenido", e.target.value)}
                rows={4}
                className="w-full bg-gray-50 text-gray-700 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:border-oro/50 focus:outline-none resize-y leading-relaxed font-mono"
                placeholder="Contenido de la cláusula..."
              />
            </div>

            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-200 hover:border-oro/40 rounded-xl py-3 flex items-center justify-center gap-2 text-gray-500 hover:text-oro text-xs font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Agregar cláusula
      </button>
    </div>
  );
}
