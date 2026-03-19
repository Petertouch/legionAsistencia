"use client";

import { ChevronUp, ChevronDown, Trash2, Plus, GripVertical } from "lucide-react";

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
  const update = (index: number, field: keyof Clausula, value: string) => {
    const updated = [...clausulas];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
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
        <h3 className="text-white font-bold text-sm">{sectionLabel}</h3>
        <span className="text-beige/30 text-xs">{clausulas.length} cláusulas</span>
      </div>

      {clausulas.map((c, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 group hover:border-white/20 transition-colors"
        >
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="p-0.5 text-beige/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <GripVertical className="w-4 h-4 text-beige/15 mx-auto" />
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i >= clausulas.length - 1}
                className="p-0.5 text-beige/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={c.titulo}
                onChange={(e) => update(i, "titulo", e.target.value)}
                className="w-full bg-white/5 text-oro font-bold text-xs px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                placeholder="Título de la cláusula"
              />
              <textarea
                value={c.contenido}
                onChange={(e) => update(i, "contenido", e.target.value)}
                rows={3}
                className="w-full bg-white/5 text-beige/70 text-xs px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none resize-y leading-relaxed"
                placeholder="Contenido de la cláusula..."
              />
            </div>

            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 text-beige/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-white/10 hover:border-oro/30 rounded-xl py-3 flex items-center justify-center gap-2 text-beige/40 hover:text-oro text-xs font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Agregar cláusula
      </button>
    </div>
  );
}