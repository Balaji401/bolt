/*
# Add AI Decision Intelligence & Behavioral Analytics Tables

1. Modified Tables
- `ai_insights`: Add columns for user_id, workspace_id, confidence, evidence_refs, feedback, generated_at. Add RLS policies.

2. New Tables
- `ai_insight_evidence`, `ai_behavior_patterns`, `ai_trader_profile`, `ai_behavior_events`, `ai_insight_feedback`

3. Security
- Enable RLS on all new tables and on ai_insights. Owner-scoped CRUD (user_id = auth.uid()).
*/

-- Alter existing ai_insights table: add user_id as nullable first
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'user_id') THEN
    ALTER TABLE ai_insights ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill: set user_id to first known user's id where null
UPDATE ai_insights SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Now set NOT NULL with default
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'user_id' AND is_nullable = 'YES') THEN
    ALTER TABLE ai_insights ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE ai_insights ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'workspace_id') THEN
    ALTER TABLE ai_insights ADD COLUMN workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'confidence') THEN
    ALTER TABLE ai_insights ADD COLUMN confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'evidence_refs') THEN
    ALTER TABLE ai_insights ADD COLUMN evidence_refs jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'feedback') THEN
    ALTER TABLE ai_insights ADD COLUMN feedback text DEFAULT NULL CHECK (feedback IS NULL OR feedback IN ('useful', 'not_useful', 'correct', 'incorrect', 'saved', 'dismissed'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_insights' AND column_name = 'generated_at') THEN
    ALTER TABLE ai_insights ADD COLUMN generated_at timestamptz DEFAULT now();
  END IF;
END $$;

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_insights_user_idx ON ai_insights (user_id);
CREATE INDEX IF NOT EXISTS ai_insights_workspace_idx ON ai_insights (workspace_id);
CREATE INDEX IF NOT EXISTS ai_insights_type_idx ON ai_insights (insight_type);
DROP POLICY IF EXISTS "select_own_ai_insights" ON ai_insights;
CREATE POLICY "select_own_ai_insights" ON ai_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_insights" ON ai_insights;
CREATE POLICY "insert_own_ai_insights" ON ai_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_insights" ON ai_insights;
CREATE POLICY "update_own_ai_insights" ON ai_insights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_insights" ON ai_insights;
CREATE POLICY "delete_own_ai_insights" ON ai_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Insight Evidence
CREATE TABLE IF NOT EXISTS ai_insight_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id uuid NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_type text NOT NULL CHECK (evidence_type IN ('trade', 'journal', 'metric', 'psychology_log', 'goal', 'habit', 'mistake', 'strategy')),
  ref_id text,
  ref_table text,
  label text,
  detail jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_insight_evidence ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_insight_evidence_insight_idx ON ai_insight_evidence (insight_id);
CREATE INDEX IF NOT EXISTS ai_insight_evidence_user_idx ON ai_insight_evidence (user_id);
DROP POLICY IF EXISTS "select_own_ai_insight_evidence" ON ai_insight_evidence;
CREATE POLICY "select_own_ai_insight_evidence" ON ai_insight_evidence FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_insight_evidence" ON ai_insight_evidence;
CREATE POLICY "insert_own_ai_insight_evidence" ON ai_insight_evidence FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_insight_evidence" ON ai_insight_evidence;
CREATE POLICY "delete_own_ai_insight_evidence" ON ai_insight_evidence FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Behavior Patterns
CREATE TABLE IF NOT EXISTS ai_behavior_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('revenge_trading', 'fomo', 'overtrading', 'early_exit', 'late_entry', 'increasing_risk_after_loss', 'breaking_rules', 'trading_outside_session', 'trading_outside_strategy', 'repeated_mistakes', 'inconsistent_sizing', 'chasing_losses')),
  title text NOT NULL,
  description text NOT NULL,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  occurrence_count integer DEFAULT 0,
  first_seen timestamptz,
  last_seen timestamptz,
  evidence_refs jsonb DEFAULT '[]'::jsonb,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_behavior_patterns ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_behavior_patterns_user_idx ON ai_behavior_patterns (user_id);
CREATE INDEX IF NOT EXISTS ai_behavior_patterns_type_idx ON ai_behavior_patterns (pattern_type);
CREATE INDEX IF NOT EXISTS ai_behavior_patterns_workspace_idx ON ai_behavior_patterns (workspace_id);
DROP POLICY IF EXISTS "select_own_ai_behavior_patterns" ON ai_behavior_patterns;
CREATE POLICY "select_own_ai_behavior_patterns" ON ai_behavior_patterns FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_behavior_patterns" ON ai_behavior_patterns;
CREATE POLICY "insert_own_ai_behavior_patterns" ON ai_behavior_patterns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_behavior_patterns" ON ai_behavior_patterns;
CREATE POLICY "update_own_ai_behavior_patterns" ON ai_behavior_patterns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_behavior_patterns" ON ai_behavior_patterns;
CREATE POLICY "delete_own_ai_behavior_patterns" ON ai_behavior_patterns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Trader Profile
CREATE TABLE IF NOT EXISTS ai_trader_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  trading_style text,
  preferred_markets text[] DEFAULT '{}',
  preferred_instruments text[] DEFAULT '{}',
  preferred_sessions text[] DEFAULT '{}',
  preferred_timeframes text[] DEFAULT '{}',
  typical_risk_pct numeric DEFAULT 0,
  typical_holding_minutes integer,
  strong_strategies text[] DEFAULT '{}',
  weak_strategies text[] DEFAULT '{}',
  common_mistakes text[] DEFAULT '{}',
  psychological_patterns text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  learning_priorities text[] DEFAULT '{}',
  profile_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id)
);
ALTER TABLE ai_trader_profile ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_trader_profile_user_idx ON ai_trader_profile (user_id);
CREATE INDEX IF NOT EXISTS ai_trader_profile_workspace_idx ON ai_trader_profile (workspace_id);
DROP POLICY IF EXISTS "select_own_ai_trader_profile" ON ai_trader_profile;
CREATE POLICY "select_own_ai_trader_profile" ON ai_trader_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_trader_profile" ON ai_trader_profile;
CREATE POLICY "insert_own_ai_trader_profile" ON ai_trader_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_trader_profile" ON ai_trader_profile;
CREATE POLICY "update_own_ai_trader_profile" ON ai_trader_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_trader_profile" ON ai_trader_profile;
CREATE POLICY "delete_own_ai_trader_profile" ON ai_trader_profile FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Behavior Events
CREATE TABLE IF NOT EXISTS ai_behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('risk_change', 'drawdown_change', 'psychology_change', 'behavior_change', 'performance_change', 'streak_change', 'rule_violation', 'milestone')),
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  event_date date NOT NULL,
  metric_value numeric,
  previous_value numeric,
  evidence_refs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_behavior_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_behavior_events_user_idx ON ai_behavior_events (user_id);
