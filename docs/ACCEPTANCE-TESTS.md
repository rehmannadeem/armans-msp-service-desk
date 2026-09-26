# V1 Acceptance Tests

**Acceptance date:** 2026-09-26

## Result

**Technical V1 acceptance: PASS**

## Test 1 — Knowledge embedding integrity

Action:

- Reindex approved KB.

Observed result:

- 4 chunks indexed
- 4 distinct first-vector values

Pass criterion: each source chunk produces an independent embedding.

**PASS**

## Test 2 — Grounded VPN guidance

Input:

- VPN login failure after password change.

Observed flow:

- ticket created and triaged
- queue proposed as `L2_IDENTITY`
- dispatcher approved routing
- technician retrieved approved guidance
- recommendation was grounded in approved VPN runbook chunks
- source locators and similarity scores were displayed
- technician resolved the ticket
- audit trail recorded the workflow

**PASS**

## Test 3 — Safe abstention

Input:

- physically swollen laptop battery / charging problem
- no VPN, authentication, password, login, or network issue

Observed result:

```text
NO_APPROVED_GUIDANCE
```

The VPN KB was not misused for the unrelated issue.

**PASS**

## Test 4 — Escalation path

The out-of-scope ticket was escalated by the human operator and the audit trail recorded the escalation.

**PASS**

## Test 5 — Live cloud deployment

The application was built with OpenNext and deployed to Cloudflare Workers.

The live home page returned HTTP 200 and the authentication route successfully communicated with Supabase.

**PASS**

## Acceptance boundaries

These tests prove the V1 technical workflow and safety controls. They do not prove:

- commercial product-market fit
- production-scale reliability
- integration with a real MSP PSA/helpdesk
- performance with a real customer's KB
- enterprise compliance certification

Those require a real MSP pilot.
