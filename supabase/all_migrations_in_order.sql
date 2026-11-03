-- Combined migration file. Original migration files are unchanged.
-- Files are included in lexicographic filename order.

-- ===== 01: 20260718175116_create_trades_and_journal.sql =====

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

-- ===== 02: 20260718182142_add_brokers_and_positions.sql =====

/*
# TraderOS: Broker Connections & Open Positions

## Overview
Adds tables for broker account connections (auto-sync) and tracks open positions separately from closed trades.

## New Tables
1. `broker_connections` — connected trading accounts (MT4/MT5/cTrader/DXtrade/MatchTrader/Binance/Bybit/OANDA/IBKR etc.). Stores status, sync state, last sync time, and balance.
2. `open_positions` — live open positions synced from broker connections, separate from the closed `trades` table.

## Security
- RLS enabled on both tables.
- Single-tenant: anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS broker_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_name text NOT NULL,
  account_id text,
  account_type text CHECK (account_type IN ('live', 'demo', 'prop')),
  login text,
  server text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
  auto_sync boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  balance numeric DEFAULT 0,
  equity numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  leverage text DEFAULT '1:30',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_brokers" ON broker_connections;
CREATE POLICY "anon_select_brokers" ON broker_connections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_brokers" ON broker_connections;
CREATE POLICY "anon_insert_brokers" ON broker_connections FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_brokers" ON broker_connections;
CREATE POLICY "anon_update_brokers" ON broker_connections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_brokers" ON broker_connections;
CREATE POLICY "anon_delete_brokers" ON broker_connections FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS open_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE,
  instrument text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('long', 'short')),
  volume numeric NOT NULL,
  entry_price numeric NOT NULL,
  current_price numeric NOT NULL,
  stop_loss numeric,
  take_profit numeric,
  swap numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  floating_pnl numeric NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_positions" ON open_positions;
CREATE POLICY "anon_select_positions" ON open_positions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_positions" ON open_positions;
CREATE POLICY "anon_insert_positions" ON open_positions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_positions" ON open_positions;
CREATE POLICY "anon_update_positions" ON open_positions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_positions" ON open_positions;
CREATE POLICY "anon_delete_positions" ON open_positions FOR DELETE TO anon, authenticated USING (true);

-- ===== 03: 20260718183930_add_profiles_subscriptions.sql =====

/*
# TraderOS: User Profiles & Subscriptions

## Overview
Adds owner-scoped tables for user accounts and subscription plans. Auth uses Supabase's built-in `auth.users` table (email/password + Google OAuth). Trading data tables remain shared demo data (anon+authenticated) so the app remains browsable without sign-in; profiles and subscriptions are owner-scoped.

## New Tables
1. `profiles` — display name, avatar URL, plan tier, linked to auth.users. Owner-scoped.
2. `subscriptions` — subscription plan, status, billing period, linked to auth.users. Owner-scoped.

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD: `TO authenticated` with `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so inserts from the authenticated client succeed without explicitly passing the owner.
*/
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  avatar_url text,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'elite')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'elite')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sub" ON subscriptions;
CREATE POLICY "select_own_sub" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sub" ON subscriptions;
CREATE POLICY "insert_own_sub" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sub" ON subscriptions;
CREATE POLICY "update_own_sub" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sub" ON subscriptions;
CREATE POLICY "delete_own_sub" ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 04: 20260719073239_create_email_signups.sql =====

/*
# Create email_signups table

## Overview
Stores every user signup email with metadata for CRM, analytics, and Google Sheets sync.
This table is separate from auth.users so it can hold pre-signup intent emails, signup timestamps,
referral source, and sync status with external tools like Google Sheets.

## New Tables
1. `email_signups`
   - `id` (uuid, primary key)
   - `email` (text, unique, not null) — the user's email address
   - `display_name` (text) — optional name provided at signup
   - `user_id` (uuid, nullable) — linked to auth.users once account is created
   - `source` (text) — where the signup came from (e.g. "signup_form", "google_oauth")
   - `plan_interest` (text) — which plan the user expressed interest in
   - `sheets_synced` (boolean) — whether this row has been pushed to Google Sheets
   - `sheets_synced_at` (timestamptz) — when it was last synced to Google Sheets
   - `created_at` (timestamptz)

## Security
- RLS enabled.
- Anon INSERT allowed (to capture email intent before sign-in).
- Service role only for SELECT/UPDATE/DELETE (admin access only).
- Authenticated users can read their own row.
*/

CREATE TABLE IF NOT EXISTS email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'signup_form',
  plan_interest text,
  sheets_synced boolean NOT NULL DEFAULT false,
  sheets_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_signups_email ON email_signups(email);
CREATE INDEX IF NOT EXISTS idx_email_signups_user_id ON email_signups(user_id);
CREATE INDEX IF NOT EXISTS idx_email_signups_sheets_synced ON email_signups(sheets_synced);

ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon included) to insert their own email
DROP POLICY IF EXISTS "anon_insert_email_signup" ON email_signups;
CREATE POLICY "anon_insert_email_signup" ON email_signups
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read their own row by email
DROP POLICY IF EXISTS "auth_select_own_signup" ON email_signups;
CREATE POLICY "auth_select_own_signup" ON email_signups
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ===== 05: 20260719083014_add_achievements_and_chat.sql =====

