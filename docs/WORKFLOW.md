# End-to-End Workflow

## Primary live workflow

```mermaid
flowchart TD
    A[Ticket submitted] --> B[OpenAI structured triage]
    B --> C[dispatcher_review]
    C --> D{Dispatcher approves?}
    D -->|Yes| E[assigned]
    D -->|No| C
    E --> F[Technician requests guidance]
    F --> G[Create search embedding]
    G --> H[Approved-only pgvector search]
    H --> I{Similarity threshold met?}
    I -->|Yes| J[Grounded recommendation\nwith citations + scores]
    I -->|No| K[NO_APPROVED_GUIDANCE]
    J --> L{Technician decision}
    K --> L
    L -->|Resolve| M[resolved]
    L -->|Escalate| N[escalated]
    M --> O[Audit trail]
    N --> O
```

## Happy-path example

**Ticket:** VPN login fails after password change.

1. Ticket subject and description are submitted.
2. AI triage extracts structure and proposes a queue.
3. The tested example routed to `L2_IDENTITY`.
4. Dispatcher explicitly approves routing and assignment.
5. Technician requests guidance.
6. The system embeds the ticket/search text.
7. Supabase searches only approved knowledge chunks.
8. Ranked matches include similarity scores and source locators.
9. The UI displays a grounded recommendation.
10. Technician resolves the ticket.
11. Audit entries record the major events.

## Safety-path example

**Ticket:** Laptop battery swollen and not charging.

The only approved demo knowledge was VPN-related. The retrieval threshold was not met, so the system returned exactly:

```text
NO_APPROVED_GUIDANCE
```

The technician then escalated the ticket. This proves the system does not force irrelevant KB content into an answer.

## Human-control points

- dispatcher approves routing
- technician requests guidance
- technician decides resolve vs escalate
- service manager controls approved KB reindexing

## Key audit events observed

- `ticket.create_and_triage`
- `ticket.dispatch`
- `recommendation.grounded`
- `ticket.resolve`
- `ticket.escalate`

## What is intentionally absent

- autonomous remediation
- credential access
- firewall/device changes
- automatic ticket closure without human decision
- unapproved knowledge as troubleshooting evidence
