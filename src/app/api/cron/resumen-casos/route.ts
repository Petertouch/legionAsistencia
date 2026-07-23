import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate, normalizePhone, kapsoReady, TPL_RESUMEN } from "@/lib/kapso";

// Ejecutado por Vercel Cron (ver vercel.json) a las 8am/12pm/4pm America/Bogota.
// Modos (configurables por env):
//   RESUMEN_PERSONAL=true      → a cada abogado activo, SOLO sus casos (default on)
//   RESUMEN_ADMIN=true         → resumen global al número ADMIN_WHATSAPP (default on si hay número)
//   RESUMEN_GLOBAL_TODOS=true  → resumen global a TODOS los abogados (default off)

interface CasoRow { area: string; etapa: string; abogado: string | null; abogado_id: string | null }

function buildResumen(casos: CasoRow[]): { total: number; texto: string } {
  const activos = casos.filter((c) => c.etapa !== "Cerrado");
  const byArea: Record<string, Record<string, number>> = {};
  for (const c of activos) {
    const area = c.area || "Sin área";
    byArea[area] ??= {};
    byArea[area][c.etapa] = (byArea[area][c.etapa] || 0) + 1;
  }
  const lines = Object.entries(byArea).map(([area, etapas]) => {
    const total = Object.values(etapas).reduce((a, b) => a + b, 0);
    const detalle = Object.entries(etapas).map(([e, n]) => `${e} ${n}`).join(", ");
    return `${area}: ${total} (${detalle})`;
  });
  // Los parámetros de plantilla de WhatsApp no admiten saltos de línea:
  // unimos el detalle por área en una sola línea con separador " · ".
  return { total: activos.length, texto: lines.join(" · ") || "Sin casos activos" };
}

async function handler(request: NextRequest) {
  // Autorización: Vercel Cron añade `Authorization: Bearer <CRON_SECRET>` si CRON_SECRET está en env.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  if (!kapsoReady()) {
    return NextResponse.json({ error: "Kapso no configurado" }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data: casos } = await supabase.from("casos").select("area, etapa, abogado, abogado_id");
  const { data: abogados } = await supabase
    .from("equipo")
    .select("id, nombre, telefono")
    .eq("role", "abogado")
    .eq("estado", "activo");

  const allCasos = (casos || []) as CasoRow[];
  const fecha = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  const enviar = async (to: string, nombre: string, lista: CasoRow[]) => {
    const { total, texto } = buildResumen(lista);
    if (total === 0) return { ok: false, skipped: true };
    // Plantilla `resumen_casos`: {{1}} fecha · {{2}} nombre · {{3}} total · {{4}} lista
    const r = await sendTemplate(to, TPL_RESUMEN, [fecha, nombre, String(total), texto]);
    return { ...r, skipped: false };
  };

  let enviados = 0, omitidos = 0, fallidos = 0;
  const track = (r: { ok: boolean; skipped?: boolean }) => {
    if (r.skipped) omitidos++; else if (r.ok) enviados++; else fallidos++;
  };

  const personal = process.env.RESUMEN_PERSONAL !== "false"; // default on
  const globalTodos = process.env.RESUMEN_GLOBAL_TODOS === "true"; // default off
  const adminTo = process.env.ADMIN_WHATSAPP;
  const adminOn = process.env.RESUMEN_ADMIN !== "false" && !!adminTo; // default on si hay número

  // 1) Resumen personal a cada abogado (solo sus casos)
  if (personal) {
    for (const ab of abogados || []) {
      const phone = normalizePhone(ab.telefono);
      if (!phone) continue;
      // Match confiable por FK abogado_id (con respaldo al nombre por casos antiguos).
      track(await enviar(phone, ab.nombre, allCasos.filter((c) => c.abogado_id === ab.id || (!c.abogado_id && c.abogado === ab.nombre))));
    }
  }

  // 2) Resumen global a todos los abogados
  if (globalTodos) {
    for (const ab of abogados || []) {
      const phone = normalizePhone(ab.telefono);
      if (!phone) continue;
      track(await enviar(phone, ab.nombre, allCasos));
    }
  }

  // 3) Resumen global al admin
  if (adminOn) {
    track(await enviar(adminTo!, "Admin", allCasos));
  }

  return NextResponse.json({ ok: true, enviados, omitidos, fallidos, hora: fecha });
}

export const GET = handler;
export const POST = handler;
