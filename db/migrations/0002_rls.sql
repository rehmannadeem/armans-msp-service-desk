-- Row Level Security: tenant isolation design.
--
-- V1 demo mode does not wire up Supabase Auth (see README "Security limits
-- and blockers"), so isolation is proven here at the SQL layer using a
-- session variable (`app.current_org_id`) that the application sets per
-- request/connection. In production with Supabase Auth this same pattern
-- extends naturally: replace app_current_org_id() with a lookup of
-- auth.uid() -> users.organization_id, e.g.
--
--   create function app_current_org_id() returns uuid as $$
--     select organization_id from users where id = auth.uid()
--   $$ language sql stable;
--
-- and every policy below keeps working unchanged.

create function app_current_org_id() returns uuid as $$
  select nullif(current_setting('app.current_org_id', true), '')::uuid
$$ language sql stable;

-- organizations: a row is visible only to members of that org.
alter table organizations enable row level security;
create policy organizations_isolation on organizations
  using (id = app_current_org_id());

alter table users enable row level security;
create policy users_isolation on users
  using (organization_id = app_current_org_id());

alter table tickets enable row level security;
create policy tickets_isolation on tickets
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table ticket_events enable row level security;
create policy ticket_events_isolation on ticket_events
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table ai_triage_runs enable row level security;
create policy ai_triage_runs_isolation on ai_triage_runs
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table knowledge_documents enable row level security;
create policy knowledge_documents_isolation on knowledge_documents
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table knowledge_chunks enable row level security;
create policy knowledge_chunks_isolation on knowledge_chunks
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table ai_recommendations enable row level security;
create policy ai_recommendations_isolation on ai_recommendations
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table human_decisions enable row level security;
create policy human_decisions_isolation on human_decisions
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table audit_logs enable row level security;
create policy audit_logs_isolation on audit_logs
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

alter table evaluations enable row level security;
create policy evaluations_isolation on evaluations
  using (organization_id = app_current_org_id())
  with check (organization_id = app_current_org_id());

-- Knowledge retrieval must additionally only ever surface approved
-- documents to the recommendation engine. This is enforced twice by
-- design: in application code (lib/retrieval) and here as a defence in
-- depth check usable by any future direct-SQL reporting tool.
create view approved_knowledge_chunks as
  select kc.*
  from knowledge_chunks kc
  join knowledge_documents kd on kd.id = kc.document_id
  where kd.approval_status = 'approved';
