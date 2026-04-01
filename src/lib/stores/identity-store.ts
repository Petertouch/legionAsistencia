import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ValidationStatus = "pendiente" | "verificado" | "rechazado" | "revision";

export interface IdentityValidation {
  id: string;
  contrato_id: string;
  suscriptor_id: string | null;
  nombre: string;
  cedula: string;
  email: string;

  // Scores
  facial_score: number | null;       // 0-100%
  datos_match: boolean | null;       // nombre/cedula OCR vs digitado
  calidad_selfie: boolean | null;    // cara detectada, no borrosa
  calidad_cedula: boolean | null;    // cara detectada en cédula
  duplicado_cedula: boolean;         // misma cédula ya registrada
  duplicado_cara: boolean;           // misma cara con otra cédula

  // OCR results
  ocr_nombre: string | null;
  ocr_cedula: string | null;

  // Status
  status: ValidationStatus;
  revisado_por: string | null;
  notas: string;

  created_at: string;
  updated_at: string;
}

export interface IdentityConfig {
  umbral_facial: number;           // min % for auto-approve (default 80)
  auto_aprobar: boolean;           // auto-approve if all checks pass
  notificar_rechazo: boolean;      // send email on rejection
}

const DEFAULT_CONFIG: IdentityConfig = {
  umbral_facial: 80,
  auto_aprobar: false,
  notificar_rechazo: true,
};

interface IdentityStore {
  validations: IdentityValidation[];
  config: IdentityConfig;
  loaded: boolean;

  setValidations: (v: IdentityValidation[]) => void;
  addValidation: (v: IdentityValidation) => void;
  updateValidation: (id: string, updates: Partial<IdentityValidation>) => void;
  getByContrato: (contratoId: string) => IdentityValidation | undefined;
  getByCedula: (cedula: string) => IdentityValidation[];
  updateConfig: (updates: Partial<IdentityConfig>) => void;
}

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set, get) => ({
      validations: [],
      config: DEFAULT_CONFIG,
      loaded: false,

      setValidations: (validations) => set({ validations, loaded: true }),

      addValidation: (v) =>
        set((s) => ({ validations: [...s.validations, v] })),

      updateValidation: (id, updates) =>
        set((s) => ({
          validations: s.validations.map((v) =>
            v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v
          ),
        })),

      getByContrato: (contratoId) =>
        get().validations.find((v) => v.contrato_id === contratoId),

      getByCedula: (cedula) =>
        get().validations.filter((v) => v.cedula === cedula),

      updateConfig: (updates) =>
        set((s) => ({ config: { ...s.config, ...updates } })),
    }),
    {
      name: "legion-identity",
      version: 1,
    }
  )
);