CREATE INDEX IF NOT EXISTS ai_behavior_events_workspace_idx ON ai_behavior_events (workspace_id);
CREATE INDEX IF NOT EXISTS ai_behavior_events_date_idx ON ai_behavior_events (event_date);
CREATE INDEX IF NOT EXISTS ai_behavior_events_type_idx ON ai_behavior_events (event_type);
DROP POLICY IF EXISTS "select_own_ai_behavior_events" ON ai_behavior_events;
CREATE POLICY "select_own_ai_behavior_events" ON ai_behavior_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_behavior_events" ON ai_behavior_events;
CREATE POLICY "insert_own_ai_behavior_events" ON ai_behavior_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_behavior_events" ON ai_behavior_events;
CREATE POLICY "delete_own_ai_behavior_events" ON ai_behavior_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Insight Feedback
CREATE TABLE IF NOT EXISTS ai_insight_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  insight_id uuid REFERENCES ai_insights(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('useful', 'not_useful', 'correct', 'incorrect', 'saved', 'dismissed', 'ignored')),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_insight_feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_insight_feedback_user_idx ON ai_insight_feedback (user_id);
CREATE INDEX IF NOT EXISTS ai_insight_feedback_insight_idx ON ai_insight_feedback (insight_id);
DROP POLICY IF EXISTS "select_own_ai_insight_feedback" ON ai_insight_feedback;
CREATE POLICY "select_own_ai_insight_feedback" ON ai_insight_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_insight_feedback" ON ai_insight_feedback;
CREATE POLICY "insert_own_ai_insight_feedback" ON ai_insight_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_insight_feedback" ON ai_insight_feedback;
CREATE POLICY "delete_own_ai_insight_feedback" ON ai_insight_feedback FOR DELETE TO authenticated USING (auth.uid() = user_id);
