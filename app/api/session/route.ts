import { NextResponse } from "next/server";
import { getLiveUser } from "@/lib/live/auth";

export async function GET() {
  try {
    const session = await getLiveUser();
    return NextResponse.json({ authenticated: Boolean(session), user: session?.user ?? null });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null, error: error instanceof Error ? error.message : "Session error" });
  }
}