/*
# Add achievements/gamification + AI chat messages

## New Tables
1. `achievements` - Tracks earned badges/awards per user
2. `ai_chat_messages` - Stores AI chat history per user session

## Trade Table Enhancements
- Add `mistakes`, `lessons_learned`, `setup_type`, `before_notes`, `during_notes`, `after_notes`, `screenshots`
*/

-- ─── Enhance trades with journaling fields ───────────────────────────────────
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS setup_type text,
  ADD COLUMN IF NOT EXISTS before_notes text,
  ADD COLUMN IF NOT EXISTS during_notes text,
  ADD COLUMN IF NOT EXISTS after_notes text,
  ADD COLUMN IF NOT EXISTS mistakes text[],
  ADD COLUMN IF NOT EXISTS lessons_learned text,
  ADD COLUMN IF NOT EXISTS screenshots text[],
  ADD COLUMN IF NOT EXISTS holding_minutes integer;

-- ─── Achievements table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Trophy',
  category text NOT NULL DEFAULT 'general',
  earned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_achievements" ON achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_achievements" ON achievements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── AI chat messages table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON ai_chat_messages(session_id);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_chat" ON ai_chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_chat" ON ai_chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_chat" ON ai_chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== 06: 20260804093226_add_user_management_columns.sql.sql =====

/*
# TraderOS: User Management Profile Columns

## Overview
Extends the existing `profiles` table with user management fields needed for
the Authentication & User Management phase. No new tables are created — only
additive columns on `profiles`. All existing columns and data are preserved.

## Changes to `profiles` table
- `full_name` (text, nullable) — user's full name, distinct from display_name
- `username` (text, nullable, unique) — optional unique username
- `timezone` (text, nullable) — preferred timezone (e.g. "America/New_York")
- `preferred_currency` (text, default 'USD') — preferred display currency
- `preferred_language` (text, default 'en') — preferred UI language code
- `trading_experience` (text, nullable) — experience level (beginner/intermediate/advanced/expert)
- `last_login_at` (timestamptz, nullable) — timestamp of last login
- `account_status` (text, default 'active') — account status (active/suspended/deleted)
- `deleted_at` (timestamptz, nullable) — soft-delete timestamp; null means active

## Security
- RLS already enabled on `profiles` — no changes needed.
- Existing owner-scoped CRUD policies remain in place.
- No new policies required — the existing `update_own_profile` policy already
  allows users to update their own row, which covers the new columns.

## Notes
1. All columns are additive — no existing column is modified or dropped.
2. `username` has a unique constraint but is nullable (users not required to set one).
3. `account_status` defaults to 'active'; soft-delete sets `deleted_at` and
   changes status to 'deleted' without removing the row.
4. `last_login_at` is updated by the frontend on successful sign-in.
*/
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
    ALTER TABLE profiles ADD COLUMN timezone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_currency') THEN
    ALTER TABLE profiles ADD COLUMN preferred_currency text NOT NULL DEFAULT 'USD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text NOT NULL DEFAULT 'en';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trading_experience') THEN
    ALTER TABLE profiles ADD COLUMN trading_experience text CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE profiles ADD COLUMN account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
    ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- Unique constraint on username (nullable, so multiple NULLs are allowed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_unique') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;

-- ===== 07: 20260804094220_create_workspaces_trading_accounts.sql.sql =====

/*
# TraderOS: Workspaces & Trading Accounts

## Overview
Creates two new owner-scoped tables: `workspaces` and `trading_accounts`.
Each user gets a personal workspace (auto-created on first sign-in), and within
each workspace they can manage multiple trading accounts across different
brokers, prop firms, exchanges, and demo accounts.

## New Tables

### 1. `workspaces`
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users, defaults to auth.uid()) — owner
- `name` (text, default 'Personal') — workspace display name
- `workspace_type` (text, default 'personal') — 'personal' or 'team' (future)
- `default_currency` (text, default 'USD')
- `default_timezone` (text, default 'auto')
- `date_format` (text, default 'MMM D, YYYY')
- `number_format` (text, default 'en-US')
- `is_default` (boolean, default true) — first workspace is default
- `created_at`, `updated_at` (timestamptz)

### 2. `trading_accounts`
- `id` (uuid, PK)
- `workspace_id` (uuid, FK workspaces, ON DELETE CASCADE)
- `user_id` (uuid, FK auth.users, defaults to auth.uid()) — owner for direct RLS
- `account_name` (text, not null)
- `broker_name` (text, nullable) — broker or prop firm name
- `platform` (text, not null) — MT4, MT5, cTrader, DXtrade, Match-Trader, TradingView, Manual
- `account_number` (text, nullable)
- `account_type` (text, not null) — live, demo, prop_funded, evaluation
- `base_currency` (text, default 'USD')
- `timezone` (text, default 'auto')
- `initial_balance` (numeric, default 0)
- `current_balance` (numeric, default 0)
- `status` (text, default 'active') — active, archived, closed
- `is_default` (boolean, default false)
- `notes` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD: `TO authenticated` with `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` on both tables so inserts from the
  authenticated client succeed without explicitly passing the owner.
- trading_accounts also checks workspace ownership via FK cascade.

## Notes
1. All columns are additive — no existing tables are modified.
2. The `workspace_type` field is 'personal' now and 'team' is reserved for
   future team collaboration (no team logic implemented this phase).
3. `is_default` on trading_accounts marks the default account for manual
   trade entry, journal, and dashboard (future phases).
4. Archiving sets `status = 'archived'` without deleting the row.
*/
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text NOT NULL DEFAULT 'Personal',
  workspace_type text NOT NULL DEFAULT 'personal' CHECK (workspace_type IN ('personal', 'team')),
  default_currency text NOT NULL DEFAULT 'USD',
  default_timezone text NOT NULL DEFAULT 'auto',
  date_format text NOT NULL DEFAULT 'MMM D, YYYY',
  number_format text NOT NULL DEFAULT 'en-US',
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_workspace" ON workspaces;
CREATE POLICY "select_own_workspace" ON workspaces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_workspace" ON workspaces;
CREATE POLICY "insert_own_workspace" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workspace" ON workspaces;
CREATE POLICY "update_own_workspace" ON workspaces FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workspace" ON workspaces;
CREATE POLICY "delete_own_workspace" ON workspaces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  broker_name text,
  platform text NOT NULL CHECK (platform IN ('MT4', 'MT5', 'cTrader', 'DXtrade', 'Match-Trader', 'TradingView', 'Manual')),
  account_number text,
  account_type text NOT NULL CHECK (account_type IN ('live', 'demo', 'prop_funded', 'evaluation')),
  base_currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'auto',
  initial_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trading_account" ON trading_accounts;
CREATE POLICY "select_own_trading_account" ON trading_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trading_account" ON trading_accounts;
CREATE POLICY "insert_own_trading_account" ON trading_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trading_account" ON trading_accounts;
CREATE POLICY "update_own_trading_account" ON trading_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trading_account" ON trading_accounts;
CREATE POLICY "delete_own_trading_account" ON trading_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_workspace ON trading_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON trading_accounts(status);

-- ===== 08: 20260806085157_add_trade_tags_and_extended_fields.sql.sql =====

/*
# TraderOS: Trade Tags & Extended Trade Fields

## Overview
Adds a `trade_tags` table for user-created custom tags and extends the
existing `trades` table with columns needed for comprehensive manual trade
management: market, timeframe, risk percentage, and archive support.

## New Tables

### 1. `trade_tags`
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users, defaults to auth.uid())
- `name` (text, not null)
- `color` (text, default 'default') — for UI display
- `created_at` (timestamptz)
- Unique constraint on (user_id, name) — no duplicate tags per user

## Changes to `trades` table (all additive)
- `market` (text, nullable) — e.g. "Forex", "Crypto", "Stocks", "Futures"
- `timeframe` (text, nullable) — e.g. "1m", "5m", "15m", "1H", "4H", "1D"
- `risk_pct` (numeric, nullable) — risk percentage for the trade
- `archived` (boolean, default false) — soft-archive flag

## Security
- RLS enabled on `trade_tags` with owner-scoped CRUD (TO authenticated, auth.uid() = user_id).
- `trades` table already has RLS with anon+authenticated policies — no changes needed.

## Notes
1. All columns are additive — no existing data is modified or lost.
2. `trade_tags` is owner-scoped so each user manages their own tag library.
3. `archived` on trades allows soft-archiving without deletion.
*/
CREATE TABLE IF NOT EXISTS trade_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE trade_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trade_tags" ON trade_tags;
CREATE POLICY "select_own_trade_tags" ON trade_tags FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trade_tags" ON trade_tags;
CREATE POLICY "insert_own_trade_tags" ON trade_tags FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trade_tags" ON trade_tags;
CREATE POLICY "update_own_trade_tags" ON trade_tags FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trade_tags" ON trade_tags;
CREATE POLICY "delete_own_trade_tags" ON trade_tags FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Extend trades table with additive columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'market') THEN
    ALTER TABLE trades ADD COLUMN market text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'timeframe') THEN
    ALTER TABLE trades ADD COLUMN timeframe text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'risk_pct') THEN
    ALTER TABLE trades ADD COLUMN risk_pct numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'archived') THEN
    ALTER TABLE trades ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trade_tags_user ON trade_tags(user_id);

