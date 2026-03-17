import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseArea } from "../pipelines";

interface CasosStore {
  viewMode: "kanban" | "tabla";
  setViewMode: (mode: "kanban" | "tabla") => void;
  selectedArea: CaseArea;
  setSelectedArea: (area: CaseArea) => void;
}

export const useCasosStore = create<CasosStore>()(
  persist(
    (set) => ({
      viewMode: "kanban",
      setViewMode: (viewMode) => set({ viewMode }),
      selectedArea: "Disciplinario",
      setSelectedArea: (selectedArea) => set({ selectedArea }),
    }),
    { name: "legion-casos" }
  )
);
