-- Helper functions
create or replace function is_tenant_member(check_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1 from profiles p
    where p.user_id = auth.uid() and p.tenant_id = check_tenant
  );
$$;

create or replace function role_in(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1 from profiles p
    where p.user_id = auth.uid() and p.role = any(roles)
  );
$$;

-- Enable RLS
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_chunks enable row level security;
alter table prompts enable row level security;
alter table rag_sessions enable row level security;
alter table outputs enable row level security;
alter table output_citations enable row level security;
alter table validation_results enable row level security;
alter table policies enable row level security;
alter table policy_decisions enable row level security;
alter table reviews enable row level security;
alter table audit_ledger enable row level security;

-- Tenants
create policy "tenant_read" on tenants
  for select using (id in (select tenant_id from profiles where user_id = auth.uid()));

-- Profiles
create policy "profiles_select" on profiles
  for select using (
    user_id = auth.uid()
    or (role_in(array['admin']) and tenant_id in (select tenant_id from profiles where user_id = auth.uid()))
  );

create policy "profiles_insert" on profiles
  for insert with check (user_id = auth.uid());

create policy "profiles_update" on profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Documents & evidence
create policy "documents_select" on documents
  for select using (is_tenant_member(tenant_id));

create policy "documents_modify" on documents
  for insert with check (role_in(array['admin']) and is_tenant_member(tenant_id));

create policy "documents_update" on documents
  for update using (role_in(array['admin']) and is_tenant_member(tenant_id))
  with check (role_in(array['admin']) and is_tenant_member(tenant_id));

create policy "document_versions_select" on document_versions
  for select using (is_tenant_member(tenant_id));

create policy "document_versions_modify" on document_versions
  for insert with check (role_in(array['admin']) and is_tenant_member(tenant_id));

create policy "document_versions_update" on document_versions
  for update using (role_in(array['admin']) and is_tenant_member(tenant_id))
  with check (role_in(array['admin']) and is_tenant_member(tenant_id));

create policy "document_chunks_select" on document_chunks
  for select using (is_tenant_member(tenant_id));

create policy "document_chunks_modify" on document_chunks
  for insert with check (role_in(array['admin']) and is_tenant_member(tenant_id));

create policy "document_chunks_update" on document_chunks
  for update using (role_in(array['admin']) and is_tenant_member(tenant_id))
  with check (role_in(array['admin']) and is_tenant_member(tenant_id));

-- Prompts
create policy "prompts_select" on prompts
  for select using (is_tenant_member(tenant_id));

create policy "prompts_insert" on prompts
  for insert with check (is_tenant_member(tenant_id));

-- RAG sessions
create policy "rag_select" on rag_sessions
  for select using (is_tenant_member(tenant_id));

create policy "rag_insert" on rag_sessions
  for insert with check (is_tenant_member(tenant_id));

-- Outputs
create policy "outputs_select" on outputs
  for select using (is_tenant_member(tenant_id));

create policy "outputs_insert" on outputs
  for insert with check (is_tenant_member(tenant_id));

create policy "outputs_update" on outputs
  for update using (role_in(array['reviewer','admin']) and is_tenant_member(tenant_id))
  with check (role_in(array['reviewer','admin']) and is_tenant_member(tenant_id));

-- Output citations
create policy "citations_select" on output_citations
  for select using (is_tenant_member(tenant_id));

create policy "citations_insert" on output_citations
  for insert with check (is_tenant_member(tenant_id));

-- Validation results
create policy "validation_select" on validation_results
  for select using (is_tenant_member(tenant_id));

create policy "validation_insert" on validation_results
  for insert with check (is_tenant_member(tenant_id));

-- Policies
create policy "policies_select" on policies
  for select using (is_tenant_member(tenant_id));

create policy "policies_modify" on policies
  for insert with check (role_in(array['admin']) and is_tenant_member(tenant_id));

create policy "policies_update" on policies
  for update using (role_in(array['admin']) and is_tenant_member(tenant_id))
  with check (role_in(array['admin']) and is_tenant_member(tenant_id));

-- Policy decisions
create policy "policy_decisions_select" on policy_decisions
  for select using (is_tenant_member(tenant_id));

create policy "policy_decisions_insert" on policy_decisions
  for insert with check (is_tenant_member(tenant_id));

-- Reviews
create policy "reviews_select" on reviews
  for select using (is_tenant_member(tenant_id));

create policy "reviews_insert" on reviews
  for insert with check (role_in(array['reviewer','admin']) and is_tenant_member(tenant_id));

-- Audit ledger (append-only)
create policy "audit_select" on audit_ledger
  for select using (role_in(array['auditor','admin']) and is_tenant_member(tenant_id));

create policy "audit_insert" on audit_ledger
  for insert with check (auth.role() = 'service_role');
