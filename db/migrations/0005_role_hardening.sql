-- V1 role hardening on top of tenant-isolation RLS.
-- Keeps tenant scoping in the database and limits sensitive writes by role.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.users
  where id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_org_id() to authenticated;

drop policy if exists organizations_isolation on public.organizations;
create policy organizations_select on public.organizations
  for select using (id = public.current_user_org_id());

drop policy if exists users_isolation on public.users;
create policy users_select on public.users
  for select using (organization_id = public.current_user_org_id());

drop policy if exists tickets_isolation on public.tickets;
create policy tickets_select on public.tickets
  for select using (organization_id = public.current_user_org_id());
create policy tickets_insert on public.tickets
  for insert with check (
    organization_id = public.current_user_org_id()
    and submitted_by = auth.uid()
  );
create policy tickets_update on public.tickets
  for update using (
    organization_id = public.current_user_org_id()
    and public.current_user_role() in ('dispatcher','l1_technician','l2_technician','service_manager')
  )
  with check (organization_id = public.current_user_org_id());

drop policy if exists ticket_events_isolation on public.ticket_events;
create policy ticket_events_select on public.ticket_events
  for select using (organization_id = public.current_user_org_id());
create policy ticket_events_insert on public.ticket_events
  for insert with check (organization_id = public.current_user_org_id());

drop policy if exists ai_triage_runs_isolation on public.ai_triage_runs;
create policy ai_triage_runs_select on public.ai_triage_runs
  for select using (organization_id = public.current_user_org_id());
create policy ai_triage_runs_insert on public.ai_triage_runs
  for insert with check (organization_id = public.current_user_org_id());

drop policy if exists knowledge_documents_isolation on public.knowledge_documents;
create policy knowledge_documents_select on public.knowledge_documents
  for select using (organization_id = public.current_user_org_id());
create policy knowledge_documents_insert on public.knowledge_documents
  for insert with check (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  );
create policy knowledge_documents_update on public.knowledge_documents
  for update using (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  )
  with check (organization_id = public.current_user_org_id());

drop policy if exists knowledge_chunks_isolation on public.knowledge_chunks;
create policy knowledge_chunks_select on public.knowledge_chunks
  for select using (organization_id = public.current_user_org_id());
create policy knowledge_chunks_insert on public.knowledge_chunks
  for insert with check (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  );
create policy knowledge_chunks_update on public.knowledge_chunks
  for update using (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  )
  with check (organization_id = public.current_user_org_id());

drop policy if exists ai_recommendations_isolation on public.ai_recommendations;
create policy ai_recommendations_select on public.ai_recommendations
  for select using (organization_id = public.current_user_org_id());
create policy ai_recommendations_insert on public.ai_recommendations
  for insert with check (
    organization_id = public.current_user_org_id()
    and public.current_user_role() in ('l1_technician','l2_technician','service_manager')
  );

drop policy if exists human_decisions_isolation on public.human_decisions;
create policy human_decisions_select on public.human_decisions
  for select using (organization_id = public.current_user_org_id());
create policy human_decisions_insert on public.human_decisions
  for insert with check (
    organization_id = public.current_user_org_id()
    and public.current_user_role() in ('dispatcher','l1_technician','l2_technician','service_manager')
  );

drop policy if exists audit_logs_isolation on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select using (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  );
create policy audit_logs_insert on public.audit_logs
  for insert with check (organization_id = public.current_user_org_id());

drop policy if exists evaluations_isolation on public.evaluations;
create policy evaluations_select on public.evaluations
  for select using (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  );
create policy evaluations_insert on public.evaluations
  for insert with check (
    organization_id = public.current_user_org_id()
    and public.current_user_role() = 'service_manager'
  );
