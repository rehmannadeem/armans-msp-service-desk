import { NO_APPROVED_GUIDANCE } from "@/lib/safety/constants";
import type { Citation, KnowledgeChunk } from "@/lib/types";
import type { RetrievalResult } from "@/lib/retrieval/adapter";

export interface ComposedRecommendation {
  text: string;
  isAbstention: boolean;
  citations: Citation[];
  confidence: number | null;
}

function toCitation(chunk: KnowledgeChunk): Citation {
  return {
    document_id: chunk.document_id,
    document_title: chunk.document_title ?? "",
    source_vendor: chunk.source_vendor ?? "",
    source_reference: chunk.source_reference ?? "",
    section_locator: chunk.section_locator,
    chunk_id: chunk.id,
  };
}

/**
 * The single choke point between retrieval and the technician's screen.
 *
 * BUILD_SPEC.md, Critical Safety Rule: "If approved evidence is missing or
 * insufficient, return exactly NO_APPROVED_GUIDANCE. Never invent troubleshooting
 * steps." This function is the only place in the codebase allowed to decide that
 * literal string vs. real guidance, and it never fabricates text: every non-abstaining
 * word it emits is copied verbatim from an approved knowledge_chunks row, each cited.
 */
export function composeRecommendation(retrieval: RetrievalResult): ComposedRecommendation {
  if (retrieval.abstain || retrieval.matches.length === 0) {
    return {
      text: NO_APPROVED_GUIDANCE,
      isAbstention: true,
      citations: [],
      confidence: null,
    };
  }

  const steps = retrieval.matches.map((match, index) => {
    const label = match.chunk.section_locator ? ` (${match.chunk.section_locator})` : "";
    return `${index + 1}. ${match.chunk.chunk_text.trim()}${label}`;
  });

  const totalScore = retrieval.matches.reduce((sum, match) => sum + match.score, 0);
  const confidence = Math.min(0.95, Math.round((totalScore / (retrieval.matches.length * 5)) * 100) / 100);

  return {
    text: steps.join("\n"),
    isAbstention: false,
    citations: retrieval.matches.map((match) => toCitation(match.chunk)),
    confidence,
  };
}
