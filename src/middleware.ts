import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import { createMiddlewareClient } from "@/lib/supabase/server";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER || "legacy";
const COOKIE_NAME = "legion-session";
const SECRET = process.env.SESSION_SECRET
  ? new TextEncoder().encode(process.env.SESSION_SECRET)
  : null;

// API routes that require auth
const PROTECTED_API_PREFIXES = ["/api/suscriptores", "/api/mail", "/api/upload", "/api/heygen", "/api/documentos", "/api/contratos", "/api/config", "/api/lanzas", "/api/actividad"];

// Admin page role restrictions (matches sidebar.tsx)
// Routes not listed here are accessible to any authenticated user (e.g. /admin/dashboard)
const ADMIN_ROUTE_ROLES: Record<string, string[]> = {
  "/admin/suscriptores": ["admin"],
  "/admin/contratos": ["admin"],
  "/admin/validacion-identidad": ["admin"],
  "/admin/equipo": ["admin"],
  "/admin/api-docs": ["admin"],
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

interface Session {
  id: string;
  role: string;
  email: string;
  nombre: string;
  jti?: string; // solo legacy
}

function getSupabaseAdmin() {
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
  requestHeaders.delete("x-user-nombre");

  // Cliente Supabase para el middleware (solo en modo supabase); refresca cookies sb-*.
  const sb = AUTH_PROVIDER === "supabase" ? createMiddlewareClient(request) : null;

  const nextResponse = () => {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return sb ? sb.applyCookies(res) : res;
  };
  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    return sb ? sb.applyCookies(res) : res;
  };
  const unauthorized = (msg: string) => {
    const res = NextResponse.json({ error: msg }, { status: 401 });
    return sb ? sb.applyCookies(res) : res;
  };

  // ── Resolver la sesión según el proveedor ──
  async function getSession(): Promise<Session | null> {
    if (AUTH_PROVIDER === "supabase") {
      const { data: { user } } = await sb!.supabase.auth.getUser();
      if (!user) return null;
      const meta = (user.app_metadata || {}) as Record<string, unknown>;
      return {
        id: (meta.profile_id as string) || user.id,
        role: (meta.role as string) || "abogado",
        email: user.email || "",
        nombre: ((user.user_metadata as Record<string, unknown>)?.nombre as string) || "",
      };
    }
    // legacy (JWT propio)
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !SECRET) return null;
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const p = payload as unknown as Session;
      return { id: p.id, role: p.role, email: p.email, nombre: p.nombre || "", jti: p.jti };
    } catch {
      return null;
    }
  }

  // ── Login: redirect to admin if already authenticated ──
  if (pathname === "/login") {
    const session = await getSession();
    if (session) return redirect("/admin/dashboard");
    return nextResponse();
  }

  // ── Admin routes and protected APIs ──
  const isAdminRoute = pathname.startsWith("/admin");
  const PUBLIC_API_EXCEPTIONS = ["/api/mail/bienvenida", "/api/mail/bienvenida-aliado", "/api/mail/caso", "/api/contratos/pdf", "/api/contratos/pdf-cedula", "/api/contratos/firmar"];
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p)) && !PUBLIC_API_EXCEPTIONS.some((p) => pathname.startsWith(p));

  if (isAdminRoute || isProtectedApi) {
    const session = await getSession();

    if (!session) {
      if (isProtectedApi) return unauthorized("No autorizado");
      return redirect("/login");
    }

    // ── Role-based access control for admin pages ──
    if (isAdminRoute) {
      const matchedRoute = Object.entries(ADMIN_ROUTE_ROLES)
        .find(([route]) => pathname.startsWith(route));

      if (matchedRoute) {
        const [, allowedRoles] = matchedRoute;
        if (!allowedRoles.includes(session.role)) {
          return redirect("/admin/dashboard");
        }
      }
    }

    // ── Revocation check for API routes (solo legacy; Supabase maneja validez de sesión) ──
    if (AUTH_PROVIDER !== "supabase" && isProtectedApi && session.jti) {
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
    // Codificado: el nombre puede tener acentos (no válidos en headers HTTP crudos).
    requestHeaders.set("x-user-nombre", encodeURIComponent(session.nombre || ""));

    return nextResponse();
  }

  return nextResponse();
}

async function isSessionRevoked(jti: string, userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
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
    "/api/actividad/:path*",
  ],
};