-- ===== 09: 20260806090059_add_import_infrastructure.sql.sql =====

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

-- ===== 10: 20260807061659_create_risk_rules_and_alerts.sql =====

/*
# Create Risk Rules and Risk Alerts tables

1. New Tables
- `risk_rules`: Stores user-configurable risk management rules per workspace.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `workspace_id` (uuid, not null, references workspaces)
  - `max_daily_loss_pct` (numeric, max daily loss as % of account, nullable)
  - `max_weekly_loss_pct` (numeric, max weekly loss as % of account, nullable)
  - `max_monthly_loss_pct` (numeric, max monthly loss as % of account, nullable)
  - `max_risk_per_trade_pct` (numeric, max risk per trade as %, nullable)
  - `max_open_trades` (integer, max concurrent open trades, nullable)
  - `max_daily_trades` (integer, max trades per day, nullable)
  - `max_position_size_pct` (numeric, max position size as % of account, nullable)
  - `stop_after_losses` (integer, stop trading after X consecutive losses, nullable)
  - `stop_after_daily_loss` (boolean, stop trading after daily loss limit hit, default false)
  - `warning_threshold_pct` (numeric, warning threshold as % of limit, default 80)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `risk_alerts`: Stores generated risk alerts.
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `workspace_id` (uuid, not null, references workspaces)
  - `alert_type` (text, not null)
  - `severity` (text, not null: 'info' | 'warning' | 'critical')
  - `title` (text, not null)
  - `message` (text, not null)
  - `metric_value` (numeric, nullable)
  - `threshold_value` (numeric, nullable)
  - `acknowledged` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own (user_id = auth.uid()).

3. Notes
- One risk_rules row per workspace (enforced by unique constraint on workspace_id).
- risk_alerts are append-only history; acknowledged flag lets users dismiss alerts.
*/

