# VeriDecide - Responsible GenAI Governance MVP

A governed, auditable, policy-driven RAG platform for regulatory decision support. The LLM is treated as untrusted and interchangeable. All validation, policy enforcement, and auditability live outside the model.

## Core MVP Capabilities
- Governed RAG with trusted, versioned evidence
- Transparent output validation (groundedness scoring)
- Policy enforcement with explicit thresholds
- Human-in-the-loop approval workflow
- Append-only audit ledger with hash chaining
- Multi-tenant structure via Supabase + RLS

## Quick Start

### 1. Configure Supabase
Run the SQL migrations in order in your Supabase SQL editor:
- `supabase/migrations/001_init.sql`
- `supabase/migrations/002_rls.sql`
- `supabase/migrations/003_functions.sql`
- `supabase/migrations/004_demo_seed.sql` (optional demo tenant + policy)
- `supabase/migrations/005_bias_explainability.sql`
- `supabase/migrations/006_rls_bias_explainability.sql`
- `supabase/migrations/007_prompt_metadata.sql`
- `supabase/migrations/008_rls_prompt_metadata.sql`
- `supabase/migrations/009_source_type.sql`

### 2. Configure environment
Copy `.env.local.example` to `.env.local` and set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (optional for later auth)
- `DEMO_TENANT_ID` (matches demo seed)
- Optional: SERP ingestion variables if you want open-source evidence (`OPEN_SOURCE_ENABLED`, `SERP_PROVIDER`, `SERP_API_KEY`)

### 3. Seed demo evidence (optional)
```bash
npm run seed:docs
```
This inserts a demo document and chunk embeddings using the same local embedding logic as the app.

### 4. Open-source evidence (optional)
You can let the pipeline ingest open-source evidence via SERP before answering:
```bash
POST /api/pipeline
{
  "prompt": "...",
  "allowOpenSource": true,
  "openSourceQuery": "optional override"
}
```

Set `OPEN_SOURCE_ENABLED=true`, configure `SERP_PROVIDER` (`serper` or `serpapi`), and `SERP_API_KEY`.

### 5. Upload evidence manually
Use the Evidence Library at `/documents` to paste policy text and store it as governed evidence.

### 6. Run the app
```bash
npm run dev
```

## Demo Flow
1. Go to `/prompts` and submit a regulatory question.
2. Review the governed output at `/outputs`.
3. Approve or reject the output at `/reviews` with justification.
4. Inspect the append-only audit log at `/audit`.

## LLM Provider
Default is `mock` for offline demos. To use Gemini:
- Set `LLM_PROVIDER=gemini`
- Provide `GEMINI_API_URL` and `GEMINI_API_KEY` (use your preferred Gemini endpoint)

## Notes
- Supabase is used strictly for data + access infrastructure (RLS, storage, auth).
- Audit ledger is append-only and protected by RLS + triggers.
- Validation and policy enforcement occur server-side and are non-advisory.
