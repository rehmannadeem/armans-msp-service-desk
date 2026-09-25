-- Row Level Security: live tenant isolation using Supabase Auth.
--
-- Every authenticated user is mapped from auth.uid() to public.users.id.
-- That user row provides organization_id, and every tenant-owned table is
-- restricted to that organization through current_user_org_id().
--
-- Bootstrap note: the first organization/user rows are created by a trusted
-- server/admin path (for V1, the Supabase SQL Editor) before normal RLS-based
-- application access begins.

create or replace function current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.users
  where id = auth.uid()
  limit 1;
$$;

-- organizations: a row is visible only to members of that org.
alter table organizations enable row level security;
create policy organizations_isolation on organizations
  using (id = current_user_org_id());

alter table users enable row level security;
create policy users_isolation on users
  using (organization_id = current_user_org_id());

alter table tickets enable row level security;
create policy tickets_isolation on tickets
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table ticket_events enable row level security;
create policy ticket_events_isolation on ticket_events
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table ai_triage_runs enable row level security;
create policy ai_triage_runs_isolation on ai_triage_runs
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table knowledge_documents enable row level security;
create policy knowledge_documents_isolation on knowledge_documents
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table knowledge_chunks enable row level security;
create policy knowledge_chunks_isolation on knowledge_chunks
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table ai_recommendations enable row level security;
create policy ai_recommendations_isolation on ai_recommendations
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table human_decisions enable row level security;
create policy human_decisions_isolation on human_decisions
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table audit_logs enable row level security;
create policy audit_logs_isolation on audit_logs
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

alter table evaluations enable row level security;
create policy evaluations_isolation on evaluations
  using (organization_id = current_user_org_id())
  with check (organization_id = current_user_org_id());

-- Knowledge retrieval must additionally only ever surface approved
-- documents to the recommendation engine. This is enforced twice by
-- design: in application code (lib/retrieval) and here as a defence in
-- depth check usable by any future direct-SQL reporting tool.
create view approved_knowledge_chunks
with (security_invoker = true) as
  select kc.*
  from knowledge_chunks kc
  join knowledge_documents kd
    on kd.id = kc.document_id
   and kd.organization_id = kc.organization_id
  where kd.approval_status = 'approved'
    and kc.organization_id = current_user_org_id();
