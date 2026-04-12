"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCasosByPipeline, advanceCaso, moveCaso } from "@/lib/db";
import { PIPELINES, type CaseArea } from "@/lib/pipelines";
import CaseCard from "./case-card";
import { toast } from "sonner";

interface KanbanBoardProps {
  area: CaseArea;
  abogadoFilter?: string;
}

export default function KanbanBoard({ area, abogadoFilter }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const pipeline = PIPELINES[area];
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const { data: grouped, isLoading } = useQuery({
    queryKey: ["casos-pipeline", area],
    queryFn: () => getCasosByPipeline(area),
  });

  // Filter by abogado if needed
  const filteredGrouped = useMemo(() => {
    if (!grouped || !abogadoFilter) return grouped;
    const result: Record<string, typeof grouped[string]> = {};
    for (const [stage, cases] of Object.entries(grouped)) {
      result[stage] = cases.filter((c) => c.abogado === abogadoFilter);
    }
    return result;
  }, [grouped, abogadoFilter]);

  const handleAdvance = useCallback(async (id: string) => {
    await advanceCaso(id);
    queryClient.invalidateQueries({ queryKey: ["casos-pipeline", area] });
    toast.success("Caso avanzado a siguiente etapa");
  }, [area, queryClient]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageName);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, stageName: string, stageIndex: number) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    await moveCaso(id, stageName, stageIndex);
    queryClient.invalidateQueries({ queryKey: ["casos-pipeline", area] });
    toast.success(`Caso movido a ${stageName}`);
  }, [area, queryClient]);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {pipeline.stages.map((s) => (
          <div key={s.name} className="min-w-[260px] w-[260px] bg-gray-50 rounded-xl h-48 animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
      {pipeline.stages.map((stage, stageIndex) => {
        const cases = filteredGrouped?.[stage.name] || [];
        const isCerrado = stage.name === "Cerrado";

        return (
          <div
            key={stage.name}
            onDragOver={(e) => handleDragOver(e, stage.name)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.name, stageIndex)}
            className={`min-w-[260px] w-[260px] flex-shrink-0 rounded-xl border transition-colors ${
              dragOverStage === stage.name
                ? "border-oro/40 bg-oro/5"
                : "border-gray-100 bg-gray-50"
            } ${isCerrado ? "opacity-60" : ""}`}
          >
            {/* Column header */}
            <div className="px-3 pt-3 pb-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-gray-900 text-xs font-medium">{stage.name}</span>
              <span className="text-gray-400 text-[10px] bg-gray-50 px-1.5 py-px rounded-full">
                {cases.length}
              </span>
            </div>

            {/* Cards */}
            <div className={`px-2 pb-2 space-y-2 ${isCerrado ? "max-h-40 overflow-y-auto" : "min-h-[100px]"}`}>
              {cases.length === 0 ? (
                <div className="text-gray-300 text-xs text-center py-6">Sin casos</div>
              ) : (
                cases.map((caso) => (
                  <CaseCard
                    key={caso.id}
                    caso={caso}
                    stage={stage}
                    onAdvance={handleAdvance}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
