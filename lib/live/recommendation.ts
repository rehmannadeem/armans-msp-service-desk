import { getLiveConfig } from "./env";
import { createEmbedding } from "./openai";
import { supabaseRest } from "./supabase";
import type { RankedChunk } from "./types";
import { NO_APPROVED_GUIDANCE } from "@/lib/safety/constants";

export async function recommendFromApprovedKnowledge(token: string, queryText: string) {
  const embedding = await createEmbedding(queryText);
  const { ragMinSimilarity, embeddingModel } = getLiveConfig();
  const matches = await supabaseRest<RankedChunk[]>(token, "rpc/match_approved_knowledge_chunks", {
    method: "POST",
    body: JSON.stringify({ query_embedding: embedding, match_threshold: ragMinSimilarity, match_count: 5 }),
  });
  // Structured articles designate displayable procedures. Other lines remain source data.
  const guidance = matches.flatMap((match) => {
    const lines = match.chunk_text.split(/\r?\n/);
    const steps = lines[0] === "Procedure:"
      ? lines.slice(1).filter((line) => /^- \S/.test(line)).map((line) => line.slice(2))
      : lines;
    const text = steps.join("\n").trim();
    return text ? [{ match, text }] : [];
  });
  const citations = guidance.map(({ match }) => ({
    document_id: match.document_id,
    chunk_id: match.id,
    section: match.section,
    source_locator: match.source_locator,
    similarity: match.similarity,
  }));
  return {
    matches, citations, ragMinSimilarity, embeddingModel,
    abstain: guidance.length === 0,
    recommendationText: guidance.length
      ? guidance.map(({ match, text }, index) => `${index + 1}. ${text} [${match.source_locator || match.section || "approved source"}]`).join("\n")
      : NO_APPROVED_GUIDANCE,
  };
}
