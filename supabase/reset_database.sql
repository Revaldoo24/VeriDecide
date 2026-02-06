-- ========================================
-- VERIDECIDE DATABASE RESET SCRIPT (FORCE)
-- ========================================
-- WARNING: This will DELETE ALL DATA!
-- ========================================

-- Step 1: Temporarily disable RLS for this session
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE outputs DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ledger DISABLE ROW LEVEL SECURITY;

-- Step 2: Force truncate all tables (CASCADE will handle FK constraints)
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE prompts CASCADE;
TRUNCATE TABLE outputs CASCADE;
TRUNCATE TABLE audit_ledger CASCADE;

-- Step 3: Re-enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 5: Verify all tables are empty
SELECT 'documents' as table_name, COUNT(*) as row_count FROM documents
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks
UNION ALL
SELECT 'prompts', COUNT(*) FROM prompts
UNION ALL
SELECT 'outputs', COUNT(*) FROM outputs
UNION ALL
SELECT 'audit_ledger', COUNT(*) FROM audit_ledger;

-- ========================================
-- DONE! All tables should now show 0 rows.
-- ========================================
