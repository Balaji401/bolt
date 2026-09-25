/*
# TraderOS Core Schema

## Overview
Creates the foundational tables for the TraderOS trading operating system.
Single-tenant (no auth) so the anon-key client can read/write all data.

## New Tables
1. `trades` — every executed trade with full metadata (instrument, direction, entry/exit, P&L, RR, session, strategy tags, emotions, confidence, notes, screenshots).
2. `trading_plan` — daily/weekly plan, risk limits, checklists, trading rules.
3. `psychology_logs` — daily psychology check-ins (confidence, fear, greed, FOMO, discipline, patience, execution quality, rule violations).
4. `trading_goals` — measurable goals with target and progress.
5. `ai_insights` — AI-generated coaching insights stored and displayed.

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD (single-tenant shared data).
*/

CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument text NOT NULL,
  direction text NOT NULL DEFAULT 'long' CHECK (direction IN ('long', 'short')),
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity numeric NOT NULL DEFAULT 1,
  stop_loss numeric,
  take_profit numeric,
  pnl numeric NOT NULL DEFAULT 0,
  rr numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed', 'pending')),
  session text CHECK (session IN ('asia', 'london', 'new_york', 'sydney', 'other')),
  strategy_tags text[] DEFAULT '{}',
  emotions text[] DEFAULT '{}',
  confidence int CHECK (confidence BETWEEN 0 AND 100),
  notes text,
  screenshot_url text,
  executed_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trades" ON trades;
CREATE POLICY "anon_select_trades" ON trades FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
CREATE POLICY "anon_insert_trades" ON trades FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trades" ON trades;
CREATE POLICY "anon_update_trades" ON trades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trades" ON trades;
CREATE POLICY "anon_delete_trades" ON trades FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades (executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades (instrument);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);

CREATE TABLE IF NOT EXISTS trading_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  title text NOT NULL,
  max_daily_loss numeric,
  max_weekly_loss numeric,
  max_risk_per_trade numeric,
  entry_checklist jsonb DEFAULT '[]',
  exit_checklist jsonb DEFAULT '[]',
  session_checklist jsonb DEFAULT '[]',
  rules jsonb DEFAULT '[]',
  goals text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trading_plan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_plan" ON trading_plan;
CREATE POLICY "anon_select_plan" ON trading_plan FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_plan" ON trading_plan;
CREATE POLICY "anon_insert_plan" ON trading_plan FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_plan" ON trading_plan;
CREATE POLICY "anon_update_plan" ON trading_plan FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_plan" ON trading_plan;
CREATE POLICY "anon_delete_plan" ON trading_plan FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS psychology_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  confidence int NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  fear int CHECK (fear BETWEEN 0 AND 100),
  greed int CHECK (greed BETWEEN 0 AND 100),
  fomo int CHECK (fomo BETWEEN 0 AND 100),
  discipline int CHECK (discipline BETWEEN 0 AND 100),
  patience int CHECK (patience BETWEEN 0 AND 100),
  execution_quality int CHECK (execution_quality BETWEEN 0 AND 100),
  emotional_state text,
  rule_violations text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE psychology_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_psych" ON psychology_logs;
CREATE POLICY "anon_select_psych" ON psychology_logs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_psych" ON psychology_logs;
CREATE POLICY "anon_insert_psych" ON psychology_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_psych" ON psychology_logs;
CREATE POLICY "anon_update_psych" ON psychology_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_psych" ON psychology_logs;
CREATE POLICY "anon_delete_psych" ON psychology_logs FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS trading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  goal_type text NOT NULL DEFAULT 'profit' CHECK (goal_type IN ('profit', 'win_rate', 'trades', 'rr', 'discipline', 'custom')),
  target_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  period text CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  deadline date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trading_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_goals" ON trading_goals;
CREATE POLICY "anon_select_goals" ON trading_goals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_goals" ON trading_goals;
CREATE POLICY "anon_insert_goals" ON trading_goals FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_goals" ON trading_goals;
CREATE POLICY "anon_update_goals" ON trading_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_goals" ON trading_goals;
CREATE POLICY "anon_delete_goals" ON trading_goals FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL CHECK (insight_type IN ('warning', 'strength', 'suggestion', 'observation', 'summary')),
  title text NOT NULL,
  body text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  metric_ref text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_insights" ON ai_insights;
CREATE POLICY "anon_select_insights" ON ai_insights FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_insights" ON ai_insights;
CREATE POLICY "anon_insert_insights" ON ai_insights FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_insights" ON ai_insights;
CREATE POLICY "anon_update_insights" ON ai_insights FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_insights" ON ai_insights;
CREATE POLICY "anon_delete_insights" ON ai_insights FOR DELETE TO anon, authenticated USING (true);