CREATE TABLE IF NOT EXISTS risk_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  max_daily_loss_pct numeric DEFAULT 3,
  max_weekly_loss_pct numeric DEFAULT 6,
  max_monthly_loss_pct numeric DEFAULT 10,
  max_risk_per_trade_pct numeric DEFAULT 2,
  max_open_trades integer DEFAULT 5,
  max_daily_trades integer DEFAULT 10,
  max_position_size_pct numeric DEFAULT 10,
  stop_after_losses integer DEFAULT 3,
  stop_after_daily_loss boolean DEFAULT true,
  warning_threshold_pct numeric DEFAULT 80,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE risk_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_risk_rules" ON risk_rules;
CREATE POLICY "select_own_risk_rules" ON risk_rules FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_risk_rules" ON risk_rules;
CREATE POLICY "insert_own_risk_rules" ON risk_rules FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_risk_rules" ON risk_rules;
CREATE POLICY "update_own_risk_rules" ON risk_rules FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_risk_rules" ON risk_rules;
CREATE POLICY "delete_own_risk_rules" ON risk_rules FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS risk_rules_workspace_unique ON risk_rules (workspace_id);

CREATE TABLE IF NOT EXISTS risk_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text NOT NULL,
  metric_value numeric,
  threshold_value numeric,
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_risk_alerts" ON risk_alerts;
CREATE POLICY "select_own_risk_alerts" ON risk_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_risk_alerts" ON risk_alerts;
CREATE POLICY "insert_own_risk_alerts" ON risk_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_risk_alerts" ON risk_alerts;
CREATE POLICY "update_own_risk_alerts" ON risk_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_risk_alerts" ON risk_alerts;
CREATE POLICY "delete_own_risk_alerts" ON risk_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS risk_alerts_user_created_idx ON risk_alerts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS risk_alerts_workspace_idx ON risk_alerts (workspace_id);

-- ===== 11: 20260808062136_create_psychology_journal_tables.sql =====

/*
# Create Psychology & Journal tables

1. New Tables
- `daily_journals`: Daily pre/post trading journal entries.
- `weekly_reviews`: Weekly review entries.
- `monthly_reviews`: Monthly review entries.
- `habits`: Recurring trading habits.
- `habit_logs`: Daily habit completion logs.
- `mistakes`: User's mistake library.
- `trade_reviews`: Structured per-trade review.
- `custom_emotions`: User-defined emotion tags.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).

3. Notes
- All tables have user_id DEFAULT auth.uid() for seamless inserts.
*/

-- Daily Journals
CREATE TABLE IF NOT EXISTS daily_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  journal_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  emotional_state_pre text,
  confidence_pre integer CHECK (confidence_pre >= 1 AND confidence_pre <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  trading_plan text,
  market_bias text,
  goals_today text,
  overall_mood text,
  biggest_mistake text,
  biggest_success text,
  lessons_learned text,
  improvements text,
  followed_plan boolean DEFAULT null,
  overall_satisfaction integer CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE daily_journals ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS daily_journals_user_date_unique ON daily_journals (user_id, journal_date);
DROP POLICY IF EXISTS "select_own_daily_journals" ON daily_journals;
CREATE POLICY "select_own_daily_journals" ON daily_journals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_daily_journals" ON daily_journals;
CREATE POLICY "insert_own_daily_journals" ON daily_journals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_daily_journals" ON daily_journals;
CREATE POLICY "update_own_daily_journals" ON daily_journals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_daily_journals" ON daily_journals;
CREATE POLICY "delete_own_daily_journals" ON daily_journals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Weekly Reviews
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  trades_taken integer DEFAULT 0,
  win_rate numeric DEFAULT 0,
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
CREATE UNIQUE INDEX IF NOT EXISTS weekly_reviews_user_week_unique ON weekly_reviews (user_id, week_start);
DROP POLICY IF EXISTS "select_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "select_own_weekly_reviews" ON weekly_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "insert_own_weekly_reviews" ON weekly_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "update_own_weekly_reviews" ON weekly_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "delete_own_weekly_reviews" ON weekly_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Monthly Reviews
CREATE TABLE IF NOT EXISTS monthly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE UNIQUE INDEX IF NOT EXISTS monthly_reviews_user_month_unique ON monthly_reviews (user_id, month_year);
DROP POLICY IF EXISTS "select_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "select_own_monthly_reviews" ON monthly_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "insert_own_monthly_reviews" ON monthly_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "update_own_monthly_reviews" ON monthly_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "delete_own_monthly_reviews" ON monthly_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'daily',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_user_habit_date_unique ON habit_logs (user_id, habit_id, log_date);
DROP POLICY IF EXISTS "select_own_habit_logs" ON habit_logs;
CREATE POLICY "select_own_habit_logs" ON habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habit_logs" ON habit_logs;
CREATE POLICY "insert_own_habit_logs" ON habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habit_logs" ON habit_logs;
CREATE POLICY "update_own_habit_logs" ON habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habit_logs" ON habit_logs;
CREATE POLICY "delete_own_habit_logs" ON habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mistakes
CREATE TABLE IF NOT EXISTS mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  frequency integer DEFAULT 1,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity = ANY (ARRAY['low', 'medium', 'high', 'critical'])),
  solution text,
  related_trade_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_mistakes" ON mistakes;
