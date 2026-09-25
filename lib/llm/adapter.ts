import type { Category, Impact, Priority, Queue, Urgency } from "@/lib/types";

export interface TriageInput {
  subject: string;
  description: string;
}

export interface TriageOutput {
  category: Category;
  impact: Impact;
  urgency: Urgency;
  priority: Priority;
  missing_information: string[];
  suggested_queue: Queue;
  confidence: number;
  rationale: string;
}

/**
 * Provider-agnostic triage contract. V1 ships a single implementation
 * (DemoTriageAdapter, lib/llm/demoAdapter.ts) that is fully deterministic and
 * runs offline - no network call, no API key, no non-determinism - so the demo
 * and the test suite behave identically without any external LLM account.
 *
 * A real hosted-model adapter can implement this same interface later without
 * changing any call site (lib/domain/triage.ts is the only caller).
 */
export interface LlmTriageAdapter {
  readonly modelName: string;
  triage(input: TriageInput): TriageOutput;
}
