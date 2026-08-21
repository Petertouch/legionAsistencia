import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getComercialSession } from "@/lib/comercial-auth";

type Row = Record<string, unknown>;

function mergeRow(s: Row, c: Row | null): Row {
  const dc = ((c?.datos_completos as Row) || {}) as Row;
  return {
    id: s.id,
    contrato_id: s.contrato_id || (c?.id ?? null),
    nombre: s.nombre ?? "",
    cedula: s.cedula ?? "",
    telefono: s.telefono ?? "",
    telefono2: (c?.telefono2 as string) ?? "",
    email: s.email ?? "",
    estado_civil: (c?.estado_civil as string) ?? "",
    grado: s.rango ?? (c?.grado as string) ?? "",
    fuerza: s.rama ?? (c?.fuerza as string) ?? "",
    unidad: (c?.unidad as string) ?? "",
    direccion: (c?.direccion as string) ?? "",
    ciudad: (c?.ciudad as string) ?? "",
    departamento: (dc.departamento as string) ?? "",
    plan: s.plan ?? "",
    precio: (c?.precio as string) ?? "",
    estado_pago: s.estado_pago ?? "",
    notas: s.notas ?? "",
    beneficiarios: Array.isArray(dc.beneficiarios) ? dc.beneficiarios : [],
    pre_aprobado: dc.pre_aprobado === true,
    pre_aprobado_por: (dc.pre_aprobado_por as string) || "",
    pre_aprobado_at: (dc.pre_aprobado_at as string) || "",
    tiene_pdf: !!dc.pdf_original_path,
    fecha_inicio: s.fecha_inicio ?? "",
    created_at: s.created_at ?? "",
  };
}

// GET: lista de todos los suscriptores + datos de su contrato (para el Excel del portal comercial).
export async function GET(request: NextRequest) {
  if (!(await getComercialSession(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const { data: subs, error } = await supabase
    .from("suscriptores")
    .select("id, contrato_id, nombre, cedula, telefono, email, plan, estado_pago, rama, rango, notas, fecha_inicio, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contratoIds = (subs || []).map((s) => s.contrato_id).filter(Boolean) as string[];
  const contratosById = new Map<string, Row>();
  if (contratoIds.length) {
    const { data: contratos } = await supabase
      .from("contratos")
      .select("id, telefono2, estado_civil, grado, fuerza, unidad, direccion, ciudad, precio, plan, datos_completos")
      .in("id", contratoIds);
    for (const c of contratos || []) contratosById.set(c.id as string, c as Row);
  }

  const rows = (subs || []).map((s) => mergeRow(s as Row, contratosById.get(s.contrato_id as string) || null));
  return NextResponse.json(rows);
}

// PATCH: editar campos y/o pre-aprobar un suscriptor. body: { id, fields?, pre_aprobado? }
export async function PATCH(request: NextRequest) {
  const session = await getComercialSession(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: sus, error: sErr } = await supabase
      .from("suscriptores")
      .select("id, contrato_id, notas")
      .eq("id", id)
      .single();
    if (sErr || !sus) return NextResponse.json({ error: "Suscriptor no encontrado" }, { status: 404 });

    const f = (body.fields || {}) as Row;
    const hasFields = body.fields && Object.keys(f).length > 0;
    const wantsPre = typeof body.pre_aprobado === "boolean";

    // ── 1) Editar campos del suscriptor ──
    if (hasFields) {
      const susUpd: Row = { updated_at: new Date().toISOString() };
      if (f.nombre !== undefined) susUpd.nombre = String(f.nombre).trim();
      if (f.cedula !== undefined) susUpd.cedula = String(f.cedula).replace(/\D/g, "");
      if (f.telefono !== undefined) susUpd.telefono = String(f.telefono).trim();
      if (f.email !== undefined) susUpd.email = String(f.email).trim().toLowerCase() || null;
      if (f.plan !== undefined) susUpd.plan = String(f.plan).trim();
      if (f.fuerza !== undefined) susUpd.rama = String(f.fuerza).trim();
      if (f.grado !== undefined) susUpd.rango = String(f.grado).trim();
      const { error } = await supabase.from("suscriptores").update(susUpd).eq("id", id);
      if (error) return NextResponse.json({ error: "suscriptor: " + error.message }, { status: 500 });
    }

    // ── 2) Editar contrato + estado de pre-aprobación (viven en el contrato) ──
    if (sus.contrato_id) {
      const { data: contrato } = await supabase
        .from("contratos").select("datos_completos").eq("id", sus.contrato_id).single();
      const dc = ((contrato?.datos_completos as Row) || {}) as Row;

      const conUpd: Row = {};
      if (hasFields) {
        if (f.nombre !== undefined) { conUpd.nombre = String(f.nombre).trim(); conUpd.nombre_cliente = String(f.nombre).trim(); }
        if (f.cedula !== undefined) { conUpd.cedula = String(f.cedula).replace(/\D/g, ""); conUpd.cedula_cliente = String(f.cedula).replace(/\D/g, ""); }
        if (f.telefono !== undefined) conUpd.telefono = String(f.telefono).trim();
        if (f.telefono2 !== undefined) conUpd.telefono2 = String(f.telefono2).trim() || null;
        if (f.email !== undefined) conUpd.email = String(f.email).trim().toLowerCase() || null;
        if (f.estado_civil !== undefined) conUpd.estado_civil = String(f.estado_civil).trim() || null;
        if (f.grado !== undefined) conUpd.grado = String(f.grado).trim() || null;
        if (f.fuerza !== undefined) conUpd.fuerza = String(f.fuerza).trim() || null;
        if (f.unidad !== undefined) conUpd.unidad = String(f.unidad).trim() || null;
        if (f.direccion !== undefined) conUpd.direccion = String(f.direccion).trim() || null;
        if (f.ciudad !== undefined) conUpd.ciudad = String(f.ciudad).trim() || null;
        if (f.plan !== undefined) conUpd.plan = String(f.plan).trim();
        if (f.precio !== undefined) conUpd.precio = String(f.precio).trim();
        if (f.departamento !== undefined) dc.departamento = String(f.departamento).trim();
      }

      // Editar corrige y "vuelve a pre-aprobación" (pre_aprobado = false).
      if (hasFields && !wantsPre) {
        dc.pre_aprobado = false;
      }
      if (wantsPre) {
        dc.pre_aprobado = body.pre_aprobado === true;
        if (dc.pre_aprobado) {
          dc.pre_aprobado_at = new Date().toISOString();
          dc.pre_aprobado_por = (session.email as string) || "comercial";
        }
      }
      conUpd.datos_completos = dc;
      const { error } = await supabase.from("contratos").update(conUpd).eq("id", sus.contrato_id);
      if (error) return NextResponse.json({ error: "contrato: " + error.message }, { status: 500 });
    }

    // Devolver la fila fresca
    const { data: freshSus } = await supabase
      .from("suscriptores")
      .select("id, contrato_id, nombre, cedula, telefono, email, plan, estado_pago, rama, rango, notas, fecha_inicio, created_at")
      .eq("id", id).single();
    let freshCon: Row | null = null;
    if (freshSus?.contrato_id) {
      const { data } = await supabase
        .from("contratos")
        .select("id, telefono2, estado_civil, grado, fuerza, unidad, direccion, ciudad, precio, plan, datos_completos")
        .eq("id", freshSus.contrato_id).single();
      freshCon = (data as Row) || null;
    }
    return NextResponse.json(mergeRow(freshSus as Row, freshCon));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error del servidor" }, { status: 500 });
  }
}