CREATE POLICY "select_own_mistakes" ON mistakes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_mistakes" ON mistakes;
CREATE POLICY "insert_own_mistakes" ON mistakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_mistakes" ON mistakes;
CREATE POLICY "update_own_mistakes" ON mistakes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_mistakes" ON mistakes;
CREATE POLICY "delete_own_mistakes" ON mistakes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trade Reviews
CREATE TABLE IF NOT EXISTS trade_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  why_taken text,
  followed_setup boolean DEFAULT null,
  respected_risk boolean DEFAULT null,
  entered_early boolean DEFAULT null,
  exited_early boolean DEFAULT null,
  improvements text,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trade_reviews ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS trade_reviews_trade_unique ON trade_reviews (trade_id);
DROP POLICY IF EXISTS "select_own_trade_reviews" ON trade_reviews;
CREATE POLICY "select_own_trade_reviews" ON trade_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_trade_reviews" ON trade_reviews;
CREATE POLICY "insert_own_trade_reviews" ON trade_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_trade_reviews" ON trade_reviews;
CREATE POLICY "update_own_trade_reviews" ON trade_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_trade_reviews" ON trade_reviews;
CREATE POLICY "delete_own_trade_reviews" ON trade_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Custom Emotions
CREATE TABLE IF NOT EXISTS custom_emotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE custom_emotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_custom_emotions" ON custom_emotions;
CREATE POLICY "select_own_custom_emotions" ON custom_emotions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_custom_emotions" ON custom_emotions;
CREATE POLICY "insert_own_custom_emotions" ON custom_emotions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_custom_emotions" ON custom_emotions;
CREATE POLICY "delete_own_custom_emotions" ON custom_emotions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 12: 20260902050053_create_strategy_management_tables.sql =====

/*
# Create Strategy Management tables

1. New Tables
- `strategies`: Trading strategies with rules, conditions, and metadata.
- `strategy_versions`: Version history for strategies (track changes).
- `trade_setups`: Setups belonging to a strategy (entry patterns, confirmations, etc.).
- `playbooks`: Trading playbooks with checklists and golden rules.
- `checklist_templates`: Reusable checklist templates with items.
- `strategy_attachments`: File attachments (images, PDFs, links) for strategies.
- `strategy_categories`: Custom strategy categories.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Strategies link to trades via existing `strategy_tags` and `setup_type` columns on trades table.
- Version history tracks changes with version numbers and change summaries.
- Attachments support file URLs (uploaded to Supabase Storage) and external links.
*/

-- Strategies
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Scalping',
  description text,
  market text,
  instrument_type text,
  timeframe text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing', 'archived')),
  market_conditions text,
  entry_conditions text,
  exit_conditions text,
  risk_rules text,
  position_rules text,
  advantages text,
  weaknesses text,
  common_mistakes text,
  improvements text,
  tags text[] DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS strategies_workspace_idx ON strategies (workspace_id);
CREATE INDEX IF NOT EXISTS strategies_user_idx ON strategies (user_id);
DROP POLICY IF EXISTS "select_own_strategies" ON strategies;
CREATE POLICY "select_own_strategies" ON strategies FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategies" ON strategies;
CREATE POLICY "insert_own_strategies" ON strategies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_strategies" ON strategies;
CREATE POLICY "update_own_strategies" ON strategies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategies" ON strategies;
CREATE POLICY "delete_own_strategies" ON strategies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Strategy Versions
CREATE TABLE IF NOT EXISTS strategy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  change_summary text,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_versions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS strategy_versions_strategy_idx ON strategy_versions (strategy_id);
DROP POLICY IF EXISTS "select_own_strategy_versions" ON strategy_versions;
CREATE POLICY "select_own_strategy_versions" ON strategy_versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategy_versions" ON strategy_versions;
CREATE POLICY "insert_own_strategy_versions" ON strategy_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategy_versions" ON strategy_versions;
CREATE POLICY "delete_own_strategy_versions" ON strategy_versions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trade Setups
CREATE TABLE IF NOT EXISTS trade_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  setup_type text,
  entry_pattern text,
  confirmation_rules text,
  invalidation_rules text,
  preferred_session text,
  preferred_market text,
  screenshot_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trade_setups ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trade_setups_strategy_idx ON trade_setups (strategy_id);
DROP POLICY IF EXISTS "select_own_trade_setups" ON trade_setups;
CREATE POLICY "select_own_trade_setups" ON trade_setups FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_trade_setups" ON trade_setups;
CREATE POLICY "insert_own_trade_setups" ON trade_setups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_trade_setups" ON trade_setups;
CREATE POLICY "update_own_trade_setups" ON trade_setups FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_trade_setups" ON trade_setups;
CREATE POLICY "delete_own_trade_setups" ON trade_setups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Playbooks
CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES strategies(id) ON DELETE SET NULL,
  name text NOT NULL,
  market_preparation text,
  entry_checklist text[],
  risk_checklist text[],
  exit_checklist text[],
  post_trade_checklist text[],
  common_mistakes text[],
  golden_rules text[],
  example_chart_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS playbooks_workspace_idx ON playbooks (workspace_id);
