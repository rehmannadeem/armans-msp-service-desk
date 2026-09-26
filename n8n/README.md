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

The application can POST to `N8N_ABSTENTION_WEBHOOK_URL` when retrieval returns no approved guidance.

Use it for escalation notifications only. Do not let n8n generate unsupported troubleshooting advice.

## Git source-of-truth rule

After the live n8n workflows are finalized, export their JSON from n8n and save them in this directory. Never commit credentials or secret values.
