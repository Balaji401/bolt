/*
# TraderOS Foundation: scope legacy trading data

The original core schema was intentionally single-tenant. These tables are now
converted to authenticated owner-scoped data while preserving existing rows.

Legacy rows with NULL user_id are retained but are not exposed to authenticated users.
*/

-- Psychology logs
ALTER TABLE psychology_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE psychology_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_psychology_logs_user_id ON psychology_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_psychology_logs_workspace_id ON psychology_logs(workspace_id);

DROP POLICY IF EXISTS "anon_select_psych" ON psychology_logs;
DROP POLICY IF EXISTS "anon_insert_psych" ON psychology_logs;
DROP POLICY IF EXISTS "anon_update_psych" ON psychology_logs;
DROP POLICY IF EXISTS "anon_delete_psych" ON psychology_logs;

CREATE POLICY "authenticated_select_own_psychology_logs" ON psychology_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_own_psychology_logs" ON psychology_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_own_psychology_logs" ON psychology_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_own_psychology_logs" ON psychology_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trading goals
ALTER TABLE trading_goals
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE trading_goals ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_trading_goals_user_id ON trading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_goals_account_id ON trading_goals(account_id);

DROP POLICY IF EXISTS "anon_select_goals" ON trading_goals;
DROP POLICY IF EXISTS "anon_insert_goals" ON trading_goals;
DROP POLICY IF EXISTS "anon_update_goals" ON trading_goals;
DROP POLICY IF EXISTS "anon_delete_goals" ON trading_goals;

CREATE POLICY "authenticated_select_own_goals" ON trading_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_own_goals" ON trading_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_own_goals" ON trading_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_own_goals" ON trading_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Broker connections
ALTER TABLE broker_connections
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trading_account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE broker_connections ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_broker_connections_user_id ON broker_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_connections_trading_account_id ON broker_connections(trading_account_id);

DROP POLICY IF EXISTS "anon_select_brokers" ON broker_connections;
DROP POLICY IF EXISTS "anon_insert_brokers" ON broker_connections;
DROP POLICY IF EXISTS "anon_update_brokers" ON broker_connections;
DROP POLICY IF EXISTS "anon_delete_brokers" ON broker_connections;

CREATE POLICY "authenticated_select_own_brokers" ON broker_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_own_brokers" ON broker_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_own_brokers" ON broker_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_own_brokers" ON broker_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Live/open positions
ALTER TABLE open_positions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trading_account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE open_positions ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_open_positions_user_id ON open_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_open_positions_account_id ON open_positions(trading_account_id);

DROP POLICY IF EXISTS "anon_select_positions" ON open_positions;
DROP POLICY IF EXISTS "anon_insert_positions" ON open_positions;
DROP POLICY IF EXISTS "anon_update_positions" ON open_positions;
DROP POLICY IF EXISTS "anon_delete_positions" ON open_positions;

CREATE POLICY "authenticated_select_own_positions" ON open_positions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_own_positions" ON open_positions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_own_positions" ON open_positions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_own_positions" ON open_positions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
