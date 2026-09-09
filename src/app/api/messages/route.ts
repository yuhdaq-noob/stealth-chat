import { getCurrentUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;

function getMessageIds(body: unknown) {
  if (!body || typeof body !== "object" || !("ids" in body)) return [];
  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string").slice(0, 100);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { error: readError } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (readError)
    return Response.json(
      { error: "Status pesan tidak dapat diperbarui." },
      { status: 500 },
    );

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, sender_id, content, media_url, media_type, created_at, read_at",
    )
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
    .select(
      "id, sender_id, content, media_url, media_type, created_at, read_at",
    )
    .single();

  if (error)
    return Response.json(
      { error: "Pesan tidak dapat dikirim." },
      { status: 500 },
    );
  return Response.json({ message: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ids = getMessageIds(await request.json().catch(() => null));
  if (ids.length === 0)
    return Response.json(
      { error: "Pilih pesan yang akan dihapus." },
      { status: 400 },
    );

  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .delete()
    .in("id", ids)
    .eq("sender_id", user.id)
    .select("id");

  if (error)
    return Response.json(
      { error: "Pesan tidak dapat dihapus." },
      { status: 500 },
    );
  return Response.json({
    deletedIds: (data ?? []).map((message) => message.id),
  });
}
