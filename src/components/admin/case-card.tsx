"use client";

import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { Caso } from "@/lib/mock-data";
import type { PipelineStage } from "@/lib/pipelines";
import { getStaleLevel, getDaysInStage, getDaysUntilDeadline } from "@/lib/pipelines";
import { ChevronRight, Clock, CalendarClock } from "lucide-react";

const STALE_COLORS = {
  fresh: "text-green-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
};

export default function CaseCard({
  caso,
  stage,
  onAdvance,
  draggable = true,
  onDragStart,
}: {
  caso: Caso;
  stage: PipelineStage;
  onAdvance?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
}) {
  const daysInStage = getDaysInStage(caso.fecha_ingreso_etapa);
  const staleLevel = getStaleLevel(caso.fecha_ingreso_etapa, stage.expectedDays);
  const deadlineDays = getDaysUntilDeadline(caso.fecha_limite);

  const checklistTotal = stage.checklist.length;
  const checklistDone = stage.checklist.filter((item) => caso.checklist[item.key]).length;
  const requiredDone = stage.checklist.filter((item) => item.required && caso.checklist[item.key]).length;
  const requiredTotal = stage.checklist.filter((item) => item.required).length;
  const canAdvance = requiredDone === requiredTotal && caso.etapa !== "Cerrado";

  return (
    <div
      draggable={draggable && caso.etapa !== "Cerrado"}
      onDragStart={(e) => onDragStart?.(e, caso.id)}
      className="bg-jungle-dark border border-white/10 rounded-xl p-3.5 hover:border-oro/30 transition-all cursor-grab active:cursor-grabbing group"
    >
      {/* Top row: priority + days + advance */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge size="xs">{caso.prioridad}</Badge>
          <span className={`flex items-center gap-1 text-[11px] ${STALE_COLORS[staleLevel]}`}>
            <Clock className="w-3 h-3" />
            {daysInStage}d
          </span>
        </div>
        {onAdvance && caso.etapa !== "Cerrado" && (
          <button
            onClick={(e) => { e.stopPropagation(); if (canAdvance) onAdvance(caso.id); }}
            disabled={!canAdvance}
            title={canAdvance ? "Avanzar etapa" : `Completa ${requiredTotal - requiredDone} tareas requeridas`}
            className="p-1 rounded-md bg-white/5 text-beige/40 hover:bg-oro/20 hover:text-oro disabled:opacity-30 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Title + client */}
      <Link href={`/admin/casos/${caso.id}`} className="block">
        <p className="text-white text-sm font-medium leading-snug truncate hover:text-oro transition-colors">
          {caso.titulo}
        </p>
        <p className="text-beige/40 text-xs mt-0.5 truncate">{caso.suscriptor_nombre}</p>
      </Link>

      {/* Bottom row: lawyer + deadline + checklist */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
        <span className="text-beige/30 text-[11px] truncate">{caso.abogado}</span>
        <div className="flex items-center gap-2">
          {deadlineDays !== null && (
            <span className={`flex items-center gap-0.5 text-[11px] ${deadlineDays <= 3 ? "text-red-400" : deadlineDays <= 7 ? "text-yellow-400" : "text-beige/40"}`}>
              <CalendarClock className="w-3 h-3" />
              {deadlineDays}d
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="text-[11px] text-beige/30">
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>
      </div>

      {/* Checklist progress bar */}
      {checklistTotal > 0 && (
        <div className="mt-1.5 w-full bg-white/5 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all ${checklistDone === checklistTotal ? "bg-green-500" : "bg-oro"}`}
            style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
