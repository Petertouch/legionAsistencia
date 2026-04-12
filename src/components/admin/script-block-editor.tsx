"use client";

import { useState, useRef, useCallback } from "react";
import type { ScriptBlock } from "@/lib/stores/courses-store";
import type { SlideImage } from "@/lib/pdf-to-slides";
import {
  Plus, Trash2, ChevronUp, ChevronDown, FileUp, X, Image as ImageIcon,
  User, FileText, Loader2,
} from "lucide-react";
import Button from "@/components/ui/button";

const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-4 py-2.5 rounded-lg placeholder-gray-400 focus:outline-none focus:border-oro/40";

interface ScriptBlockEditorProps {
  blocks: ScriptBlock[];
  onChange: (blocks: ScriptBlock[]) => void;
  presentationUrl: string | null;
  onPresentationChange: (url: string | null, file: File | null) => void;
  slides: SlideImage[];
  onExtractSlides: (file: File) => Promise<void>;
  extracting: boolean;
}

function generateBlockId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function ScriptBlockEditor({
  blocks,
  onChange,
  presentationUrl,
  onPresentationChange,
  slides,
  onExtractSlides,
  extracting,
}: ScriptBlockEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverPdf, setDragOverPdf] = useState(false);

  // ── Block CRUD ──
  const addBlock = useCallback(() => {
    const newBlock: ScriptBlock = {
      id: generateBlockId(),
      order: blocks.length,
      text: "",
      slide_number: null,
    };
    onChange([...blocks, newBlock]);
  }, [blocks, onChange]);

  const updateBlock = useCallback(
    (id: string, updates: Partial<ScriptBlock>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    },
    [blocks, onChange]
  );

  const removeBlock = useCallback(
    (id: string) => {
      onChange(
        blocks
          .filter((b) => b.id !== id)
          .map((b, i) => ({ ...b, order: i }))
      );
    },
    [blocks, onChange]
  );

  const moveBlock = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= blocks.length) return;
      const next = [...blocks];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      onChange(next.map((b, i) => ({ ...b, order: i })));
    },
    [blocks, onChange]
  );

  // ── PDF handling ──
  const handlePdfSelect = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") return;
      onPresentationChange(null, file);
      await onExtractSlides(file);
    },
    [onPresentationChange, onExtractSlides]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverPdf(false);
      const file = e.dataTransfer.files[0];
      if (file) handlePdfSelect(file);
    },
    [handlePdfSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handlePdfSelect(file);
      e.target.value = "";
    },
    [handlePdfSelect]
  );

  const removePdf = useCallback(() => {
    onPresentationChange(null, null);
    // Reset slide assignments
    onChange(blocks.map((b) => ({ ...b, slide_number: null })));
  }, [blocks, onChange, onPresentationChange]);

  // ── Stats ──
  const totalWords = blocks.reduce((sum, b) => sum + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0);
  const totalTime = Math.ceil(totalWords / 150); // ~150 words/min speaking rate

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <label className="text-oro text-xs font-semibold flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Guión del profesor
        </label>
        {totalWords > 0 && (
          <span className="text-gray-400 text-[10px]">
            {blocks.length} {blocks.length === 1 ? "bloque" : "bloques"} · {totalWords} palabras · ~{totalTime} min
          </span>
        )}
      </div>

      {/* ── PDF Upload Zone ── */}
      <div
        className={`border border-dashed rounded-lg p-3 transition-colors ${
          dragOverPdf ? "border-oro bg-oro/5" : "border-gray-200 bg-gray-50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOverPdf(true); }}
        onDragLeave={() => setDragOverPdf(false)}
        onDrop={handleFileDrop}
      >
        {extracting ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-4 h-4 text-oro animate-spin" />
            <span className="text-gray-500 text-xs">Extrayendo diapositivas...</span>
          </div>
        ) : slides.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                Presentación · {slides.length} diapositivas
              </span>
              <button onClick={removePdf} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Quitar presentación">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Slide thumbnails strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {slides.map((slide) => (
                <div
                  key={slide.pageNumber}
                  className="flex-shrink-0 relative group/slide"
                  title={`Diapositiva ${slide.pageNumber}`}
                >
                  <img
                    src={slide.dataUrl}
                    alt={`Diap. ${slide.pageNumber}`}
                    className="h-24 w-auto rounded border border-gray-200 object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-gray-900 px-1.5 py-0.5 rounded font-bold">
                    {slide.pageNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2 text-gray-400 hover:text-oro transition-colors"
          >
            <FileUp className="w-4 h-4" />
            <span className="text-xs">Arrastra un PDF o haz clic para subir la presentación</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* ── Blocks ── */}
      <div className="space-y-2">
        {blocks.map((block, idx) => {
          const wordCount = block.text.trim() ? block.text.trim().split(/\s+/).length : 0;
          const assignedSlide = block.slide_number && slides.length >= block.slide_number
            ? slides[block.slide_number - 1]
            : null;

          return (
            <div
              key={block.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2"
            >
              {/* Block header */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                  Bloque {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  {wordCount > 0 && (
                    <span className="text-gray-300 text-[10px] mr-2">
                      {wordCount} pal · ~{Math.ceil(wordCount / 150 * 60)}s
                    </span>
                  )}
                  <button
                    onClick={() => moveBlock(block.id, "up")}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveBlock(block.id, "down")}
                    disabled={idx === blocks.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Block content: text on top, slide below */}
              <div className="space-y-2">
                {/* Textarea */}
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  rows={4}
                  placeholder="Escribe aquí lo que el profesor va a decir en esta escena..."
                  className={`${inputCls} resize-y font-mono text-xs leading-relaxed min-h-[80px]`}
                />

                {/* Slide selector / preview */}
                <div className="space-y-1.5">
                  {slides.length > 0 ? (
                    <>
                      <select
                        value={block.slide_number ?? ""}
                        onChange={(e) =>
                          updateBlock(block.id, {
                            slide_number: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-[10px] px-2 py-1.5 rounded focus:outline-none focus:border-oro/40 appearance-none"
                      >
                        <option value="" className="bg-white">Sin diapositiva</option>
                        {slides.map((s) => (
                          <option key={s.pageNumber} value={s.pageNumber} className="bg-white">
                            Diap. {s.pageNumber}
                          </option>
                        ))}
                      </select>
                      {/* Preview — large */}
                      {assignedSlide ? (
                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black/30">
                          <img
                            src={assignedSlide.dataUrl}
                            alt={`Diap. ${block.slide_number}`}
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video rounded-lg border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2">
                          <User className="w-8 h-8 text-gray-300" />
                          <span className="text-gray-300 text-xs">Avatar solo — sin diapositiva</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full aspect-video rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-beige/15" />
                      <span className="text-beige/15 text-xs text-center px-2">
                        Sube un PDF para asignar diapositivas
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add block button ── */}
      <button
        type="button"
        onClick={addBlock}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-oro hover:border-oro/30 transition-colors text-xs"
      >
        <Plus className="w-3.5 h-3.5" /> Agregar bloque
      </button>

      {/* ── Summary ── */}
      {blocks.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-gray-300 pt-1">
          <span>
            {blocks.length} {blocks.length === 1 ? "escena" : "escenas"} · {totalWords} palabras · ~{totalTime} min de video
          </span>
          <span>
            {blocks.filter((b) => b.slide_number).length} con diapositiva · {blocks.filter((b) => !b.slide_number).length} avatar solo
          </span>
        </div>
      )}

      <p className="text-beige/15 text-[10px]">
        Cada bloque se convierte en una escena del video. Asigna una diapositiva del PDF como fondo o deja sin asignar para que aparezca solo el avatar.
      </p>
    </div>
  );
}
