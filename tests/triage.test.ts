import { describe, expect, it } from "vitest";
import { demoTriageAdapter } from "@/lib/llm/demoAdapter";

describe("demo triage", () => {
  it("classifies VPN authentication failure with structured output", () => {
    const result = demoTriageAdapter.triage({
      subject: "VPN authentication failed",
      description: "Windows 11 Cisco AnyConnect says invalid password since today.",
    });
    expect(result.category).toBe("authentication_failure");
    expect(result.suggested_queue).toBe("L1_GENERAL");
    expect(result.priority).toMatch(/^P[1-4]$/);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
