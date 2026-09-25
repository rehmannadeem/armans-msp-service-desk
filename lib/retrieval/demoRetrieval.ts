import type { KnowledgeChunk } from "@/lib/types";
import type { RetrievalAdapter, RetrievalParams, RetrievalResult, ScoredChunk } from "@/lib/retrieval/adapter";

// Minimum score a chunk must reach before it is trusted as evidence. A bare category
// match (CATEGORY_MATCH_WEIGHT) clears this bar; an "other"/uncategorized ticket - which
// by construction has no seeded chunk sharing its category - must instead accumulate
// keyword overlap, and usually won't, which is exactly how the demo naturally exercises
// the NO_APPROVED_GUIDANCE safety path.
const MIN_SCORE = 2;
const CATEGORY_MATCH_WEIGHT = 2;
const KEYWORD_FIELD_WEIGHT = 1.5;
const KEYWORD_TEXT_WEIGHT = 0.5;
const MAX_MATCHES = 3;
const MIN_TOKEN_LENGTH = 3;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

function scoreChunk(chunk: KnowledgeChunk, category: string, tokens: string[]): number {
  let score = 0;
  if (chunk.category === category) {
    score += CATEGORY_MATCH_WEIGHT;
  }
  const chunkKeywords = new Set((chunk.keywords ?? []).map((keyword) => keyword.toLowerCase()));
  const chunkText = chunk.chunk_text.toLowerCase();
  for (const token of tokens) {
    if (chunkKeywords.has(token)) {
      score += KEYWORD_FIELD_WEIGHT;
    } else if (chunkText.includes(token)) {
      score += KEYWORD_TEXT_WEIGHT;
    }
  }
  return Math.round(score * 100) / 100;
}

export class DemoRetrievalAdapter implements RetrievalAdapter {
  retrieve(params: RetrievalParams): RetrievalResult {
    const tokens = tokenize(params.queryText);

    const eligible = params.chunks.filter(
      (chunk) =>
        // Defense in depth: even if the caller's SQL query already scoped by org_id,
        // never let a cross-tenant chunk reach the technician.
        chunk.organization_id === params.organizationId &&
        // Never cite content that hasn't been through knowledge approval.
        chunk.approval_status === "approved",
    );

    const scored: ScoredChunk[] = eligible
      .map((chunk) => ({ chunk, score: scoreChunk(chunk, params.category, tokens) }))
      .filter((entry) => entry.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MATCHES);

    return {
      abstain: scored.length === 0,
      matches: scored,
    };
  }
}

export const demoRetrievalAdapter = new DemoRetrievalAdapter();
