import { createClient } from "@/lib/supabase/client";
import type { AliadoTipo } from "@/lib/stores/lanza-store";

export type ComisionesPorTipo = Record<string, number>;

let cachedComision: number | null = null;
let cachedComisiones: ComisionesPorTipo | null = null;

// Legacy single value (kept for backwards compat)
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
    } catch {
      // fall through
    }
  }

  // Fallback if config not set
  cachedComisiones = { lanza: 100000, esposa: 100000 };
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

export function getComisionForAliado(
  comisiones: ComisionesPorTipo,
  tipo: AliadoTipo,
  comisionPersonalizada: number | null
): number {
  if (comisionPersonalizada !== null && comisionPersonalizada !== undefined) {
    return comisionPersonalizada;
  }
  return comisiones[tipo] ?? comisiones.lanza ?? 100000;
}

export function invalidateComisionCache() {
  cachedComision = null;
  cachedComisiones = null;
}

// Legacy single setter — keeps old admin code working
export async function setComisionLanza(value: number): Promise<boolean> {
  const comisiones = await getComisionesPorTipo();
  return setComisionesPorTipo({ ...comisiones, lanza: value });
}
