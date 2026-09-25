# Armans.AI MSP Service Desk Intelligence Layer — V1 Build Spec

## Goal
Build a credible commercial demo for MSP / IT service companies. It must triage incoming support tickets, keep a dispatcher in control of routing, retrieve only approved knowledge, give a technician evidence-based guidance, and log the human decision.

## Primary Demo Domain
VPN support incidents only for V1.

## Required Flow
Ticket intake → AI triage → dispatcher review/approval → technician assignment → approved-KB retrieval → cited recommendation OR safe abstention → technician decision → resolve/escalate → audit trail.

## Critical Safety Rule
If approved evidence is missing or insufficient, return exactly `NO_APPROVED_GUIDANCE`. Never invent troubleshooting steps.

## Stack
- Next.js + TypeScript
- Supabase/PostgreSQL + pgvector
- n8n for workflow orchestration
- One LLM provider behind a simple adapter
- Git
- Deployable to Cloudflare-compatible hosting

## Required Roles
Customer/demo submitter, Dispatcher, L1 Technician, L2 Technician, Service Manager/Admin.

## Core Tables
organizations, users, tickets, ticket_events, ai_triage_runs, knowledge_documents, knowledge_chunks, ai_recommendations, human_decisions, audit_logs, evaluations.

Every tenant-owned business record must carry `organization_id`.
## Triage Output
Return structured JSON with: category, impact, urgency, priority, missing_information, suggested_queue, confidence.

## Knowledge Rules
Knowledge documents require source/vendor, source reference, version/date, approval status, organization_id and content. Chunks require document_id, organization_id, chunk text, section/source locator, keywords and embedding.

Seed the demo with a small, clearly labeled VPN runbook set covering authentication failure, gateway timeout/unreachable, client configuration, DNS after connection, MFA/expired credentials, route/split-tunnel problems and basic connectivity prerequisites.

Do not present synthetic runbooks or demo identities as real customer data.

## Security Minimum
Authentication-ready structure, role checks, tenant isolation/RLS design, server-side secrets only, audit logging, least privilege, no autonomous remediation.

## UI Minimum
Simple professional pages for: ticket submit/list/detail, dispatcher review, technician workbench, KB sources, audit/evaluation view. Functionality and proof matter more than design polish.

## Acceptance
- Ticket submission works.
- Structured triage is stored.
- Dispatcher can approve/change assignment.
- Technician sees grounded source-linked guidance.
- Missing evidence produces `NO_APPROVED_GUIDANCE` and escalation.
- Human approve/edit/reject/escalate action is logged.
- Cross-tenant retrieval is prevented by design/tests.
- Core flows have automated tests where practical.
- README explains setup, architecture, demo flow, security limits and current blockers.

## Build Constraint
Do not add LangChain, Kubernetes, extra agent frameworks, a second database, or unnecessary services. Prefer the simplest implementation that proves the workflow.