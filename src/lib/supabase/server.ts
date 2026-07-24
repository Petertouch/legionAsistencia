import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}

// Variante para el middleware: no puede usar `next/headers cookies()`.
// Lee cookies del NextRequest y acumula las que Supabase quiera refrescar,
// para aplicarlas luego sobre la NextResponse final (via applyCookies).
export function createMiddlewareClient(request: NextRequest) {
  const pending: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            pending.push({ name, value, options });
          }
        },
      },
    }
  );

  // Copia las cookies `sb-*` refrescadas sobre la respuesta que devuelve el middleware.
  const applyCookies = <T extends NextResponse>(response: T): T => {
    for (const { name, value, options } of pending) {
      response.cookies.set(name, value, options);
    }
    return response;
  };

  return { supabase, applyCookies };
}