DROP POLICY IF EXISTS "select_own_playbooks" ON playbooks;
CREATE POLICY "select_own_playbooks" ON playbooks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_playbooks" ON playbooks;
CREATE POLICY "insert_own_playbooks" ON playbooks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_playbooks" ON playbooks;
CREATE POLICY "update_own_playbooks" ON playbooks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_playbooks" ON playbooks;
CREATE POLICY "delete_own_playbooks" ON playbooks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  checklist_type text NOT NULL DEFAULT 'before_entry' CHECK (checklist_type IN ('before_entry', 'after_exit', 'pre_market', 'risk_check', 'custom')),
  items text[] NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS checklist_templates_workspace_idx ON checklist_templates (workspace_id);
DROP POLICY IF EXISTS "select_own_checklist_templates" ON checklist_templates;
CREATE POLICY "select_own_checklist_templates" ON checklist_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_checklist_templates" ON checklist_templates;
CREATE POLICY "insert_own_checklist_templates" ON checklist_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_checklist_templates" ON checklist_templates;
CREATE POLICY "update_own_checklist_templates" ON checklist_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_checklist_templates" ON checklist_templates;
CREATE POLICY "delete_own_checklist_templates" ON checklist_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Strategy Attachments
CREATE TABLE IF NOT EXISTS strategy_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  attachment_type text NOT NULL DEFAULT 'image' CHECK (attachment_type IN ('image', 'pdf', 'note', 'link')),
  title text,
  file_url text,
  external_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS strategy_attachments_strategy_idx ON strategy_attachments (strategy_id);
DROP POLICY IF EXISTS "select_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "select_own_strategy_attachments" ON strategy_attachments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "insert_own_strategy_attachments" ON strategy_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "delete_own_strategy_attachments" ON strategy_attachments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Strategy Categories
CREATE TABLE IF NOT EXISTS strategy_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_categories ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS strategy_categories_user_name_unique ON strategy_categories (user_id, name);
DROP POLICY IF EXISTS "select_own_strategy_categories" ON strategy_categories;
CREATE POLICY "select_own_strategy_categories" ON strategy_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategy_categories" ON strategy_categories;
CREATE POLICY "insert_own_strategy_categories" ON strategy_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategy_categories" ON strategy_categories;
CREATE POLICY "delete_own_strategy_categories" ON strategy_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 13: 20260904042610_create_ai_intelligence_tables.sql =====

/*
# Create AI Intelligence tables

1. New Tables
- `ai_conversations`: Chat conversation sessions with titles, pins, and search.
- `ai_memory`: Long-term memory entries (strategies, habits, mistakes, preferences, etc.).
- `ai_reviews`: Structured AI reviews (trade, psychology, goal, weekly, monthly).
- `ai_scores`: Trading, psychology, and discipline scores over time.
- `ai_recommendations`: Personalized, data-backed AI recommendations.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Reuses existing `ai_chat_messages` table for conversation messages (joined by session_id).
- `ai_conversations` provides metadata (title, pin) for each session_id.
- Memory is persistent; conversations are ephemeral and can be deleted.
*/

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_conversations_user_idx ON ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_session_idx ON ai_conversations (session_id);
DROP POLICY IF EXISTS "select_own_ai_conversations" ON ai_conversations;
CREATE POLICY "select_own_ai_conversations" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_own_ai_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_conversations" ON ai_conversations;
CREATE POLICY "update_own_ai_conversations" ON ai_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_own_ai_conversations" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Memory
CREATE TABLE IF NOT EXISTS ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  memory_type text NOT NULL DEFAULT 'observation' CHECK (memory_type IN ('strategy', 'habit', 'mistake', 'goal', 'preference', 'style', 'observation', 'rule')),
  key text NOT NULL,
  value text NOT NULL,
  source text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_memory_user_idx ON ai_memory (user_id);
CREATE INDEX IF NOT EXISTS ai_memory_type_idx ON ai_memory (memory_type);
DROP POLICY IF EXISTS "select_own_ai_memory" ON ai_memory;
CREATE POLICY "select_own_ai_memory" ON ai_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_memory" ON ai_memory;
CREATE POLICY "insert_own_ai_memory" ON ai_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_memory" ON ai_memory;
CREATE POLICY "delete_own_ai_memory" ON ai_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Reviews
CREATE TABLE IF NOT EXISTS ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  review_type text NOT NULL CHECK (review_type IN ('trade', 'psychology', 'goal', 'weekly', 'monthly', 'daily')),
  ref_id uuid,
  title text,
  summary text,
  strengths text[],
  weaknesses text[],
  recommendations text[],
  rating integer CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_reviews_user_idx ON ai_reviews (user_id);
CREATE INDEX IF NOT EXISTS ai_reviews_type_idx ON ai_reviews (review_type);
DROP POLICY IF EXISTS "select_own_ai_reviews" ON ai_reviews;
CREATE POLICY "select_own_ai_reviews" ON ai_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_reviews" ON ai_reviews;
CREATE POLICY "insert_own_ai_reviews" ON ai_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_reviews" ON ai_reviews;
CREATE POLICY "delete_own_ai_reviews" ON ai_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Scores
CREATE TABLE IF NOT EXISTS ai_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  score_type text NOT NULL CHECK (score_type IN ('trading', 'psychology', 'discipline', 'risk', 'overall')),
  score numeric NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  breakdown jsonb,
  period text DEFAULT 'current',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_scores_user_idx ON ai_scores (user_id);
