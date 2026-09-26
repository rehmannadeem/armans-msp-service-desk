# Armans.AI MSP Service Desk Intelligence Layer — V1

Commercial live V1 for MSP / IT service companies. Primary demo domain: VPN support.

## What V1 proves

Ticket intake → real AI triage → dispatcher approval → technician assignment → approved-KB semantic retrieval → cited guidance or exact `NO_APPROVED_GUIDANCE` → human resolve/escalate → audit trail.

No autonomous remediation. No credential access. Only approved tenant knowledge may become technician guidance.

## Live architecture

- **Next.js 16 + TypeScript** — application and server route handlers
- **Supabase Auth + PostgreSQL + RLS** — identity, tenant data, audit
- **pgvector** — approved-KB semantic retrieval
- **OpenAI API** — ticket triage and embeddings
- **n8n Cloud** — optional workflow orchestration/notifications and KB automation
- **GitHub** — source-of-truth for code and migrations
- **Cloudflare Workers** — deployment target

## Required environment variables

Copy `.env.example` to `.env.local` for local testing. Never commit secrets.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (publishable/anon project key)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-5.6-luna`)
- `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`)
- `RAG_MIN_SIMILARITY` (default: `0.35`)
- Optional n8n webhook URLs

## Database deployment order

Run the SQL files in `db/migrations` in numeric order:

1. `0001_init.sql` — core tables + pgvector
2. `0002_rls.sql` — Supabase Auth tenant isolation
3. `0003_vector_search.sql` — authenticated-user vector-search RPC
4. `0004_service_vector_search.sql` — service-side vector-search RPC for trusted automation
5. `0005_role_hardening.sql` — command-specific least-privilege RLS policies

## Live demo flow

1. Sign in using the Supabase Auth user linked to `public.users`.
2. Service Manager can press **Reindex approved KB** to regenerate each chunk independently.
3. Submit a VPN support ticket.
4. OpenAI triages it into category, impact, urgency, priority, missing information and queue.
5. Dispatcher approves routing and assignment.
6. Technician retrieves approved guidance.
7. If retrieval does not meet the configured threshold, the app returns exactly `NO_APPROVED_GUIDANCE`.
8. Technician resolves or escalates.
9. Events, AI runs, recommendations, human decisions and audit records persist in Supabase.

## Security model

- Supabase Auth JWT determines `auth.uid()`.
- `public.users.id = auth.uid()` maps the identity to an organization and role.
- RLS enforces tenant isolation.
- `0005_role_hardening.sql` restricts sensitive writes by role.
- OpenAI and Supabase credentials are server-side only.
- n8n secret credentials stay in n8n.
- Guidance is deterministic from retrieved approved chunks; the system does not invent troubleshooting steps.

## Local verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

## Current V1 acceptance target

- [x] Schema and tenant isolation designed
- [x] Approved knowledge + pgvector
- [x] OpenAI embeddings
- [x] Semantic-search RPC
- [x] Live Auth-backed application routes
- [x] Ticket persistence + triage persistence
- [x] Dispatcher approval + assignment
- [x] Grounded guidance / safe abstention
- [x] Human resolve/escalate + audit
- [x] Live dashboard UI
- [ ] Apply `0005_role_hardening.sql` to the live Supabase project
- [ ] Configure runtime secrets
- [ ] Run end-to-end acceptance against live Supabase/OpenAI
- [ ] Deploy Cloudflare Worker and record public demo URL
- [ ] Export final n8n workflows into `n8n/`

Synthetic demo knowledge must never be represented as real customer data.
