import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PUT: update lead status
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  if (!status) return NextResponse.json({ error: "Status requerido" }, { status: 400 });

  const allowedStatuses = ["nuevo", "contactado", "convertido", "perdido"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("lanza_leads").update({ status }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
