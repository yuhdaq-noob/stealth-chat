import { getCurrentUser, touchCurrentSession } from "@/lib/server-auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await touchCurrentSession();
  return Response.json({ ok: true });
}
