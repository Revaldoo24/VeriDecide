alter table prompt_bias_analysis enable row level security;
alter table inference_bias_analysis enable row level security;
alter table model_invocations enable row level security;
alter table reasoning_traces enable row level security;

create policy "prompt_bias_select" on prompt_bias_analysis
  for select using (is_tenant_member(tenant_id));

create policy "prompt_bias_insert" on prompt_bias_analysis
  for insert with check (is_tenant_member(tenant_id));

create policy "inference_bias_select" on inference_bias_analysis
  for select using (is_tenant_member(tenant_id));

create policy "inference_bias_insert" on inference_bias_analysis
  for insert with check (is_tenant_member(tenant_id));

create policy "model_invocations_select" on model_invocations
  for select using (is_tenant_member(tenant_id));

create policy "model_invocations_insert" on model_invocations
  for insert with check (is_tenant_member(tenant_id));

create policy "reasoning_traces_select" on reasoning_traces
  for select using (is_tenant_member(tenant_id));

create policy "reasoning_traces_insert" on reasoning_traces
  for insert with check (is_tenant_member(tenant_id));
