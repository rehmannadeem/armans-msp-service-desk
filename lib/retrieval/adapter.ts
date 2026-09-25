import type { Category, KnowledgeChunk } from "@/lib/types";

export interface RetrievalParams {
  /** Tenant the requesting technician belongs to. Enforced defensively inside the adapter. */
  organizationId: string;
  category: Category;
  queryText: string;
  /** Candidate chunks. Callers should already scope this query by organization_id in SQL;
   *  the adapter re-checks org and approval status itself as a second line of defense. */
  chunks: KnowledgeChunk[];
}

export interface ScoredChunk {
  chunk: KnowledgeChunk;
  score: number;
}

export interface RetrievalResult {
  /** True when no sufficiently-relevant, approved evidence was found.
   *  Callers MUST surface NO_APPROVED_GUIDANCE in this case (see lib/domain/recommendation.ts). */
  abstain: boolean;
  matches: ScoredChunk[];
}

/**
 * Provider-agnostic retrieval contract. V1 ships DemoRetrievalAdapter
 * (lib/retrieval/demoRetrieval.ts): deterministic keyword/category scoring over the
 * seeded knowledge base, no embeddings API call required. The schema still carries a
 * pgvector `embedding` column and a `match_knowledge_chunks` SQL function
 * (supabase/migrations/0003_match_function.sql) so a real embedding-based adapter can
 * be swapped in later behind this same interface.
 */
export interface RetrievalAdapter {
  retrieve(params: RetrievalParams): RetrievalResult;
}
