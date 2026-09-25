import { describe, expect, it } from "vitest";
import { demoRetrievalAdapter } from "@/lib/retrieval/demoRetrieval";
import { composeRecommendation } from "@/lib/domain/recommendation";
import { CROSS_TENANT_CHUNK, DEMO_KB, DEMO_ORG_ID } from "@/lib/demoData";

it("retrieves approved same-tenant evidence and cites it", () => {
  const result = demoRetrievalAdapter.retrieve({ organizationId: DEMO_ORG_ID, category: "authentication_failure", queryText: "VPN login authentication failed invalid password", chunks: [...DEMO_KB, CROSS_TENANT_CHUNK] });
  expect(result.abstain).toBe(false);
  expect(result.matches.every((m) => m.chunk.organization_id === DEMO_ORG_ID)).toBe(true);
  const recommendation = composeRecommendation(result);
  expect(recommendation.isAbstention).toBe(false);
  expect(recommendation.citations.length).toBeGreaterThan(0);
});

describe("safe abstention", () => {
  it("returns exact NO_APPROVED_GUIDANCE when evidence is absent", () => {
    const result = demoRetrievalAdapter.retrieve({ organizationId: DEMO_ORG_ID, category: "other", queryText: "unrelated unsupported issue", chunks: [] });
    const recommendation = composeRecommendation(result);
    expect(recommendation.text).toBe("NO_APPROVED_GUIDANCE");
    expect(recommendation.isAbstention).toBe(true);
  });
});
