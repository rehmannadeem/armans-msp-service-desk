async function post(url: string | undefined, payload: Record<string, unknown>) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
  } catch (error) {
    console.error("n8n webhook failed:", error instanceof Error ? error.message : error);
  }
}

export function notifyTriaged(payload: Record<string, unknown>) {
  return post(process.env.N8N_TICKET_TRIAGED_WEBHOOK_URL, { event: "ticket.triaged", ...payload });
}

export async function notifyEscalation(
  payload: { ticket_id: string; tenant: string; queue: string; reason: string; timestamp: string },
  event: "abstained" | "escalated",
  auditFailure: (details: { event: string; attempts: number }) => Promise<unknown>,
) {
  const url = process.env.N8N_ESCALATION_WEBHOOK_URL;
  if (!url) return;
  const secret = process.env.N8N_ESCALATION_WEBHOOK_SECRET;
  let attempts = 0;
  try {
    if (!secret) throw new Error("Escalation signing secret is missing");
    const body = JSON.stringify({ ...payload, event });
    const { createHmac } = await import("node:crypto");
    const headers = {
      "Content-Type": "application/json",
      "X-Armans-Signature": createHmac("sha256", secret).update(body).digest("hex"),
      "Idempotency-Key": `${payload.ticket_id}:${event}`,
    };
    for (let retry = 0; retry <= 3; retry++) {
      if (retry > 0) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (retry - 1)));
      attempts++;
      try {
        const response = await fetch(url, {
          method: "POST", body, headers, signal: AbortSignal.timeout(4000), redirect: "error",
        });
        if (response.ok) return;
      } catch {
        // Retry connection failures and timeouts with the same idempotency key.
      }
    }
  } catch {
    // Configuration and signing failures use the same audit path.
  }
  try {
    await auditFailure({ event, attempts });
  } catch {
    console.error("Escalation delivery audit could not be persisted", payload.ticket_id, event);
  }
}
