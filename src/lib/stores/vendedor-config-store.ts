// ─── Backwards-compatibility shim ─────────────────────────────────────────
// Vendedor config is now stored in DB via lib/config.ts.
// This file provides a Zustand-like interface for code that still imports it.
// New code should use getVendedorConfig / setVendedorConfig from "@/lib/config".

import { create } from "zustand";
import {
  type VendedorConfig,
  type ComisionTipo,
  type PagoFrecuencia,
  DEFAULT_VENDEDOR_CONFIG,
  getVendedorConfig,
  setVendedorConfig,
} from "@/lib/config";

export type { ComisionTipo, PagoFrecuencia, VendedorConfig };

interface VendedorConfigStore {
  config: VendedorConfig;
  loaded: boolean;
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<VendedorConfig>) => void;
  saveConfig: () => Promise<boolean>;
  resetConfig: () => void;
}

export const useVendedorConfigStore = create<VendedorConfigStore>()((set, get) => ({
  config: DEFAULT_VENDEDOR_CONFIG,
  loaded: false,

  loadConfig: async () => {
    const config = await getVendedorConfig();
    set({ config, loaded: true });
  },

  updateConfig: (updates) =>
    set((s) => ({ config: { ...s.config, ...updates } })),

  saveConfig: async () => {
    const ok = await setVendedorConfig(get().config);
    return ok;
  },

  resetConfig: () => set({ config: DEFAULT_VENDEDOR_CONFIG }),
}));
