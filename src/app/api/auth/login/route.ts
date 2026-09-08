import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !/^\d{4,6}$/.test(password)) {
    return Response.json(
      { error: "Nama user dan password tidak valid." },
      { status: 400 },
    );
  }

  const { data: user, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("id, display_name, password_hash")
    .ilike("display_name", name)
    .maybeSingle();

  if (error || !user || !(await bcrypt.compare(password, user.password_hash))) {
    return Response.json(
      { error: "Nama user atau password salah." },
      { status: 401 },
    );
  }

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({
    user: { id: user.id, displayName: user.display_name },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}
