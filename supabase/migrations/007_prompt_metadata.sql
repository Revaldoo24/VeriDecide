create table if not exists prompt_analysis (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  detected_domain text,
  keyword_hits jsonb not null default '[]'::jsonb,
  bias_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table prompts
  add column if not exists title text,
  add column if not exists domain text,
  add column if not exists urgency text,
  add column if not exists tags jsonb not null default '[]'::jsonb;

alter table outputs
  add column if not exists legal_risk text,
  add column if not exists bias_risk text;

create index if not exists prompt_analysis_prompt_idx on prompt_analysis (prompt_id);
