import { createClient } from "@/lib/supabase/client";
import type { ReferidorTipo } from "@/lib/stores/referidor-store";

// Re-export for backwards compat
export type { ReferidorTipo as AliadoTipo } from "@/lib/stores/referidor-store";

export type ComisionesPorTipo = Record<string, number>;

// ─── Vendedor config (stored in DB config table) ───────────────────────────
export type ComisionTipo = "fijo" | "porcentaje";
export type PagoFrecuencia = "quincenal" | "mensual";

export interface VendedorConfig {
  comision_tipo: ComisionTipo;
  comision_fija: number;
  comision_porcentaje: number;
  bonificacion_activa: boolean;
  bonificacion_meta: number;
  bonificacion_monto: number;
  meta_mensual: number;
  dias_para_cerrar: number;
  requiere_suscriptor_activo: boolean;
  pago_frecuencia: PagoFrecuencia;
  url_base: string;
  mensaje_whatsapp: string;
}

export const DEFAULT_VENDEDOR_CONFIG: VendedorConfig = {
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

let cachedVendedorConfig: VendedorConfig | null = null;

export async function getVendedorConfig(): Promise<VendedorConfig> {
  if (cachedVendedorConfig) return cachedVendedorConfig;
  const supabase = createClient();
  const { data } = await supabase
    .from("config")
    .select("value")
    .eq("key", "vendedor_config")
    .single();
  if (data?.value) {
    try {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      cachedVendedorConfig = { ...DEFAULT_VENDEDOR_CONFIG, ...parsed };
      return cachedVendedorConfig!;
    } catch { /* fall through */ }
  }
  cachedVendedorConfig = DEFAULT_VENDEDOR_CONFIG;
  return cachedVendedorConfig;
}

export async function setVendedorConfig(config: VendedorConfig): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("config")
    .upsert({ key: "vendedor_config", value: JSON.stringify(config), updated_at: new Date().toISOString() });
  if (!error) cachedVendedorConfig = config;
  return !error;
}

export function invalidateVendedorConfigCache() {
  cachedVendedorConfig = null;
}

// ─── Comisiones por tipo (aliados) ─────────────────────────────────────────
let cachedComision: number | null = null;
let cachedComisiones: ComisionesPorTipo | null = null;

export async function getComisionLanza(): Promise<number> {
  if (cachedComision !== null) return cachedComision;
  const comisiones = await getComisionesPorTipo();
  cachedComision = comisiones.lanza ?? 100000;
  return cachedComision;
}

export async function getComisionesPorTipo(): Promise<ComisionesPorTipo> {
  if (cachedComisiones !== null) return cachedComisiones;
  const supabase = createClient();
  const { data } = await supabase
    .from("config")
    .select("value")
    .eq("key", "comisiones_por_tipo")
    .single();

  if (data?.value) {
    try {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      cachedComisiones = parsed as ComisionesPorTipo;
      return cachedComisiones;
    } catch { /* fall through */ }
  }

  cachedComisiones = { lanza: 100000, esposa: 100000, vendedor: 50000 };
  return cachedComisiones;
}

export async function setComisionesPorTipo(comisiones: ComisionesPorTipo): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("config")
    .upsert({
      key: "comisiones_por_tipo",
      value: JSON.stringify(comisiones),
      updated_at: new Date().toISOString(),
    });
  if (!error) {
    cachedComisiones = comisiones;
    cachedComision = comisiones.lanza ?? 100000;
  }
  return !error;
}

export function getComisionForReferidor(
  comisiones: ComisionesPorTipo,
  tipo: ReferidorTipo,
  comisionPersonalizada: number | null
): number {
  if (comisionPersonalizada !== null && comisionPersonalizada !== undefined) {
    return comisionPersonalizada;
  }
  return comisiones[tipo] ?? comisiones.lanza ?? 100000;
}

// Backwards-compat alias
export const getComisionForAliado = getComisionForReferidor;

export function invalidateComisionCache() {
  cachedComision = null;
  cachedComisiones = null;
}

export async function setComisionLanza(value: number): Promise<boolean> {
  const comisiones = await getComisionesPorTipo();
  return setComisionesPorTipo({ ...comisiones, lanza: value });
}
