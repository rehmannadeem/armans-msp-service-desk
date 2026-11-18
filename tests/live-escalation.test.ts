import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { notifyEscalation } from "@/lib/live/n8n";

const payload = { ticket_id: "ticket", tenant: "tenant", queue: "L1_GENERAL", reason: "Human escalation", timestamp: "2026-11-18T00:00:00Z" };

beforeEach(() => {
  vi.stubEnv("N8N_ESCALATION_WEBHOOK_URL", "https://automation.example/escalate");
  vi.stubEnv("N8N_ESCALATION_WEBHOOK_SECRET", "test-secret");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("signs the transmitted body and uses a stable event-specific idempotency key", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  const audit = vi.fn();
  await notifyEscalation(payload, "escalated", audit);
  await notifyEscalation({ ...payload, timestamp: "2026-11-18T00:00:01Z" }, "escalated", audit);
  await notifyEscalation(payload, "abstained", audit);
  for (const [index, [, request]] of fetchMock.mock.calls.entries()) {
    expect(request.headers["X-Armans-Signature"]).toBe(createHmac("sha256", "test-secret").update(request.body).digest("hex"));
    expect(request.headers["Idempotency-Key"]).toBe(index === 2 ? "ticket:abstained" : "ticket:escalated");
  }
  expect(audit).not.toHaveBeenCalled();
});

it("makes three retries, then audits a final failure", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn().mockResolvedValue({ ok: false });
  vi.stubGlobal("fetch", fetchMock);
  const audit = vi.fn().mockResolvedValue(undefined);
  const delivery = notifyEscalation(payload, "escalated", audit);
  await vi.runAllTimersAsync();
  await delivery;
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(audit).toHaveBeenCalledTimes(1);
  expect(audit).toHaveBeenCalledWith({ event: "escalated", attempts: 4 });
});

it("is disabled when the URL is unset", async () => {
  vi.stubEnv("N8N_ESCALATION_WEBHOOK_URL", undefined);
  const fetchMock = vi.fn();
  const audit = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await notifyEscalation(payload, "escalated", audit);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(audit).not.toHaveBeenCalled();
});
