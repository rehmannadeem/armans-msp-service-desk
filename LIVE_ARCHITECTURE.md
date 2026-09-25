# V1 Live Architecture

## System of record
1. GitHub — code and deployment version
2. Supabase — application data and approved knowledge
3. n8n Cloud — automation execution state
4. Cloudflare — deployed web application

## Seven-step live workflow
1. Ticket intake: web form creates ticket in Supabase.
2. AI triage: classify category, impact, urgency, priority, missing info and queue.
3. Dispatcher control: human reviews and approves or changes routing.
4. Technician assignment: assigned queue/user is stored and event logged.
5. Knowledge retrieval: search only approved tenant KB chunks in Supabase/pgvector.
6. Technician copilot: return cited guidance or `NO_APPROVED_GUIDANCE`.
7. Outcome: technician resolves/escalates; n8n records/alerts; audit and evaluation data persist.

## Knowledge source policy
Demo V1 uses a small controlled VPN runbook set with source, vendor, version/date, approval status and tenant ownership. Real MSP pilots replace/extend this with customer-approved SOPs, KB articles and anonymized ticket history.

## Production gate
Do not call V1 production-ready until Supabase persistence, n8n execution, real LLM adapter, tenant/security checks, deployment and end-to-end live verification all pass.
