import { describe, expect, it } from "vitest";
import { canTransition, InvalidTransitionError, assertTransition } from "@/lib/domain/statusMachine";

describe("ticket lifecycle", () => {
  it("allows the approved V1 path", () => {
    expect(canTransition("new", "triaged")).toBe(true);
    expect(canTransition("triaged", "dispatcher_review")).toBe(true);
    expect(canTransition("dispatcher_review", "assigned")).toBe(true);
    expect(canTransition("assigned", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "resolved")).toBe(true);
  });

  it("rejects unsafe lifecycle jumps", () => {
    expect(() => assertTransition("new", "resolved")).toThrow(InvalidTransitionError);
  });
});
