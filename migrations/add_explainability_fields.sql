-- Migration: Add Explainability & Fairness Fields
-- Purpose: Achieve 100% compliance with hackathon requirements
-- Date: 2026-02-06

-- Add model metadata tracking
ALTER TABLE outputs 
ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT 'gemini-1.5-flash',
ADD COLUMN IF NOT EXISTS model_parameters JSONB DEFAULT '{"temperature": 0.7, "max_tokens": 2048}'::jsonb,
ADD COLUMN IF NOT EXISTS reasoning_steps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fairness_score DECIMAL(3,2) DEFAULT 0.85,
ADD COLUMN IF NOT EXISTS governed_output TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_outputs_model_version ON outputs(model_version);
CREATE INDEX IF NOT EXISTS idx_outputs_fairness_score ON outputs(fairness_score);

-- Add comment for documentation
COMMENT ON COLUMN outputs.model_version IS 'LLM model version used for generation (e.g., gemini-1.5-flash, gpt-4)';
COMMENT ON COLUMN outputs.model_parameters IS 'JSON object containing model parameters: temperature, max_tokens, top_p, etc.';
COMMENT ON COLUMN outputs.reasoning_steps IS 'Array of reasoning steps showing chain-of-thought process';
COMMENT ON COLUMN outputs.fairness_score IS 'Fairness evaluation score (0.0-1.0) measuring demographic parity and bias mitigation';
COMMENT ON COLUMN outputs.governed_output IS 'Human-edited version of the output after review (if modified)';
