create or replace function public.match_approved_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_threshold double precision default 0.70,
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
security invoker
set search_path = ''
as $$
  select
    kc.id,
    kc.document_id,
    kc.section,
    kc.source_locator,
    kc.chunk_text,
    (1 - (kc.embedding OPERATOR(extensions.<=>) query_embedding))::double precision
  from public.approved_knowledge_chunks kc
  where kc.embedding is not null
    and (1 - (kc.embedding OPERATOR(extensions.<=>) query_embedding)) >= match_threshold
  order by kc.embedding OPERATOR(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke all on function public.match_approved_knowledge_chunks(
  extensions.vector, double precision, integer
) from public;

grant execute on function public.match_approved_knowledge_chunks(
  extensions.vector, double precision, integer
) to authenticated;