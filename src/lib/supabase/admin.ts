import { createClient } from "@supabase/supabase-js";

// Server-only client con service_role key — bypasea RLS
// NUNCA importar desde componentes client ("use client")
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
