import { describe, expect, it } from "vitest";
import { demoTriageAdapter } from "@/lib/llm/demoAdapter";
import { demoRetrievalAdapter } from "@/lib/retrieval/demoRetrieval";
import { composeRecommendation } from "@/lib/domain/recommendation";
import { DEMO_KB, DEMO_ORG_ID } from "@/lib/demoData";

function runDemo(subject: string, description: string) {
  const triage = demoTriageAdapter.triage({ subject, description });
  const retrieval = demoRetrievalAdapter.retrieve({
    organizationId: DEMO_ORG_ID,
    category: triage.category,
    queryText: `${subject} ${description}`,
    chunks: DEMO_KB,
  });
  return { triage, recommendation: composeRecommendation(retrieval) };
}

describe("public guided demo (/demo) flow", () => {
  it("gives cited guidance for the default VPN ticket", () => {
    const { recommendation } = runDemo(
      "VPN login fails after password change",
      "Windows 11 user on Cisco AnyConnect gets authentication failed since password changed today. Error message says invalid credentials.",
    );
    expect(recommendation.isAbstention).toBe(false);
    expect(recommendation.citations.length).toBeGreaterThan(0);
  });

  it("returns NO_APPROVED_GUIDANCE for a ticket outside the approved knowledge", () => {
    const { recommendation } = runDemo(
      "Laptop battery drains fast",
      "The laptop battery drops from 100% to 20% in one hour and the charger light blinks.",
    );
    expect(recommendation.isAbstention).toBe(true);
    expect(recommendation.text).toBe("NO_APPROVED_GUIDANCE");
  });
});
