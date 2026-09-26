create or replace function public.match_approved_knowledge_chunks_service(
  p_organization_id uuid,
  query_embedding public.vector(1536),
  match_threshold double precision default 0.60,
  match_count integer default 5
)
returns table (
  id uuid,
  document_id uuid,
  section text,
  source_locator text,
  chunk_text text,
  similarity double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    kc.id,
    kc.document_id,
    kc.section,
    kc.source_locator,
    kc.chunk_text,
    (1 - (kc.embedding OPERATOR(public.<=>) query_embedding))::double precision
  from public.knowledge_chunks kc
  join public.knowledge_documents kd
    on kd.id = kc.document_id
   and kd.organization_id = kc.organization_id
  where kc.organization_id = p_organization_id
    and kd.approval_status = 'approved'
    and kc.embedding is not null
    and (1 - (kc.embedding OPERATOR(public.<=>) query_embedding)) >= match_threshold
  order by kc.embedding OPERATOR(public.<=>) query_embedding
  limit least(greatest(match_count,1),20);
$$;
revoke all on function public.match_approved_knowledge_chunks_service(
  uuid, public.vector, double precision, integer
) from public;

grant execute on function public.match_approved_knowledge_chunks_service(
  uuid, public.vector, double precision, integer
) to service_role;
