import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from "@/lib/server-auth";
import {
  clearLoginFailures,
  getLoginRateLimit,
  getLoginRateLimitKey,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rateLimitKey = getLoginRateLimitKey(address, name);
  const rateLimit = getLoginRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!name || !/^\d{4,6}$/.test(password)) {
    recordLoginFailure(rateLimitKey);
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
    const retryAfterSeconds = recordLoginFailure(rateLimitKey);
    if (retryAfterSeconds > 0) {
      return Response.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }
    return Response.json(
      { error: "Nama user atau password salah." },
      { status: 401 },
    );
  }

  clearLoginFailures(rateLimitKey);
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
