import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "legion-session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "legion-fallback-secret-change-me-in-prod"
);

// Rutas de API que requieren auth (excluir login/logout/me)
const PROTECTED_API_PREFIXES = ["/api/suscriptores", "/api/mail"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Login: si ya tiene sesión válida, redirigir a admin ──
  if (pathname === "/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const session = await verifyToken(token);
      if (session) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // ── Rutas admin y API protegidas: verificar sesión ──
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAdminRoute || isProtectedApi) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = await verifyToken(token);

    if (!session) {
      // Token inválido o expirado — limpiar cookie
      const response = isProtectedApi
        ? NextResponse.json({ error: "Sesión expirada" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Inyectar info de sesión en headers para que las API routes la lean
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.id);
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-email", session.email);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; role: string; email: string };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/api/suscriptores/:path*", "/api/mail/:path*"],
};
