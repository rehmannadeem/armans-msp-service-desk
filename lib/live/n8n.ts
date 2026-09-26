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

export function notifyAbstention(payload: Record<string, unknown>) {
  return post(process.env.N8N_ABSTENTION_WEBHOOK_URL, { event: "recommendation.abstained", ...payload });
}
