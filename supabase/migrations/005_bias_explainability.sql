create table if not exists prompt_bias_analysis (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  bias_score numeric not null,
  bias_flags jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists inference_bias_analysis (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  bias_score numeric not null,
  bias_flags jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists model_invocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  provider text not null,
  model_name text not null,
  model_version text not null,
  parameters jsonb not null default '{}'::jsonb,
  request_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists reasoning_traces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists prompt_bias_prompt_idx on prompt_bias_analysis (prompt_id);
create index if not exists inference_bias_output_idx on inference_bias_analysis (output_id);
create index if not exists model_invocations_output_idx on model_invocations (output_id);
create index if not exists reasoning_traces_output_idx on reasoning_traces (output_id);
