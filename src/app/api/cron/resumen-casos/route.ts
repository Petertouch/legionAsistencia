import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate, normalizePhone, kapsoReady, TPL_RESUMEN } from "@/lib/kapso";

// Disparado por GitHub Actions (.github/workflows/resumen-casos.yml) a las
// 8am/12pm/4pm America/Bogota. (Vercel Hobby solo permite crons 1/día.)
// Modos (configurables por env):
//   RESUMEN_PERSONAL=true      → a cada abogado activo, SOLO sus casos (default on)
//   RESUMEN_ADMIN=true         → resumen global al número ADMIN_WHATSAPP (default on si hay número)
//   RESUMEN_GLOBAL_TODOS=true  → resumen global a TODOS los abogados (default off)

interface CasoRow {
  area: string; etapa: string; abogado: string | null; abogado_id: string | null;
  titulo: string; fecha_limite: string | null;
}

function buildResumen(casos: CasoRow[]): { total: number; texto: string } {
  const activos = casos.filter((c) => c.etapa !== "Cerrado");
  const byArea: Record<string, number> = {};
  for (const c of activos) {
    const area = c.area || "Sin área";
    byArea[area] = (byArea[area] || 0) + 1;
  }
  const lines = Object.entries(byArea).map(([area, n]) => `${area}: ${n}`);
  // Los parámetros de plantilla de WhatsApp no admiten saltos de línea:
  // unimos el detalle por área en una sola línea con separador " · ".
  return { total: activos.length, texto: lines.join(" · ") || "Sin casos activos" };
}

// Casos con fecha límite dentro de 2 días o ya vencidos (activos), ordenados por urgencia.
function buildPorVencer(casos: CasoRow[]): { count: number; texto: string } {
  const now = Date.now();
  const cutoff = now + 2 * 24 * 3600 * 1000;
  const urgentes = casos
    .filter((c) => c.etapa !== "Cerrado" && c.fecha_limite && new Date(c.fecha_limite).getTime() <= cutoff)
    .sort((a, b) => new Date(a.fecha_limite!).getTime() - new Date(b.fecha_limite!).getTime());

  const cuando = (iso: string): string => {
    const dias = Math.ceil((new Date(iso).getTime() - now) / (24 * 3600 * 1000));
    if (dias < 0) return "vencido";
    if (dias === 0) return "vence hoy";
    if (dias === 1) return "vence mañana";
    return `vence en ${dias} días`;
  };

  const items = urgentes.map((c) => `${c.titulo} (${cuando(c.fecha_limite!)})`);
  const shown = items.slice(0, 5);
  let texto = shown.join(" · ") || "Ninguno";
  if (items.length > 5) texto += ` · y ${items.length - 5} más`;
  return { count: urgentes.length, texto };
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
  const { data: casos } = await supabase.from("casos").select("area, etapa, abogado, abogado_id, titulo, fecha_limite");
  const { data: abogados } = await supabase
    .from("equipo")
    .select("id, nombre, telefono")
    .eq("role", "abogado")
    .eq("estado", "activo");

  const allCasos = (casos || []) as CasoRow[];
  // Fecha corta para la plantilla ("23 de julio") y sello con hora para la respuesta.
  const fecha = new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long" });
  const sello = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  const enviar = async (to: string, nombre: string, lista: CasoRow[]) => {
    const { total, texto } = buildResumen(lista);
    if (total === 0) return { ok: false, skipped: true };
    const pv = buildPorVencer(lista);
    // Plantilla `resumen_casos` (variables con nombre).
    const r = await sendTemplate(to, TPL_RESUMEN, {
      nombre,
      total: String(total),
      fecha,
      por_area: texto,
      por_vencer_num: String(pv.count),
      por_vencer_lista: pv.texto,
    });
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

  return NextResponse.json({ ok: true, enviados, omitidos, fallidos, hora: sello });
}

export const GET = handler;
export const POST = handler;
