alter table prompt_analysis enable row level security;

create policy "prompt_analysis_select" on prompt_analysis
  for select using (is_tenant_member(tenant_id));

create policy "prompt_analysis_insert" on prompt_analysis
  for insert with check (is_tenant_member(tenant_id));
