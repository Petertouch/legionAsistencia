import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type SessionPayload } from "@/lib/auth";

// Crea una sesión cookie para profesores (validados client-side desde team store)
export async function POST(request: NextRequest) {
  try {
    const { id, nombre, email, role } = await request.json();

    if (!id || !nombre || !email || !role) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Solo permitir roles válidos
    if (!["profesor", "abogado"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const session: SessionPayload = { id, nombre, email, role };
    await setSessionCookie(session);

    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
