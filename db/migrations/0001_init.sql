-- Armans.AI MSP Service Desk — V1 schema
-- Target: PostgreSQL 14+ with the pgvector extension (Supabase-compatible).
-- Every tenant-owned business record carries organization_id for isolation.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- users
-- In production, id should equal the Supabase auth.users.id (1:1). V1 demo
-- seeds standalone rows since live auth is not wired up yet (see README).
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('customer','dispatcher','l1_technician','l2_technician','service_manager')),
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index users_org_idx on users(organization_id);

-- ---------------------------------------------------------------------------
-- tickets
-- ---------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  submitted_by uuid references users(id),
  subject text not null,
  description text not null,
  status text not null default 'new'
    check (status in (
  'new',
  'triaged',
  'dispatcher_review',
  'assigned',
  'in_progress',
  'resolved',
  'escalated',
  'closed'
)),
  category text,
  impact text,
  urgency text,
  priority text,
  queue text,
  assigned_to uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_org_idx on tickets(organization_id);
create index tickets_status_idx on tickets(organization_id, status);

-- ---------------------------------------------------------------------------
-- ticket_events (append-only timeline)
-- ---------------------------------------------------------------------------
create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references users(id),
  actor_role text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index ticket_events_org_idx on ticket_events(organization_id);
create index ticket_events_ticket_idx on ticket_events(ticket_id);

-- ---------------------------------------------------------------------------
-- ai_triage_runs
-- ---------------------------------------------------------------------------
create table ai_triage_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  model text not null,
  input_snapshot jsonb not null,
  category text,
  impact text,
  urgency text,
  priority text,
  missing_information text[] not null default '{}',
  suggested_queue text,
  confidence numeric,
  raw_output jsonb,
  is_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

create index ai_triage_runs_org_idx on ai_triage_runs(organization_id);
create index ai_triage_runs_ticket_idx on ai_triage_runs(ticket_id);

-- ---------------------------------------------------------------------------
-- knowledge_documents
-- ---------------------------------------------------------------------------
create table knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  vendor text,
  source_reference text not null,
  version text,
  effective_date date,
  approval_status text not null default 'pending'
    check (approval_status in ('approved','pending','deprecated')),
  content text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index knowledge_documents_org_idx on knowledge_documents(organization_id);
create index knowledge_documents_approval_idx on knowledge_documents(organization_id, approval_status);

-- ---------------------------------------------------------------------------
-- knowledge_chunks
-- embedding dimension fixed at 1536 to match common embedding APIs; the
-- deterministic demo-mode embedder pads/truncates to the same dimension so
-- retrieval math (cosine similarity) is identical in both modes.
-- ---------------------------------------------------------------------------
create table knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  chunk_text text not null,
  section text,
  source_locator text,
  keywords text[] not null default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index knowledge_chunks_org_idx on knowledge_chunks(organization_id);
create index knowledge_chunks_document_idx on knowledge_chunks(document_id);
create index knowledge_chunks_embedding_idx on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------------
-- ai_recommendations
-- ---------------------------------------------------------------------------
create table ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  triage_run_id uuid references ai_triage_runs(id),
  status text not null check (status in ('grounded','no_approved_guidance')),
  recommendation_text text,
  citations jsonb not null default '[]',
  retrieval_query text,
  retrieved_chunk_ids uuid[] not null default '{}',
  model text,
  is_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

create index ai_recommendations_org_idx on ai_recommendations(organization_id);
create index ai_recommendations_ticket_idx on ai_recommendations(ticket_id);

-- ---------------------------------------------------------------------------
-- human_decisions
-- ---------------------------------------------------------------------------
create table human_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  recommendation_id uuid references ai_recommendations(id),
  decided_by uuid not null references users(id),
  decision text not null check (decision in ('approve','edit','reject','escalate','resolve')),
  notes text,
  edited_text text,
  created_at timestamptz not null default now()
);

create index human_decisions_org_idx on human_decisions(organization_id);
create index human_decisions_ticket_idx on human_decisions(ticket_id);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references users(id),
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_idx on audit_logs(organization_id);
create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- evaluations
-- ---------------------------------------------------------------------------
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ticket_id uuid references tickets(id) on delete cascade,
  recommendation_id uuid references ai_recommendations(id) on delete cascade,
  metric text not null,
  score numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index evaluations_org_idx on evaluations(organization_id);
