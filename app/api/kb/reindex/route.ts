import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { createEmbedding } from "@/lib/live/openai";
import { patchRows, supabaseRest } from "@/lib/live/supabase";

interface ChunkToIndex {
  id: string;
  chunk_text: string;
}

export async function POST() {
  try {
    const { token, user } = await requireLiveUser();
    if (user.role !== "service_manager") {
      return NextResponse.json({ error: "Service manager role required." }, { status: 403 });
    }

    const chunks = await supabaseRest<ChunkToIndex[]>(
      token,
      "approved_knowledge_chunks?select=id,chunk_text&order=id.asc",
    );

    const previews: Array<{ id: string; first: number }> = [];
    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk.chunk_text);
      await patchRows(token, `knowledge_chunks?id=eq.${chunk.id}`, { embedding });
      previews.push({ id: chunk.id, first: embedding[0] ?? 0 });
    }

    return NextResponse.json({ indexed: chunks.length, previews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reindex failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}