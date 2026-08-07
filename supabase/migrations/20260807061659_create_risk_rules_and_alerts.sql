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
