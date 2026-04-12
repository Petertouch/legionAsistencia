import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Revoke a session by JTI
export async function revokeSession(jti: string, userId: string, expiresAt: Date) {
  const supabase = createAdminClient();
  await supabase.from("revoked_sessions").upsert({
    jti,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  });
}

// Revoke ALL sessions for a user (e.g. on password change)
export async function revokeAllUserSessions(userId: string) {
  // We don't delete old entries — they'll be cleaned up by expiration
  // Instead we mark them all so middleware rejects them
  const supabase = createAdminClient();
  const { data: sessions } = await supabase
    .from("revoked_sessions")
    .select("jti")
    .eq("user_id", userId);

  // Already revoked — nothing else needed since any NEW token
  // won't match old JTIs. The purpose is: if we know the user changed
  // password, we don't need individual JTIs — we just need the middleware
  // to reject. We store a special marker.
  await supabase.from("revoked_sessions").upsert({
    jti: `all-${userId}`,
    user_id: userId,
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  });
}

// Check if a session is revoked
export async function isSessionRevoked(jti: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // Check direct JTI revocation OR bulk revocation marker
  const { data } = await supabase
    .from("revoked_sessions")
    .select("jti")
    .eq("user_id", userId)
    .in("jti", [jti, `all-${userId}`])
    .limit(1);

  return (data && data.length > 0) ?? false;
}

// Cleanup expired revoked sessions (call periodically)
export async function cleanupRevokedSessions() {
  const supabase = createAdminClient();
  await supabase
    .from("revoked_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
