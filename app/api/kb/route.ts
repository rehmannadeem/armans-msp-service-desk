import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { supabaseRest } from "@/lib/live/supabase";

export async function GET() {
  try {
    const { token } = await requireLiveUser();
    const docs = await supabaseRest<Array<Record<string, unknown>>>(token, "knowledge_documents?select=id,title,vendor,source_reference,version,effective_date,approval_status,created_at&order=title.asc");
    return NextResponse.json({ documents: docs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load knowledge.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
