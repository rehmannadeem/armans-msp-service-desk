# Armans.AI MSP Service Desk Intelligence Layer — V1

Commercial V1 for MSP / IT service companies.

## Live target architecture
- GitHub: source code and version history
- Cloudflare: deployed Next.js application
- Supabase: PostgreSQL, users, tickets, audit data, approved KB, pgvector
- n8n Cloud: workflow orchestration and notifications
- LLM API: triage and grounded technician copilot

## Frozen workflow
Customer Ticket → AI Triage → Dispatcher Review → Technician Assignment → Approved KB Retrieval → Grounded Guidance / Safe Abstention → Resolve or Escalate → Audit

## Safety rule
If approved evidence is insufficient, return `NO_APPROVED_GUIDANCE`. Never invent troubleshooting steps.

## Current state
Local demo flow works and automated tests pass. Production integrations are the next milestone.

## V1 domain
VPN support incidents first. Expand only after the end-to-end live workflow is validated.
