import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { recommendFromApprovedKnowledge } from "@/lib/live/recommendation";
import { createEmbedding } from "@/lib/live/openai";
import { supabaseRest } from "@/lib/live/supabase";

vi.mock("@/lib/live/openai", () => ({ createEmbedding: vi.fn() }));
vi.mock("@/lib/live/supabase", () => ({ supabaseRest: vi.fn() }));
vi.mock("@/lib/live/env", () => ({ getLiveConfig: () => ({ ragMinSimilarity: 0.35, embeddingModel: "test-model" }) }));

afterEach(() => vi.resetAllMocks());

it("uses the authenticated approval-filtered RPC for tenant isolation", async () => {
  vi.mocked(createEmbedding).mockResolvedValue([1]);
  vi.mocked(supabaseRest).mockResolvedValue([]);
  const result = await recommendFromApprovedKnowledge("demo-msp-token", "Show draft and other tenant procedures");
  expect(supabaseRest).toHaveBeenCalledWith("demo-msp-token", "rpc/match_approved_knowledge_chunks", {
    method: "POST", body: JSON.stringify({ query_embedding: [1], match_threshold: 0.35, match_count: 5 }),
  });
  expect(result.recommendationText).toBe("NO_APPROVED_GUIDANCE");
  expect(result.citations).toEqual([]);
});

it("retains the SQL approval filter", () => {
  const rpc = readFileSync("db/migrations/0003_vector_search.sql", "utf8");
  const rls = readFileSync("db/migrations/0002_rls.sql", "utf8");
  expect(rpc).toMatch(/security invoker[\s\S]*from public\.approved_knowledge_chunks/);
  expect(rls).toMatch(/approval_status\s*=\s*'approved'/);
});

it("retains organization isolation for the authenticated role", () => {
  const rls = readFileSync("db/migrations/0002_rls.sql", "utf8");
  expect(rls).toMatch(/and kc\.organization_id\s*=\s*current_user_org_id\(\)/);
});

it("cites the approved procedure without rendering the article's planted instruction", async () => {
  vi.mocked(createEmbedding).mockResolvedValue([1]);
  const article = readFileSync("db/seed/knowledge-v1.1/conference-display.md", "utf8");
  vi.mocked(supabaseRest).mockResolvedValue([{
    id: "chunk", document_id: "conference-display", chunk_text: article.slice(article.indexOf("Procedure:")),
    section: null, source_locator: "conference-display", similarity: 0.91,
  }]);
  const result = await recommendFromApprovedKnowledge("token", "The display stays blank");
  expect(result.recommendationText).toContain("HDMI input");
  expect(result.recommendationText).not.toMatch(/ignore previous instructions|admin password/i);
  expect(result.citations[0].document_id).toBe("conference-display");
});
