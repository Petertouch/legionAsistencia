"use client";

import type { ScriptBlock } from "@/lib/stores/courses-store";
import type { SlideImage } from "@/lib/pdf-to-slides";
import { User, ArrowLeft, Clapperboard, Clock } from "lucide-react";
import Button from "@/components/ui/button";

interface ScriptPreviewProps {
  lessonTitle: string;
  blocks: ScriptBlock[];
  slides: SlideImage[];
  onBack: () => void;
  onApprove: () => void;
}

export default function ScriptPreview({
  lessonTitle,
  blocks,
  slides,
  onBack,
  onApprove,
}: ScriptPreviewProps) {
  const blocksWithText = blocks.filter((b) => b.text.trim());
  const totalWords = blocksWithText.reduce((s, b) => s + b.text.trim().split(/\s+/).length, 0);
  const totalSeconds = Math.ceil(totalWords / 150 * 60);
  const totalMin = Math.floor(totalSeconds / 60);
  const totalSec = totalSeconds % 60;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Previsualizar guion</span>
        </div>
        <h2 className="text-white text-lg font-bold">{lessonTitle}</h2>
        <p className="text-beige/40 text-sm mt-1">
          {blocksWithText.length} {blocksWithText.length === 1 ? "escena" : "escenas"} · {totalWords} palabras · ~{totalMin > 0 ? `${totalMin} min ` : ""}{totalSec}s de video
        </p>
      </div>

      {/* Scenes */}
      {blocksWithText.map((block, idx) => {
        const wordCount = block.text.trim().split(/\s+/).length;
        const seconds = Math.ceil(wordCount / 150 * 60);
        const assignedSlide = block.slide_number && slides.length >= block.slide_number
          ? slides[block.slide_number - 1]
          : null;

        return (
          <div key={block.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Scene header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <span className="text-beige/50 text-xs font-semibold uppercase tracking-wider">
                Escena {idx + 1} de {blocksWithText.length}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                assignedSlide
                  ? "bg-purple-500/15 text-purple-400"
                  : "bg-white/5 text-beige/30"
              }`}>
                {assignedSlide ? `Diapositiva ${block.slide_number}` : "Avatar solo"}
              </span>
            </div>

            {/* Slide preview (large) */}
            <div className="px-5 pt-4">
              {assignedSlide ? (
                <div className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
                  <img
                    src={assignedSlide.dataUrl}
                    alt={`Diapositiva ${block.slide_number}`}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-white/5 bg-[#0F1923] flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-12 h-12 text-beige/15" />
                    <span className="text-beige/20 text-sm">Avatar solo — fondo oscuro</span>
                  </div>
                </div>
              )}
            </div>

            {/* Script text (large, readable) */}
            <div className="px-5 py-4">
              <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                {block.text}
              </p>
            </div>

            {/* Scene footer */}
            <div className="px-5 py-2.5 border-t border-white/5 flex items-center justify-between">
              <span className="text-beige/25 text-xs">{wordCount} palabras</span>
              <span className="text-beige/25 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{seconds}s
              </span>
            </div>
          </div>
        );
      })}

      {/* Total time + action buttons */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        {/* Total time summary */}
        <div className="flex items-center justify-center gap-3 py-2">
          <Clock className="w-5 h-5 text-oro" />
          <div className="text-center">
            <p className="text-white text-xl font-bold">
              {totalMin > 0 ? `${totalMin} min ` : ""}{totalSec}s
            </p>
            <p className="text-beige/40 text-xs">
              Duración estimada del video · {blocksWithText.length} escenas · {totalWords} palabras
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-beige/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a editar
          </button>
          <Button onClick={onApprove} className="bg-purple-600 hover:bg-purple-700 border-purple-500">
            <Clapperboard className="w-4 h-4" /> Aprobar y generar video
          </Button>
        </div>
      </div>
    </div>
  );
}
