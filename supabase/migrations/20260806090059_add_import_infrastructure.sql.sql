/*
# TraderOS: Broker Sync & Trade Import Infrastructure

## Overview
Adds tables for tracking import jobs, import errors, CSV column mapping templates,
and broker_trade_id/import_job_id/source columns on trades for duplicate detection.

## New Tables
### 1. `import_jobs` — tracks each import operation
### 2. `import_errors` — row-level errors from import jobs
### 3. `csv_mapping_templates` — saved column mappings per broker format

## Changes to `trades` (additive only)
- `broker_trade_id` (text) — external broker trade ID for duplicate detection
- `import_job_id` (uuid, FK import_jobs) — which import created this trade
- `source` (text) — 'manual' | 'csv' | 'mt4' | 'mt5' | 'ctrader' | 'dxtrade' | 'matchtrader'

## Security
- RLS enabled on all new tables with owner-scoped CRUD (TO authenticated, auth.uid() = user_id).
- import_errors scoped through import_jobs ownership via EXISTS subquery.
- trades table already has anon+authenticated policies — no changes needed.
*/
CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL,
  broker_name text NOT NULL,
  source_format text NOT NULL DEFAULT 'csv',
  file_name text,
  file_size bigint,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'importing', 'completed', 'failed', 'cancelled')),
  total_rows int NOT NULL DEFAULT 0,
  imported_rows int NOT NULL DEFAULT 0,
  skipped_rows int NOT NULL DEFAULT 0,
  failed_rows int NOT NULL DEFAULT 0,
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_import_jobs" ON import_jobs;
CREATE POLICY "select_own_import_jobs" ON import_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_import_jobs" ON import_jobs;
CREATE POLICY "insert_own_import_jobs" ON import_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_import_jobs" ON import_jobs;
CREATE POLICY "update_own_import_jobs" ON import_jobs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_import_jobs" ON import_jobs;
CREATE POLICY "delete_own_import_jobs" ON import_jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);

CREATE TABLE IF NOT EXISTS import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number int NOT NULL,
  row_data jsonb,
  error_type text NOT NULL DEFAULT 'validation',
  error_message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_import_errors" ON import_errors;
CREATE POLICY "select_own_import_errors" ON import_errors FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM import_jobs WHERE import_jobs.id = import_errors.import_job_id AND import_jobs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_import_errors" ON import_errors;
CREATE POLICY "insert_own_import_errors" ON import_errors FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM import_jobs WHERE import_jobs.id = import_errors.import_job_id AND import_jobs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_import_errors" ON import_errors;
CREATE POLICY "delete_own_import_errors" ON import_errors FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM import_jobs WHERE import_jobs.id = import_errors.import_job_id AND import_jobs.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_import_errors_job ON import_errors(import_job_id);

CREATE TABLE IF NOT EXISTS csv_mapping_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_format text NOT NULL,
  template_name text NOT NULL,
  column_mapping jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE csv_mapping_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_csv_templates" ON csv_mapping_templates;
CREATE POLICY "select_own_csv_templates" ON csv_mapping_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_csv_templates" ON csv_mapping_templates;
CREATE POLICY "insert_own_csv_templates" ON csv_mapping_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_csv_templates" ON csv_mapping_templates;
CREATE POLICY "update_own_csv_templates" ON csv_mapping_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_csv_templates" ON csv_mapping_templates;
CREATE POLICY "delete_own_csv_templates" ON csv_mapping_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Extend trades table with additive columns for import tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'broker_trade_id') THEN
    ALTER TABLE trades ADD COLUMN broker_trade_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'import_job_id') THEN
    ALTER TABLE trades ADD COLUMN import_job_id uuid REFERENCES import_jobs(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'source') THEN
    ALTER TABLE trades ADD COLUMN source text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trades_broker_trade_id ON trades(broker_trade_id);
CREATE INDEX IF NOT EXISTS idx_trades_import_job ON trades(import_job_id);
