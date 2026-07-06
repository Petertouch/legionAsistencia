/**
 * Backfill de casos.abogado_id a partir del nombre en texto (casos.abogado),
 * mapeando contra equipo.nombre con normalización (sin acentos, sin "Dr./Dra.",
 * por coincidencia de tokens). Es ADITIVO: solo escribe abogado_id, no toca el
 * nombre. Reporta mapeos, ambiguos y sin mapear antes de aplicar.
 *
 * Uso:  node scripts/backfill-abogado-id.mjs           (dry-run: solo reporta)
 *       node scripts/backfill-abogado-id.mjs --apply   (aplica los cambios)
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
fs.readFileSync(".env.local", "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\b(dr|dra)\b\.?/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s) => norm(s).split(" ").filter(Boolean);
const subset = (a, b) => a.length > 0 && a.every((t) => b.includes(t));

const main = async () => {
  const { data: equipo } = await sb.from("equipo").select("id, nombre");
  const { data: casos } = await sb.from("casos").select("id, abogado");

  const nombres = [...new Set(casos.filter((c) => c.abogado && c.abogado.trim()).map((c) => c.abogado))];
  const mapping = {}; // nombre -> equipo.id
  const ambiguos = [];
  const sinMapear = [];

  for (const nombre of nombres) {
    // 1) Coincidencia exacta de nombre normalizado (gana ante ambigüedad de tokens).
    const exact = equipo.filter((m) => norm(m.nombre) === norm(nombre));
    if (exact.length === 1) { mapping[nombre] = exact[0]; continue; }
    // 2) Coincidencia por subconjunto de tokens.
    const tn = tokens(nombre);
    const matches = equipo.filter((m) => {
      const tm = tokens(m.nombre);
      return subset(tn, tm) || subset(tm, tn);
    });
    if (matches.length === 1) mapping[nombre] = matches[0];
    else if (matches.length > 1) ambiguos.push({ nombre, opciones: matches.map((m) => m.nombre) });
    else sinMapear.push(nombre);
  }

  console.log("=== MAPEOS ===");
  for (const [nombre, m] of Object.entries(mapping)) {
    const n = casos.filter((c) => c.abogado === nombre).length;
    console.log(`  "${nombre}"  →  ${m.nombre}  (${n} caso/s)`);
  }
  if (ambiguos.length) { console.log("=== AMBIGUOS (no se aplican) ==="); ambiguos.forEach((a) => console.log(`  "${a.nombre}" → ${a.opciones.join(" | ")}`)); }
  if (sinMapear.length) { console.log("=== SIN MAPEAR ==="); sinMapear.forEach((n) => console.log(`  "${n}"`)); }

  if (!APPLY) { console.log("\n(dry-run) Ejecuta con --apply para escribir abogado_id."); return; }

  let total = 0;
  for (const [nombre, m] of Object.entries(mapping)) {
    const { error, count } = await sb.from("casos").update({ abogado_id: m.id }, { count: "exact" }).eq("abogado", nombre);
    if (error) { console.log(`  ERROR "${nombre}": ${error.message}`); continue; }
    total += count || 0;
  }
  console.log(`\nAPLICADO: ${total} caso(s) actualizados.`);
};

main();
