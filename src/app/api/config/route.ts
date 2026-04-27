import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: read a config value by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("config")
      .select("key, value")
      .eq("key", key)
      .single();

    if (error || !data) return NextResponse.json(null);

    let parsed = data.value;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch { /* keep as string */ }
    }
    return NextResponse.json({ key: data.key, value: parsed });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// POST: upsert a config key/value (admin only)
export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { key, value } = await request.json();
    if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("config")
      .upsert({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
        updated_at: new Date().toISOString(),
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
