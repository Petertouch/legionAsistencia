import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseArea } from "../pipelines";

type ViewMode = "todos" | "kanban" | "tabla";

interface CasosStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedArea: CaseArea;
  setSelectedArea: (area: CaseArea) => void;
}

export const useCasosStore = create<CasosStore>()(
  persist(
    (set) => ({
      viewMode: "todos",
      setViewMode: (viewMode) => set({ viewMode }),
      selectedArea: "Disciplinario",
      setSelectedArea: (selectedArea) => set({ selectedArea }),
    }),
    {
      name: "legion-casos",
      version: 2,
      // Reinicia la vista a "Todos" (lista de todos los casos) como vista inicial.
      migrate: (persisted) => {
        const s = (persisted || {}) as Partial<CasosStore>;
        return { viewMode: "todos", selectedArea: s.selectedArea || "Disciplinario" } as CasosStore;
      },
    }
  )
);
