/*
  TraderOS backend bootstrap

  This migration is a safety-net to ensure the project schema exists on the live Supabase project.
  It creates the core tables that the app shells, journal, psychology, strategy, risk, and AI modules
  depend on when the earlier migrations were not applied to the remote project.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  full_name text,
  username text,
  avatar_url text,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'elite')),
  timezone text DEFAULT 'UTC',
  preferred_currency text DEFAULT 'USD',
  preferred_language text DEFAULT 'en',
  trading_experience text CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  last_login_at timestamptz,
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'elite')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subscription" ON subscriptions;
CREATE POLICY "insert_own_subscription" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subscription" ON subscriptions;
CREATE POLICY "update_own_subscription" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_subscription" ON subscriptions;
CREATE POLICY "delete_own_subscription" ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Personal',
  workspace_type text NOT NULL DEFAULT 'personal' CHECK (workspace_type IN ('personal', 'team')),
  default_currency text DEFAULT 'USD',
  default_timezone text DEFAULT 'UTC',
  date_format text DEFAULT 'YYYY-MM-DD',
  number_format text DEFAULT 'decimal',
  is_default boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_workspace" ON workspaces;
CREATE POLICY "select_own_workspace" ON workspaces FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workspace" ON workspaces;
CREATE POLICY "insert_own_workspace" ON workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workspace" ON workspaces;
CREATE POLICY "update_own_workspace" ON workspaces FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workspace" ON workspaces;
CREATE POLICY "delete_own_workspace" ON workspaces FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  account_name text NOT NULL,
  broker_name text,
  platform text NOT NULL CHECK (platform IN ('MT4', 'MT5', 'cTrader', 'DXtrade', 'Match-Trader', 'TradingView', 'Manual')),
  account_number text,
  account_type text NOT NULL CHECK (account_type IN ('live', 'demo', 'prop_funded', 'evaluation')),
  base_currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'UTC',
  initial_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_accounts" ON trading_accounts;
CREATE POLICY "select_own_accounts" ON trading_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_accounts" ON trading_accounts;
CREATE POLICY "insert_own_accounts" ON trading_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_accounts" ON trading_accounts;
CREATE POLICY "update_own_accounts" ON trading_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_accounts" ON trading_accounts;
CREATE POLICY "delete_own_accounts" ON trading_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
  screenshots text[] DEFAULT '{}',
  executed_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  setup_type text,
  before_notes text,
  during_notes text,
  after_notes text,
  mistakes text[] DEFAULT '{}',
  lessons_learned text,
  holding_minutes integer,
  market text,
  timeframe text,
  risk_pct numeric,
  archived boolean DEFAULT false,
  broker_trade_id text,
  import_job_id uuid,
  source text,
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_all_trades" ON trades;
CREATE POLICY "select_all_trades" ON trades FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_all_trades" ON trades;
CREATE POLICY "insert_all_trades" ON trades FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_all_trades" ON trades;
CREATE POLICY "update_all_trades" ON trades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_all_trades" ON trades;
CREATE POLICY "delete_all_trades" ON trades FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS trading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS psychology_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS risk_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  max_daily_loss_pct numeric DEFAULT 2,
  max_weekly_loss_pct numeric DEFAULT 5,
  max_monthly_loss_pct numeric DEFAULT 10,
  max_risk_per_trade_pct numeric DEFAULT 1,
  max_open_trades integer DEFAULT 5,
  max_daily_trades integer DEFAULT 5,
  max_position_size_pct numeric DEFAULT 2,
  stop_after_losses integer DEFAULT 3,
  stop_after_daily_loss boolean DEFAULT false,
  warning_threshold_pct numeric DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE risk_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_risk_rules" ON risk_rules;
CREATE POLICY "select_own_risk_rules" ON risk_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_risk_rules" ON risk_rules;
CREATE POLICY "insert_own_risk_rules" ON risk_rules FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_risk_rules" ON risk_rules;
CREATE POLICY "update_own_risk_rules" ON risk_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_risk_rules" ON risk_rules;
CREATE POLICY "delete_own_risk_rules" ON risk_rules FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid,
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

CREATE TABLE IF NOT EXISTS daily_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  journal_date date NOT NULL,
  sleep_quality numeric,
  energy_level numeric,
  emotional_state_pre text,
  confidence_pre numeric,
  stress_level numeric,
  trading_plan text,
  market_bias text,
  goals_today text,
  overall_mood text,
  biggest_mistake text,
  biggest_success text,
  lessons_learned text,
  improvements text,
  followed_plan boolean,
  overall_satisfaction numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_daily_journals" ON daily_journals;
CREATE POLICY "select_own_daily_journals" ON daily_journals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_daily_journals" ON daily_journals;
CREATE POLICY "insert_own_daily_journals" ON daily_journals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_daily_journals" ON daily_journals;
CREATE POLICY "update_own_daily_journals" ON daily_journals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_daily_journals" ON daily_journals;
CREATE POLICY "delete_own_daily_journals" ON daily_journals FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  trades_taken integer DEFAULT 0,
  win_rate numeric,
  biggest_win text,
  biggest_loss text,
  best_decision text,
  worst_decision text,
  psychology_notes text,
  lessons_learned text,
  goals_next_week text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "select_own_weekly_reviews" ON weekly_reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "insert_own_weekly_reviews" ON weekly_reviews FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "update_own_weekly_reviews" ON weekly_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "delete_own_weekly_reviews" ON weekly_reviews FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS monthly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  performance_summary text,
  discipline_review text,
  psychology_review text,
  goal_progress text,
  habit_completion text,
  biggest_improvements text,
  biggest_problems text,
  action_plan text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "select_own_monthly_reviews" ON monthly_reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "insert_own_monthly_reviews" ON monthly_reviews FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "update_own_monthly_reviews" ON monthly_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "delete_own_monthly_reviews" ON monthly_reviews FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_habit_logs" ON habit_logs;
CREATE POLICY "select_own_habit_logs" ON habit_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_habit_logs" ON habit_logs;
CREATE POLICY "insert_own_habit_logs" ON habit_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_habit_logs" ON habit_logs;
CREATE POLICY "update_own_habit_logs" ON habit_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_habit_logs" ON habit_logs;
CREATE POLICY "delete_own_habit_logs" ON habit_logs FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  description text,
  frequency integer DEFAULT 1,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  solution text,
  related_trade_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_mistakes" ON mistakes;
CREATE POLICY "select_own_mistakes" ON mistakes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_mistakes" ON mistakes;
CREATE POLICY "insert_own_mistakes" ON mistakes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_mistakes" ON mistakes;
CREATE POLICY "update_own_mistakes" ON mistakes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_mistakes" ON mistakes;
CREATE POLICY "delete_own_mistakes" ON mistakes FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS trade_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  trade_id uuid NOT NULL,
  why_taken text,
  was_plan_followed boolean,
  setup_quality numeric,
  execution_quality numeric,
  notes text,
  lessons_learned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trade_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_trade_reviews" ON trade_reviews;
CREATE POLICY "select_own_trade_reviews" ON trade_reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_trade_reviews" ON trade_reviews;
CREATE POLICY "insert_own_trade_reviews" ON trade_reviews FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_trade_reviews" ON trade_reviews;
CREATE POLICY "update_own_trade_reviews" ON trade_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_trade_reviews" ON trade_reviews;
CREATE POLICY "delete_own_trade_reviews" ON trade_reviews FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  market text,
  timeframe text,
  description text,
  setup_rules text,
  entry_conditions text,
  exit_conditions text,
  risk_rules text,
  common_mistakes text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'retired')),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_strategies" ON strategies;
CREATE POLICY "select_own_strategies" ON strategies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_strategies" ON strategies;
CREATE POLICY "insert_own_strategies" ON strategies FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_strategies" ON strategies;
CREATE POLICY "update_own_strategies" ON strategies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_strategies" ON strategies;
CREATE POLICY "delete_own_strategies" ON strategies FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS strategy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  change_summary text,
  snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strategy_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_strategy_versions" ON strategy_versions;
CREATE POLICY "select_own_strategy_versions" ON strategy_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_strategy_versions" ON strategy_versions;
CREATE POLICY "insert_own_strategy_versions" ON strategy_versions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_strategy_versions" ON strategy_versions;
CREATE POLICY "update_own_strategy_versions" ON strategy_versions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_strategy_versions" ON strategy_versions;
CREATE POLICY "delete_own_strategy_versions" ON strategy_versions FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS trade_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  market text,
  direction text,
  checklist jsonb DEFAULT '[]',
  setup_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trade_setups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_trade_setups" ON trade_setups;
CREATE POLICY "select_own_trade_setups" ON trade_setups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_trade_setups" ON trade_setups;
CREATE POLICY "insert_own_trade_setups" ON trade_setups FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_trade_setups" ON trade_setups;
CREATE POLICY "update_own_trade_setups" ON trade_setups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_trade_setups" ON trade_setups;
CREATE POLICY "delete_own_trade_setups" ON trade_setups FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  checklist jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_playbooks" ON playbooks;
CREATE POLICY "select_own_playbooks" ON playbooks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_playbooks" ON playbooks;
CREATE POLICY "insert_own_playbooks" ON playbooks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_playbooks" ON playbooks;
CREATE POLICY "update_own_playbooks" ON playbooks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_playbooks" ON playbooks;
CREATE POLICY "delete_own_playbooks" ON playbooks FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_checklists" ON checklist_templates;
CREATE POLICY "select_own_checklists" ON checklist_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_checklists" ON checklist_templates;
CREATE POLICY "insert_own_checklists" ON checklist_templates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_checklists" ON checklist_templates;
CREATE POLICY "update_own_checklists" ON checklist_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_checklists" ON checklist_templates;
CREATE POLICY "delete_own_checklists" ON checklist_templates FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS strategy_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES strategies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  title text,
  url text,
  file_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strategy_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "select_own_strategy_attachments" ON strategy_attachments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "insert_own_strategy_attachments" ON strategy_attachments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "update_own_strategy_attachments" ON strategy_attachments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "delete_own_strategy_attachments" ON strategy_attachments FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  memory_type text,
  topic text,
  content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_memory" ON ai_memory;
CREATE POLICY "select_own_ai_memory" ON ai_memory FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_ai_memory" ON ai_memory;
CREATE POLICY "insert_own_ai_memory" ON ai_memory FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_ai_memory" ON ai_memory;
CREATE POLICY "update_own_ai_memory" ON ai_memory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_ai_memory" ON ai_memory;
CREATE POLICY "delete_own_ai_memory" ON ai_memory FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  title text,
  body text,
  category text,
  priority text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "select_own_ai_recommendations" ON ai_recommendations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "insert_own_ai_recommendations" ON ai_recommendations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "update_own_ai_recommendations" ON ai_recommendations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "delete_own_ai_recommendations" ON ai_recommendations FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  title text,
  pinned boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_conversations" ON ai_conversations;
CREATE POLICY "select_own_ai_conversations" ON ai_conversations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_own_ai_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_ai_conversations" ON ai_conversations;
CREATE POLICY "update_own_ai_conversations" ON ai_conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_own_ai_conversations" ON ai_conversations FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id uuid,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_chat_messages" ON ai_chat_messages;
CREATE POLICY "select_own_ai_chat_messages" ON ai_chat_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_ai_chat_messages" ON ai_chat_messages;
CREATE POLICY "insert_own_ai_chat_messages" ON ai_chat_messages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_ai_chat_messages" ON ai_chat_messages;
CREATE POLICY "update_own_ai_chat_messages" ON ai_chat_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_ai_chat_messages" ON ai_chat_messages;
CREATE POLICY "delete_own_ai_chat_messages" ON ai_chat_messages FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS broker_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  broker_name text,
  account_id text,
  account_type text,
  login text,
  server text,
  status text DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
  auto_sync boolean DEFAULT false,
  last_sync_at timestamptz,
  balance numeric DEFAULT 0,
  equity numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  leverage text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_broker_connections" ON broker_connections;
CREATE POLICY "select_own_broker_connections" ON broker_connections FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_broker_connections" ON broker_connections;
CREATE POLICY "insert_own_broker_connections" ON broker_connections FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_broker_connections" ON broker_connections;
CREATE POLICY "update_own_broker_connections" ON broker_connections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_broker_connections" ON broker_connections;
CREATE POLICY "delete_own_broker_connections" ON broker_connections FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS open_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  broker_connection_id uuid REFERENCES broker_connections(id) ON DELETE SET NULL,
  instrument text,
  direction text CHECK (direction IN ('long', 'short')),
  volume numeric,
  entry_price numeric,
  current_price numeric,
  stop_loss numeric,
  take_profit numeric,
  swap numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  floating_pnl numeric DEFAULT 0,
  opened_at timestamptz DEFAULT now()
);

ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_open_positions" ON open_positions;
CREATE POLICY "select_own_open_positions" ON open_positions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_open_positions" ON open_positions;
CREATE POLICY "insert_own_open_positions" ON open_positions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_open_positions" ON open_positions;
CREATE POLICY "update_own_open_positions" ON open_positions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_open_positions" ON open_positions;
CREATE POLICY "delete_own_open_positions" ON open_positions FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  trading_account_id uuid,
  broker_name text,
  source_format text,
  file_name text,
  file_size bigint,
  status text CHECK (status IN ('pending', 'validating', 'importing', 'completed', 'failed', 'cancelled')),
  total_rows integer DEFAULT 0,
  imported_rows integer DEFAULT 0,
  skipped_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  progress numeric DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_import_jobs" ON import_jobs;
CREATE POLICY "select_own_import_jobs" ON import_jobs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_import_jobs" ON import_jobs;
CREATE POLICY "insert_own_import_jobs" ON import_jobs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_import_jobs" ON import_jobs;
CREATE POLICY "update_own_import_jobs" ON import_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_import_jobs" ON import_jobs;
CREATE POLICY "delete_own_import_jobs" ON import_jobs FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number integer,
  row_data jsonb,
  error_type text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_import_errors" ON import_errors;
CREATE POLICY "select_own_import_errors" ON import_errors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_import_errors" ON import_errors;
CREATE POLICY "insert_own_import_errors" ON import_errors FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_import_errors" ON import_errors;
CREATE POLICY "update_own_import_errors" ON import_errors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_import_errors" ON import_errors;
CREATE POLICY "delete_own_import_errors" ON import_errors FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text,
  trigger_config jsonb DEFAULT '{}',
  action_type text,
  action_config jsonb DEFAULT '{}',
  status text DEFAULT 'enabled' CHECK (status IN ('enabled', 'paused', 'disabled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_automations" ON automations;
CREATE POLICY "select_own_automations" ON automations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_automations" ON automations;
CREATE POLICY "insert_own_automations" ON automations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_automations" ON automations;
CREATE POLICY "update_own_automations" ON automations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_automations" ON automations;
CREATE POLICY "delete_own_automations" ON automations FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES automations(id) ON DELETE CASCADE,
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  executed_at timestamptz DEFAULT now(),
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
  payload jsonb DEFAULT '{}'
);

ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_automation_executions" ON automation_executions;
CREATE POLICY "select_own_automation_executions" ON automation_executions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_automation_executions" ON automation_executions;
CREATE POLICY "insert_own_automation_executions" ON automation_executions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_automation_executions" ON automation_executions;
CREATE POLICY "update_own_automation_executions" ON automation_executions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_automation_executions" ON automation_executions;
CREATE POLICY "delete_own_automation_executions" ON automation_executions FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  read boolean DEFAULT false,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  email_alerts boolean DEFAULT true,
  push_alerts boolean DEFAULT true,
  digest_frequency text DEFAULT 'daily',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notification_preferences" ON notification_preferences;
CREATE POLICY "select_own_notification_preferences" ON notification_preferences FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_notification_preferences" ON notification_preferences;
CREATE POLICY "insert_own_notification_preferences" ON notification_preferences FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_own_notification_preferences" ON notification_preferences;
CREATE POLICY "update_own_notification_preferences" ON notification_preferences FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_own_notification_preferences" ON notification_preferences;
CREATE POLICY "delete_own_notification_preferences" ON notification_preferences FOR DELETE TO authenticated USING (true);
