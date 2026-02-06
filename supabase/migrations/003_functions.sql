-- Vector similarity search
create or replace function match_chunks(
  tenant_id uuid,
  query_embedding text,
  match_count int default 6
)
returns table (
  id uuid,
  version_id uuid,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.version_id,
    c.content,
    1 - (c.embedding <=> query_embedding::vector) as similarity
  from document_chunks c
  where c.tenant_id = match_chunks.tenant_id
  order by c.embedding <=> query_embedding::vector
  limit match_count;
$$;

-- Append-only audit enforcement
create or replace function prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_ledger is append-only';
end;
$$;

drop trigger if exists audit_ledger_no_update on audit_ledger;
create trigger audit_ledger_no_update
  before update or delete on audit_ledger
  for each row execute procedure prevent_audit_mutation();
