import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client con service_role key — bypasea RLS
// El import "server-only" garantiza que este archivo NUNCA se incluya en el client bundle
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
