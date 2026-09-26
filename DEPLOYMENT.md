# Cloudflare deployment - V1

## Source
GitHub repository: rehmannadeem/armans-msp-service-desk
Branch: main

## Build adapter
This repository is configured for Cloudflare Workers through OpenNext for Cloudflare.

Build command:
`npm run deploy:cloudflare`

## Required runtime secrets
Configure these in the Cloudflare Worker environment. Never commit their values.

- SUPABASE_URL
- SUPABASE_ANON_KEY
- OPENAI_API_KEY
- OPENAI_MODEL=gpt-5.6-luna
- OPENAI_EMBEDDING_MODEL=text-embedding-3-small
- RAG_MIN_SIMILARITY=0.35

Optional:
- N8N_TICKET_TRIAGED_WEBHOOK_URL
- N8N_ABSTENTION_WEBHOOK_URL

## Pre-deploy live database gate
Apply `db/migrations/0005_role_hardening.sql` to the live Supabase project before exposing the demo publicly.

## Acceptance gate
After deployment verify: login, KB reindex with distinct vectors, ticket triage, dispatcher approval, grounded retrieval, safe abstention, resolve/escalate, and audit trail.
