import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ComisionTipo = "fijo" | "porcentaje";
export type PagoFrecuencia = "quincenal" | "mensual";

export interface VendedorConfig {
  // Comisiones
  comision_tipo: ComisionTipo;
  comision_fija: number;          // COP, used when tipo = "fijo"
  comision_porcentaje: number;    // %, used when tipo = "porcentaje"

  // Bonificación por meta
  bonificacion_activa: boolean;
  bonificacion_meta: number;      // cierres necesarios
  bonificacion_monto: number;     // COP extra al cumplir meta

  // Meta mensual
  meta_mensual: number;           // cierres esperados por vendedor

  // Reglas
  dias_para_cerrar: number;       // días máx desde lead hasta cierre
  requiere_suscriptor_activo: boolean;
  pago_frecuencia: PagoFrecuencia;

  // Links
  url_base: string;
  mensaje_whatsapp: string;
}

const DEFAULT_CONFIG: VendedorConfig = {
  comision_tipo: "fijo",
  comision_fija: 50000,
  comision_porcentaje: 15,
  bonificacion_activa: false,
  bonificacion_meta: 10,
  bonificacion_monto: 100000,
  meta_mensual: 10,
  dias_para_cerrar: 30,
  requiere_suscriptor_activo: true,
  pago_frecuencia: "mensual",
  url_base: "https://www.legionjuridica.com",
  mensaje_whatsapp: "Conoce Legión Jurídica, asesoría legal ilimitada para Fuerzas Militares y Policía desde $50.000/mes. Regístrate aquí:",
};

interface VendedorConfigStore {
  config: VendedorConfig;
  updateConfig: (updates: Partial<VendedorConfig>) => void;
  resetConfig: () => void;
}

export const useVendedorConfigStore = create<VendedorConfigStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      updateConfig: (updates) =>
        set((s) => ({ config: { ...s.config, ...updates } })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: "legion-vendedor-config",
      version: 1,
    }
  )
);
