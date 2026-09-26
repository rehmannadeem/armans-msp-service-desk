import { NextResponse } from "next/server";
import { LIVE_ACCESS_COOKIE } from "@/lib/live/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LIVE_ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