CREATE INDEX IF NOT EXISTS ai_scores_type_idx ON ai_scores (score_type);
DROP POLICY IF EXISTS "select_own_ai_scores" ON ai_scores;
CREATE POLICY "select_own_ai_scores" ON ai_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_scores" ON ai_scores;
CREATE POLICY "insert_own_ai_scores" ON ai_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_scores" ON ai_scores;
CREATE POLICY "delete_own_ai_scores" ON ai_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('risk', 'psychology', 'discipline', 'strategy', 'habit', 'goal', 'general')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  body text NOT NULL,
  data_ref text,
  action_taken boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_recommendations_user_idx ON ai_recommendations (user_id);
DROP POLICY IF EXISTS "select_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "select_own_ai_recommendations" ON ai_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "insert_own_ai_recommendations" ON ai_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "update_own_ai_recommendations" ON ai_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "delete_own_ai_recommendations" ON ai_recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 14: 20260905051115_add_ai_decision_intelligence_tables.sql =====

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

-- ===== 15: 20260906061512_create_reports_tables.sql =====

/*
# Create Reports & Performance Review Tables

1. New Tables
- `report_templates`: Reusable report templates with type, filters, sections, and schedule settings.
- `report_history`: Generated report records with name, type, period, account, status, and export data.
- `scheduled_reports`: Scheduled report generation with frequency, template, and delivery preferences.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Reuses existing analytics, risk, psychology, and strategy calculations.
- Report templates store filter configuration and section selection for reuse.
- Report history stores metadata about each generated report (not the full report content — reports are regenerated from templates + data).
- Scheduled reports reference templates and store frequency/delivery preferences.
*/

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  report_type text NOT NULL CHECK (report_type IN ('performance', 'trade', 'risk', 'psychology', 'strategy', 'journal', 'account', 'ai_review', 'custom')),
  filters jsonb DEFAULT '{}'::jsonb,
  sections text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS report_templates_user_idx ON report_templates (user_id);
CREATE INDEX IF NOT EXISTS report_templates_workspace_idx ON report_templates (workspace_id);
CREATE INDEX IF NOT EXISTS report_templates_type_idx ON report_templates (report_type);
DROP POLICY IF EXISTS "select_own_report_templates" ON report_templates;
CREATE POLICY "select_own_report_templates" ON report_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_report_templates" ON report_templates;
CREATE POLICY "insert_own_report_templates" ON report_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_report_templates" ON report_templates;
CREATE POLICY "update_own_report_templates" ON report_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_report_templates" ON report_templates;
CREATE POLICY "delete_own_report_templates" ON report_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Report History
CREATE TABLE IF NOT EXISTS report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  template_id uuid REFERENCES report_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('performance', 'trade', 'risk', 'psychology', 'strategy', 'journal', 'account', 'ai_review', 'custom')),
  period_start date,
  period_end date,
  account_id text,
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  filters jsonb DEFAULT '{}'::jsonb,
  sections text[] DEFAULT '{}',
  metrics jsonb DEFAULT '{}'::jsonb,
  include_ai_summary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS report_history_user_idx ON report_history (user_id);
CREATE INDEX IF NOT EXISTS report_history_workspace_idx ON report_history (workspace_id);
CREATE INDEX IF NOT EXISTS report_history_type_idx ON report_history (report_type);
CREATE INDEX IF NOT EXISTS report_history_created_idx ON report_history (created_at DESC);
DROP POLICY IF EXISTS "select_own_report_history" ON report_history;
CREATE POLICY "select_own_report_history" ON report_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_report_history" ON report_history;
CREATE POLICY "insert_own_report_history" ON report_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_report_history" ON report_history;
CREATE POLICY "update_own_report_history" ON report_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_report_history" ON report_history;
CREATE POLICY "delete_own_report_history" ON report_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  template_id uuid NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  account_id text,
  delivery_preference text DEFAULT 'view' CHECK (delivery_preference IN ('view', 'download', 'email')),
  active boolean DEFAULT true,
  last_generated_at timestamptz,
  next_generation_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS scheduled_reports_user_idx ON scheduled_reports (user_id);
CREATE INDEX IF NOT EXISTS scheduled_reports_workspace_idx ON scheduled_reports (workspace_id);
CREATE INDEX IF NOT EXISTS scheduled_reports_active_idx ON scheduled_reports (active);
DROP POLICY IF EXISTS "select_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "select_own_scheduled_reports" ON scheduled_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "insert_own_scheduled_reports" ON scheduled_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "update_own_scheduled_reports" ON scheduled_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "delete_own_scheduled_reports" ON scheduled_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 16: 20260911035858_create_automation_notification_tables.sql =====

/*
# Create Automation & Notification Tables

1. New Tables
- `automations`: Automation rules with trigger, conditions, actions, schedule, and status.
- `automation_executions`: Execution history for automations with status, duration, result, and error.
- `notifications`: User notifications with category, priority, read/archive state, and related item link.
- `notification_preferences`: Per-user notification preferences for each category and channel.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Reuses existing event bus for trigger integration.
- Automations store trigger type, conditions (JSON), and actions (JSON) for flexibility.
- Notifications support categories: risk, trading, journal, goals, reports, ai, system.
- Notification preferences allow per-category, per-channel enable/disable.
*/

