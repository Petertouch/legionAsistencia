import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "legion-session";
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

// API routes that require auth
const PROTECTED_API_PREFIXES = ["/api/suscriptores", "/api/mail", "/api/upload", "/api/heygen", "/api/documentos", "/api/contratos", "/api/config", "/api/lanzas"];

// Admin page role restrictions (matches sidebar.tsx)
// Routes not listed here are accessible to any authenticated user (e.g. /admin/dashboard)
const ADMIN_ROUTE_ROLES: Record<string, string[]> = {
  "/admin/suscriptores": ["admin"],
  "/admin/contratos": ["admin"],
  "/admin/validacion-identidad": ["admin"],
  "/admin/equipo": ["admin"],
  "/admin/vendedores": ["admin"],
  "/admin/conocimiento": ["admin"],
  "/admin/recomendaciones": ["admin"],
  "/admin/mails": ["admin"],
  "/admin/profesores": ["admin"],
  "/admin/diplomas": ["admin"],
  "/admin/leads": ["admin"],
  "/admin/casos": ["admin", "abogado"],
  "/admin/seguimiento": ["admin", "abogado"],
  "/admin/cursos": ["admin", "profesor"],
  "/admin/mi-panel-vendedor": ["vendedor"],
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip x-user-* headers to prevent spoofing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-role");
  requestHeaders.delete("x-user-email");

  // ── Login: redirect to admin if already authenticated ──
  if (pathname === "/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const session = await verifyToken(token);
      if (session) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Admin routes and protected APIs ──
  const isAdminRoute = pathname.startsWith("/admin");
  const PUBLIC_API_EXCEPTIONS = ["/api/mail/bienvenida", "/api/mail/bienvenida-aliado", "/api/mail/caso", "/api/contratos/pdf", "/api/contratos/pdf-cedula", "/api/contratos/firmar"];
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p)) && !PUBLIC_API_EXCEPTIONS.some((p) => pathname.startsWith(p));

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
      const response = isProtectedApi
        ? NextResponse.json({ error: "Sesión expirada" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // ── Role-based access control for admin pages ──
    if (isAdminRoute) {
      const matchedRoute = Object.entries(ADMIN_ROUTE_ROLES)
        .find(([route]) => pathname.startsWith(route));

      if (matchedRoute) {
        const [, allowedRoles] = matchedRoute;
        if (!allowedRoles.includes(session.role)) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
      }
    }

    // ── Revocation check for API routes ──
    if (isProtectedApi && session.jti) {
      const revoked = await isSessionRevoked(session.jti, session.id);
      if (revoked) {
        const response = NextResponse.json({ error: "Sesión revocada" }, { status: 401 });
        response.cookies.delete(COOKIE_NAME);
        return response;
      }
    }

    requestHeaders.set("x-user-id", session.id);
    requestHeaders.set("x-user-role", session.role);
    requestHeaders.set("x-user-email", session.email);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; role: string; email: string; jti?: string };
  } catch {
    return null;
  }
}

async function isSessionRevoked(jti: string, userId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("revoked_sessions")
      .select("jti")
      .eq("user_id", userId)
      .in("jti", [jti, `all-${userId}`])
      .limit(1);

    return (data && data.length > 0) ?? false;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/api/suscriptores/:path*",
    "/api/mail/:path*",
    "/api/upload/:path*",
    "/api/heygen/:path*",
    "/api/documentos/:path*",
    "/api/contratos/:path*",
    "/api/config/:path*",
    "/api/lanzas/:path*",
  ],
};
