/*
# TraderOS account-scoped AI insights

AI insights are generated from a specific trading account. Keep the existing
workspace/user ownership and add account ownership for multi-account analytics.
*/

ALTER TABLE ai_insights
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_insights_user_idx ON ai_insights (user_id);
CREATE INDEX IF NOT EXISTS ai_insights_workspace_idx ON ai_insights (workspace_id);

CREATE INDEX IF NOT EXISTS ai_insights_account_idx ON ai_insights (account_id);

-- Existing insights may not have account context; preserve them instead of
-- guessing an account. New account-scoped records must belong to the caller.
DROP POLICY IF EXISTS "anon_select_insights" ON ai_insights;
DROP POLICY IF EXISTS "anon_insert_insights" ON ai_insights;
DROP POLICY IF EXISTS "anon_update_insights" ON ai_insights;
DROP POLICY IF EXISTS "anon_delete_insights" ON ai_insights;
DROP POLICY IF EXISTS "insert_own_ai_insights" ON ai_insights;
CREATE POLICY "insert_own_ai_insights" ON ai_insights
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_ai_insights" ON ai_insights;
CREATE POLICY "select_own_ai_insights" ON ai_insights
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_insights" ON ai_insights;
CREATE POLICY "update_own_ai_insights" ON ai_insights
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_insights" ON ai_insights;
CREATE POLICY "delete_own_ai_insights" ON ai_insights
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
