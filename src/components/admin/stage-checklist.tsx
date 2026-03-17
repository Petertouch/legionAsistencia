"use client";

import type { Caso } from "@/lib/mock-data";
import type { PipelineStage } from "@/lib/pipelines";
import { CheckCircle2, Circle } from "lucide-react";

export default function StageChecklist({
  caso,
  stage,
  onToggle,
}: {
  caso: Caso;
  stage: PipelineStage;
  onToggle?: (key: string, done: boolean) => void;
}) {
  const done = stage.checklist.filter((item) => caso.checklist[item.key]).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-white text-sm font-bold">Tareas — {stage.name}</h4>
        <span className="text-beige/40 text-xs">{done}/{stage.checklist.length} completadas</span>
      </div>
      <div className="space-y-1.5">
        {stage.checklist.map((item) => {
          const checked = caso.checklist[item.key] ?? false;
          return (
            <button
              key={item.key}
              onClick={() => onToggle?.(item.key, !checked)}
              className={`flex items-start gap-2.5 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                checked ? "bg-green-500/5 hover:bg-green-500/10" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {checked ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-beige/30 mt-0.5 flex-shrink-0" />
              )}
              <span className={`text-sm ${checked ? "text-green-400/80 line-through" : "text-beige/70"}`}>
                {item.label}
                {item.required && !checked && <span className="text-red-400 ml-1">*</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
