import { getCurrentUser } from "@/lib/server-auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ ok: true });
}
