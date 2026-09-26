import { NextResponse } from "next/server";
import { getLiveConfig } from "@/lib/live/env";
import { LIVE_ACCESS_COOKIE } from "@/lib/live/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    if (!body.email || !body.password) return NextResponse.json({ error: "Credentials required." }, { status: 400 });
    const { supabaseUrl, supabaseAnonKey } = getLiveConfig();
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) return NextResponse.json({ error: data.error_description || data.msg || "Login failed." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(LIVE_ACCESS_COOKIE, data.access_token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: Number(data.expires_in || 3600),
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 500 });
  }
}
