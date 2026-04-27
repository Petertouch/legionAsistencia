// ─── Backwards-compatibility shim ─────────────────────────────────────────
// This file re-exports everything from the unified referidor-store.
// All new code should import directly from "@/lib/stores/referidor-store".
export {
  useReferidorStore as useLanzaStore,
  useReferidorStore,
  generateReferidorCode as generateAliadoCode,
  type Referidor as Lanza,
  type ReferidorLead as LanzaLead,
  type ReferidorTipo as AliadoTipo,
} from "./referidor-store";

// Legacy hook that wraps the store to provide old property names
import { useReferidorStore } from "./referidor-store";

/**
 * @deprecated Use useReferidorStore instead.
 * This provides the legacy `lanzas` property pointing to `referidores`.
 */
export function useLanzaStoreLegacy() {
  const store = useReferidorStore();
  return {
    ...store,
    lanzas: store.referidores,
    registerLanza: store.createReferidor,
    updateLanza: store.updateReferidor,
    toggleLanzaStatus: store.toggleStatus,
    getLanzaByCode: store.getByCode,
    getLanzaByCedula: store.getByCedula,
    getLanzasByTipo: store.getByTipo,
    getLeadsByLanza: store.getLeadsByReferidor,
  };
}
