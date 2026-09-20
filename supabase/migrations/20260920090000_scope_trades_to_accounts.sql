/*
# TraderOS: Scope trades to authenticated users and trading accounts

This migration closes the legacy single-tenant gap in the original trades table.

- Adds nullable owner/workspace/account references so existing rows are not destroyed.
- New authenticated writes default user_id to auth.uid().
- Authenticated users can only read/write their own trades.
- Anonymous access is read-only for legacy demo rows.
- account_id ties each trade to the active Trading Account.
- Existing legacy rows remain unowned and are intentionally not exposed to authenticated users.
*/

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE trades
  ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_workspace_id ON trades(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_executed_at ON trades(account_id, executed_at DESC);

-- Replace the legacy shared policies.
DROP POLICY IF EXISTS "anon_select_trades" ON trades;
DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
DROP POLICY IF EXISTS "anon_update_trades" ON trades;
DROP POLICY IF EXISTS "anon_delete_trades" ON trades;

CREATE POLICY "anon_read_legacy_trades"
  ON trades FOR SELECT TO anon
  USING (user_id IS NULL);

CREATE POLICY "authenticated_select_own_trades"
  ON trades FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_trades"
  ON trades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_trades"
  ON trades FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_delete_own_trades"
  ON trades FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
