import { getCurrentUser } from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { triggerTelegramNotification } from "@/lib/telegram";

const MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MESSAGE_FIELDS =
  "id, sender_id, content, media_url, media_type, created_at, read_at, reply_to_message_id";
const REPLY_FIELDS =
  "id, sender_id, content, media_url, media_type, created_at";

function getMessageIds(body: unknown) {
  if (!body || typeof body !== "object" || !("ids" in body)) return [];
  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string").slice(0, 100);
}

async function addReplyPreviews(
  messages: Array<{
    reply_to_message_id: string | null;
    [key: string]: unknown;
  }>,
) {
  const replyIds = [
    ...new Set(
      messages
        .map((message) => message.reply_to_message_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (replyIds.length === 0)
    return messages.map((message) => ({ ...message, reply_to_message: null }));

  const { data: replyMessages, error } = await getSupabaseAdmin()
    .from("messages")
    .select(REPLY_FIELDS)
    .in("id", replyIds);
  if (error) throw error;

  const repliesById = new Map(
    (replyMessages ?? []).map((message) => [message.id, message]),
  );
  return messages.map((message) => ({
    ...message,
    reply_to_message: message.reply_to_message_id
      ? (repliesById.get(message.reply_to_message_id) ?? null)
      : null,
  }));
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
    .select(MESSAGE_FIELDS)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_LIMIT);

  if (error)
    return Response.json(
      { error: "Pesan tidak dapat dimuat." },
      { status: 500 },
    );
  try {
    const messages = await addReplyPreviews(data ?? []);
    return Response.json({ messages: messages.reverse() });
  } catch {
    return Response.json(
      { error: "Pesan tidak dapat dimuat." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const replyToMessageId =
    typeof body?.replyToMessageId === "string" && body.replyToMessageId
      ? body.replyToMessageId
      : null;
  if (!content || content.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: "Pesan harus berisi 1-2000 karakter." },
      { status: 400 },
    );
  }

  if (replyToMessageId) {
    const { data: replyTarget, error: replyTargetError } =
      await getSupabaseAdmin()
        .from("messages")
        .select("id")
        .eq("id", replyToMessageId)
        .maybeSingle();
    if (replyTargetError)
      return Response.json(
        { error: "Pesan yang akan dibalas tidak dapat diverifikasi." },
        { status: 500 },
      );
    if (!replyTarget)
      return Response.json(
        { error: "Pesan yang akan dibalas tidak ditemukan." },
        { status: 400 },
      );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .insert({
      sender_id: user.id,
      content,
      reply_to_message_id: replyToMessageId,
    })
    .select(MESSAGE_FIELDS)
    .single();

  if (error)
    return Response.json(
      { error: "Pesan tidak dapat dikirim." },
      { status: 500 },
    );

  if (user.id === process.env.TELEGRAM_TRIGGER_USER_ID) {
    await triggerTelegramNotification();
  }

  try {
    const [message] = await addReplyPreviews([data]);
    return Response.json({ message }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Pesan tidak dapat dikirim." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const deleteAll =
    body && typeof body === "object" && "deleteAll" in body
      ? (body as { deleteAll?: unknown }).deleteAll === true
      : false;

  if (deleteAll) {
    const { error } = await getSupabaseAdmin()
      .from("messages")
      .delete()
      .not("id", "is", null);

    if (error)
      return Response.json(
        { error: "Semua pesan tidak dapat dihapus." },
        { status: 500 },
      );
    return Response.json({ deletedAll: true });
  }

  const ids = getMessageIds(body);
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
