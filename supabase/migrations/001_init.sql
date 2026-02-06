-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Tenancy & identity
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null check (role in ('admin', 'reviewer', 'auditor')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Trusted documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  source_uri text,
  created_at timestamptz not null default now()
);

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  version int not null,
  content text not null,
  checksum text not null,
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  version_id uuid not null references document_versions(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (version_id, chunk_index)
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Prompts & outputs
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  author_id uuid references auth.users(id),
  text text not null,
  status text not null check (status in ('SUBMITTED', 'ARCHIVED')),
  created_at timestamptz not null default now()
);

create table if not exists rag_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  retrieved_chunk_ids uuid[] not null default '{}',
  retrieval_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists outputs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  status text not null check (status in ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  content text not null,
  confidence numeric,
  risk_level text check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
  bias_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists output_citations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  chunk_id uuid not null references document_chunks(id) on delete cascade,
  citation_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists validation_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  classification text not null check (classification in ('GROUNDED', 'PARTIALLY_SUPPORTED', 'HALLUCINATED')),
  issues jsonb not null default '[]'::jsonb,
  score numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  rules jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists policy_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  policy_id uuid references policies(id) on delete set null,
  decision text not null check (decision in ('ALLOW', 'BLOCK')),
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  output_id uuid not null references outputs(id) on delete cascade,
  reviewer_id uuid references auth.users(id),
  decision text not null check (decision in ('APPROVED', 'REJECTED')),
  justification text not null,
  created_at timestamptz not null default now()
);

-- Append-only audit ledger
create table if not exists audit_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null,
  prev_hash text,
  hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_ledger_tenant_created_idx
  on audit_ledger (tenant_id, created_at desc);
