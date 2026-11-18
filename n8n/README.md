# n8n — MSP V1 Orchestration

n8n is the orchestration layer, not the source of truth. Supabase owns application data and approved knowledge; the Next.js app owns the user workflow.

## Workflow 1 — Knowledge Embedding Pipeline

Purpose: prepare approved KB chunks for pgvector retrieval.

Flow:

`Manual/Scheduled Trigger → Read approved knowledge_chunks → OpenAI embeddings → PATCH each chunk by its own id`

Critical mapping rule: each n8n item must preserve the matching `knowledge_chunks.id`; never reuse the first embedding for every row.

The live app also exposes a service-manager-only **Reindex approved KB** action. It is the recovery path if an n8n embedding run is mis-mapped.

## Workflow 2 — Semantic Search Test

Purpose: evaluation/debugging only.

Flow:

`Manual Trigger → search_text → OpenAI search embedding → Supabase RPC match_approved_knowledge_chunks_service → ranked chunks`

Production technician retrieval is performed by the authenticated application using the user-scoped `match_approved_knowledge_chunks` RPC.

## Workflow 3 — Ticket Triaged Event

The application can POST best-effort JSON to `N8N_TICKET_TRIAGED_WEBHOOK_URL`.

Expected payload starts with:

```json
{ "event": "ticket.triaged", "ticketId": "...", "organizationId": "...", "subject": "...", "category": "...", "confidence": 0.8 }
```

Use this workflow for notifications, downstream queue integrations, or pilot-specific automation. It must not block the core ticket flow.

## Workflow 4 — Safe Abstention Event

The demo-domain adapter supports `N8N_ABSTENTION_WEBHOOK_URL`. The live application uses the signed escalation handoff below.

Use it for escalation notifications only. Do not let n8n generate unsupported troubleshooting advice.

## Git source-of-truth rule

After the live n8n workflows are finalized, export their JSON from n8n and save them in this directory. Never commit credentials or secret values.

## Escalation handoff

Import `escalation-handoff.json` into an n8n instance that allows the Code node
to use the built-in `crypto` module and read
`N8N_ESCALATION_WEBHOOK_SECRET`. Configure the same signing secret in the app
and n8n. Set the app's `N8N_ESCALATION_WEBHOOK_URL` to the workflow webhook URL.

Bind the Postgres node to a dedicated automation database. Create the alert
queue there before enabling the workflow.

```sql
CREATE TABLE escalation_alerts (
  idempotency_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The node inserts an alert and sends a Postgres notification on
`armans_escalation` only for the first delivery of each ticket and event. An
alert consumer can listen on that channel and use the key to read the durable
queue, including alerts queued while the consumer was offline.
