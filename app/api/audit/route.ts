import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { supabaseRest } from "@/lib/live/supabase";

export async function GET() {
  try {
    const { token, user } = await requireLiveUser();
    if (user.role !== "service_manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const logs = await supabaseRest<Array<Record<string, unknown>>>(token, "audit_logs?select=*&order=created_at.desc&limit=100");
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load audit.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
