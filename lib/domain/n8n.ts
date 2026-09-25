// Optional, best-effort outbound calls into the n8n orchestration layer (see
// n8n/workflow.json). Neither webhook is required for the app to function - if the
// env var is unset, or the call fails/times out, we log and move on. n8n orchestrates
// notifications and downstream routing hints; it never gates or blocks the core
// ticket/dispatcher/technician flow, and it never performs autonomous remediation.
const TICKET_TRIAGED_WEBHOOK = process.env.N8N_TICKET_TRIAGED_WEBHOOK_URL;
const ABSTENTION_WEBHOOK = process.env.N8N_ABSTENTION_WEBHOOK_URL;

async function postBestEffort(url: string | undefined, payload: Record<string, unknown>): Promise<void> {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("n8n webhook call failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

export interface TicketTriagedNotification {
  ticketId: string;
  organizationId: string;
  subject: string;
  category: string;
  confidence: number;
  missingInformation: string[];
}

export async function notifyTicketTriaged(payload: TicketTriagedNotification): Promise<void> {
  await postBestEffort(TICKET_TRIAGED_WEBHOOK, { event: "ticket.triaged", ...payload });
}

export interface AbstentionNotification {
  ticketId: string;
  organizationId: string;
  subject: string;
}

export async function notifyAbstention(payload: AbstentionNotification): Promise<void> {
  await postBestEffort(ABSTENTION_WEBHOOK, { event: "recommendation.abstained", ...payload });
}