-- Automations
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'trade_created', 'trade_closed', 'daily_loss_limit', 'weekly_loss_limit',
    'drawdown_threshold', 'journal_not_completed', 'goal_deadline_approaching',
    'habit_missed', 'report_generated', 'ai_review_completed',
    'schedule_daily', 'schedule_weekly', 'schedule_monthly', 'schedule_specific'
  )),
  trigger_config jsonb DEFAULT '{}'::jsonb,
  conditions jsonb DEFAULT '[]'::jsonb,
  condition_logic text DEFAULT 'and' CHECK (condition_logic IN ('and', 'or')),
  action_type text NOT NULL CHECK (action_type IN (
    'send_notification', 'create_reminder', 'generate_report',
    'start_ai_review', 'add_journal_reminder', 'update_goal_status', 'create_task'
  )),
  action_config jsonb DEFAULT '{}'::jsonb,
  schedule_config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS automations_user_idx ON automations (user_id);
CREATE INDEX IF NOT EXISTS automations_workspace_idx ON automations (workspace_id);
CREATE INDEX IF NOT EXISTS automations_status_idx ON automations (status);
CREATE INDEX IF NOT EXISTS automations_next_run_idx ON automations (next_run_at);
DROP POLICY IF EXISTS "select_own_automations" ON automations;
CREATE POLICY "select_own_automations" ON automations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_automations" ON automations;
CREATE POLICY "insert_own_automations" ON automations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_automations" ON automations;
CREATE POLICY "update_own_automations" ON automations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_automations" ON automations;
CREATE POLICY "delete_own_automations" ON automations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Automation Executions
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'running', 'skipped')),
  executed_at timestamptz DEFAULT now(),
  duration_ms integer DEFAULT 0,
  result jsonb DEFAULT '{}'::jsonb,
  error text,
  retried boolean DEFAULT false,
  retry_of uuid REFERENCES automation_executions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS automation_executions_user_idx ON automation_executions (user_id);
CREATE INDEX IF NOT EXISTS automation_executions_automation_idx ON automation_executions (automation_id);
CREATE INDEX IF NOT EXISTS automation_executions_status_idx ON automation_executions (status);
CREATE INDEX IF NOT EXISTS automation_executions_executed_at_idx ON automation_executions (executed_at DESC);
DROP POLICY IF EXISTS "select_own_automation_executions" ON automation_executions;
CREATE POLICY "select_own_automation_executions" ON automation_executions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_automation_executions" ON automation_executions;
CREATE POLICY "insert_own_automation_executions" ON automation_executions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_automation_executions" ON automation_executions;
CREATE POLICY "delete_own_automation_executions" ON automation_executions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('risk', 'trading', 'journal', 'goals', 'reports', 'ai', 'system')),
  priority text NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  related_type text,
  related_id text,
  read boolean DEFAULT false,
  archived boolean DEFAULT false,
  action_url text,
  action_label text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_workspace_idx ON notifications (workspace_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications (read);
CREATE INDEX IF NOT EXISTS notifications_category_idx ON notifications (category);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at DESC);
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('risk', 'trading', 'journal', 'goals', 'reports', 'ai', 'system')),
  in_app_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  min_priority text DEFAULT 'info' CHECK (min_priority IN ('info', 'warning', 'critical')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notification_preferences_user_idx ON notification_preferences (user_id);
DROP POLICY IF EXISTS "select_own_notification_preferences" ON notification_preferences;
CREATE POLICY "select_own_notification_preferences" ON notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notification_preferences" ON notification_preferences;
CREATE POLICY "insert_own_notification_preferences" ON notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notification_preferences" ON notification_preferences;
CREATE POLICY "update_own_notification_preferences" ON notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notification_preferences" ON notification_preferences;
CREATE POLICY "delete_own_notification_preferences" ON notification_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 17: 20261025033400_create_daily_checklist.sql =====

/*
# Create daily_checklists table

1. New Tables
- `daily_checklists`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
  - `checklist_date` (date, not null — the trading day this checklist belongs to)
  - `items` (jsonb, not null, defaults to an empty array — each item is { id: string, label: string, checked: boolean })
  - `created_at` (timestamptz, defaults to now())
  - `updated_at` (timestamptz, defaults to now())
  - Unique constraint on (user_id, checklist_date) so each user has at most one checklist per day.

2. Security
- Enable RLS on `daily_checklists`.
- Grant SELECT, INSERT, UPDATE, DELETE to `authenticated` only (the app has a sign-in screen).
- Owner-scoped CRUD: each authenticated user can only access rows they own (auth.uid() = user_id).
- user_id defaults to auth.uid() so frontend inserts that omit user_id succeed.

3. Indexes
- Unique index on (user_id, checklist_date) for the "today's checklist" lookup.
*/

CREATE TABLE IF NOT EXISTS daily_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS daily_checklists_user_date_uniq
  ON daily_checklists (user_id, checklist_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON daily_checklists TO authenticated;

DROP POLICY IF EXISTS "select_own_checklists" ON daily_checklists;
CREATE POLICY "select_own_checklists" ON daily_checklists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checklists" ON daily_checklists;
CREATE POLICY "insert_own_checklists" ON daily_checklists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checklists" ON daily_checklists;
CREATE POLICY "update_own_checklists" ON daily_checklists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checklists" ON daily_checklists;
CREATE POLICY "delete_own_checklists" ON daily_checklists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

