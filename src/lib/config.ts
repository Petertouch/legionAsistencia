import { createClient } from "@/lib/supabase/client";

let cachedComision: number | null = null;

export async function getComisionLanza(): Promise<number> {
  if (cachedComision !== null) return cachedComision;
  const supabase = createClient();
  const { data } = await supabase
    .from("config")
    .select("value")
    .eq("key", "comision_lanza")
    .single();
  cachedComision = data ? parseInt(data.value, 10) : 50000;
  return cachedComision;
}

export function invalidateComisionCache() {
  cachedComision = null;
}

export async function setComisionLanza(value: number): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("config")
    .upsert({ key: "comision_lanza", value: String(value), updated_at: new Date().toISOString() });
  if (!error) cachedComision = value;
  return !error;
}
