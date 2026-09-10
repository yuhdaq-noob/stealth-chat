import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const SESSION_COOKIE = "stealth_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: string;
  displayName: string;
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_SECONDS * 1000,
  ).toISOString();
  const supabase = getSupabaseAdmin();

  await supabase
    .from("auth_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const { error } = await supabase.from("auth_sessions").insert({
    token_hash: hashSessionToken(token),
    user_id: userId,
    expires_at: expiresAt,
  });
  if (error) throw error;

  return { token, expiresAt };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data: session, error: sessionError } = await getSupabaseAdmin()
    .from("auth_sessions")
    .select("user_id, expires_at")
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (sessionError || !session) return null;

  const { data: user, error: userError } = await getSupabaseAdmin()
    .from("app_users")
    .select("id, display_name")
    .eq("id", session.user_id)
    .maybeSingle();

  if (userError || !user) return null;

  return { id: user.id, displayName: user.display_name };
}

export async function touchCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const { error } = await getSupabaseAdmin()
    .from("auth_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString());

  return !error;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  await getSupabaseAdmin()
    .from("auth_sessions")
    .delete()
    .eq("token_hash", hashSessionToken(token));
}

export { SESSION_DURATION_SECONDS };
