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
