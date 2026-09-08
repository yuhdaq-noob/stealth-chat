import { getCurrentUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .select("id, sender_id, content, media_url, media_type, created_at")
    .order("created_at", { ascending: false })
    .limit(MESSAGE_LIMIT);

  if (error)
    return Response.json(
      { error: "Pesan tidak dapat dimuat." },
      { status: 500 },
    );
  return Response.json({ messages: (data ?? []).reverse() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: "Pesan harus berisi 1-2000 karakter." },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .insert({ sender_id: user.id, content })
    .select("id, sender_id, content, media_url, media_type, created_at")
    .single();

  if (error)
    return Response.json(
      { error: "Pesan tidak dapat dikirim." },
      { status: 500 },
    );
  return Response.json({ message: data }, { status: 201 });
}
