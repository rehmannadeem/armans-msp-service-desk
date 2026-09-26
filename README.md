# Armans.AI MSP Service Desk Intelligence Layer — V1

A cloud-hosted, human-in-the-loop service-desk intelligence layer for MSP / IT service companies.

**V1 technical acceptance passed on 2026-09-26.**

## What the system does

Ticket intake → AI triage → dispatcher approval → technician assignment → approved-KB semantic retrieval → cited guidance or exact `NO_APPROVED_GUIDANCE` → human resolve/escalate → audit trail.

The system does **not** autonomously remediate customer systems, does **not** access credentials, and does **not** use unapproved knowledge for technician guidance.

## Live architecture

- **Next.js 16 + TypeScript** — UI and server API routes
- **Cloudflare Workers / OpenNext** — live application runtime
- **Supabase Auth** — authenticated users
- **PostgreSQL + RLS** — tenant-scoped application data
- **pgvector** — semantic retrieval over approved knowledge
- **OpenAI API** — ticket triage and embeddings
- **n8n Cloud** — optional workflow lab / future external orchestration; not in the live V1 critical path
- **GitHub** — source code, migrations, documentation, and deployment configuration

## Core safety rule

If approved evidence does not clear the configured retrieval threshold, the system returns exactly:

```text
NO_APPROVED_GUIDANCE
```

A human technician remains responsible for the final decision.

## V1 acceptance evidence

The live V1 was verified for:

- [x] Supabase Auth login
- [x] Tenant isolation and role hardening
- [x] 4 approved KB chunks reindexed with 4 distinct embedding vectors
- [x] VPN ticket triaged and routed to `L2_IDENTITY`
- [x] Dispatcher approval and assignment
- [x] Grounded recommendation with approved KB citations and similarity scores
- [x] Resolve path recorded in audit trail
- [x] Out-of-domain laptop battery ticket returned exact `NO_APPROVED_GUIDANCE`
- [x] Escalation path recorded in audit trail
- [x] Cloudflare production deployment
- [x] End-to-end live test against Supabase and OpenAI

Synthetic demo knowledge is clearly identified and must never be represented as real customer data.

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [End-to-End Workflow](docs/WORKFLOW.md)
- [Data, Retrieval & Security](docs/SECURITY.md)
- [Hands-On Technical Learning Map](docs/TECHNICAL-LEARNING.md)
- [n8n Workflow Lab](docs/N8N-LAB.md)
- [Acceptance Tests](docs/ACCEPTANCE-TESTS.md)
- [Visual Learning Materials](docs/VISUALS.md)
- [Cloudflare Deployment](DEPLOYMENT.md)

## Database migrations

Run files in `db/migrations` in numeric order:

1. `0001_init.sql` — core tables + pgvector
2. `0002_rls.sql` — tenant isolation
3. `0003_vector_search.sql` — authenticated-user vector search
4. `0004_service_vector_search.sql` — trusted service-side vector search
5. `0005_role_hardening.sql` — least-privilege role policies

## Public-documentation boundary

Documentation in this repository is written to be safe for public technical discussion. Never commit:

- API keys, tokens, passwords, cookies, private credentials
- real MSP customer data
- private ticket content
- internal secrets or confidential vendor configuration

## Current product boundary

This is a working V1/demo and technical pilot foundation. It is **not yet commercially validated** and is **not yet connected to a real MSP PSA/helpdesk or real customer knowledge base**. Those integrations should be driven by a real pilot requirement.
