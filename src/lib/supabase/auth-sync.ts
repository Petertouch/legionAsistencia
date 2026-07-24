import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Mantiene Supabase Auth (auth.users) en sync cuando el admin gestiona el staff
// desde la app. Todo es no-op si AUTH_PROVIDER !== "supabase", para que el modo
// legacy no se vea afectado durante la migración.

const isSupabaseAuth = () => (process.env.AUTH_PROVIDER || "legacy") === "supabase";

// Crea un usuario en Supabase Auth para un miembro del equipo recién creado.
// Devuelve el auth_user_id, o null si no aplica / falla.
export async function createStaffAuthUser(params: {
  email: string;
  password: string;
  role: string;
  profileId: string;
  nombre?: string;
}): Promise<string | null> {
  if (!isSupabaseAuth() || !params.email || !params.password) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email.toLowerCase().trim(),
    password: params.password,
    email_confirm: true,
    app_metadata: { role: params.role, profile_id: params.profileId },
    user_metadata: { nombre: params.nombre || "" },
  });
  if (error || !data.user) {
    console.error("[auth-sync] createUser falló:", error?.message);
    return null;
  }
  return data.user.id;
}

// Actualiza email / password / role / nombre del usuario de Supabase Auth.
export async function updateStaffAuthUser(
  authUserId: string,
  updates: { email?: string; password?: string; role?: string; nombre?: string }
): Promise<boolean> {
  if (!isSupabaseAuth() || !authUserId) return false;
  const admin = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (updates.email) payload.email = updates.email.toLowerCase().trim();
  if (updates.password) payload.password = updates.password;
  if (updates.role) payload.app_metadata = { role: updates.role };
  if (typeof updates.nombre === "string") payload.user_metadata = { nombre: updates.nombre };
  if (Object.keys(payload).length === 0) return true;

  const { error } = await admin.auth.admin.updateUserById(authUserId, payload);
  if (error) {
    console.error("[auth-sync] updateUserById falló:", error.message);
    return false;
  }
  return true;
}

// Elimina el usuario de Supabase Auth (al borrar un miembro del equipo).
export async function deleteStaffAuthUser(authUserId: string): Promise<boolean> {
  if (!isSupabaseAuth() || !authUserId) return false;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  if (error) {
    console.error("[auth-sync] deleteUser falló:", error.message);
    return false;
  }
  return true;
}
