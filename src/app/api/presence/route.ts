import { getCurrentUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ONLINE_WINDOW_MS = 45_000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("auth_sessions")
    .select("user_id")
    .neq("user_id", user.id)
    .gt("last_seen_at", cutoff)
    .gt("expires_at", new Date().toISOString())
    .limit(1);

  if (error)
    return Response.json(
      { error: "Presence tidak dapat dimuat." },
      { status: 500 },
    );
  return Response.json({ isPartnerOnline: Boolean(data?.length) });
}
