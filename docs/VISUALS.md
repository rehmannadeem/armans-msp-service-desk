# Visual Learning Materials

This repository's documentation is designed to be understandable visually as well as through code.

## Architecture at a glance

```mermaid
flowchart LR
    UI[Technician / Dispatcher UI]
    APP[Next.js on Cloudflare]
    DB[(Supabase\nAuth + Postgres + RLS + pgvector)]
    AI[OpenAI]
    UI --> APP
    APP <--> DB
    APP <--> AI
```

## Human-controlled service workflow

```mermaid
flowchart LR
    T[Ticket] --> TRIAGE[AI Triage]
    TRIAGE --> DISP[Dispatcher Approval]
    DISP --> TECH[Technician]
    TECH --> RET[Approved KB Retrieval]
    RET --> DEC{Strong evidence?}
    DEC -->|Yes| G[Grounded Guidance]
    DEC -->|No| N[NO_APPROVED_GUIDANCE]
    G --> H{Human decision}
    N --> H
    H --> RES[Resolve]
    H --> ESC[Escalate]
```

## Generated infographic set

The project has four generated training visuals intended for `docs/images/`:

1. `system-design.webp` — technical system design
2. `end-to-end-workflow.webp` — full operational workflow
3. `data-model-retrieval-security.webp` — data model, retrieval, and security
4. `technical-learning-map.webp` — hands-on learning map

Once the binary image assets are present in `docs/images/`, they can be embedded directly in this page and the root README.
