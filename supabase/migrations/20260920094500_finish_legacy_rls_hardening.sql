/*
# TraderOS Foundation: finish legacy RLS hardening

Removes remaining shared authenticated policies from legacy tables.
This is additive and does not delete existing data.
*/

-- Trading Plan
ALTER TABLE trading_plan
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE trading_plan ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_trading_plan_user_id ON trading_plan(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_plan_workspace_id ON trading_plan(workspace_id);

DROP POLICY IF EXISTS "anon_select_plan" ON trading_plan;
DROP POLICY IF EXISTS "anon_insert_plan" ON trading_plan;
DROP POLICY IF EXISTS "anon_update_plan" ON trading_plan;
DROP POLICY IF EXISTS "anon_delete_plan" ON trading_plan;

CREATE POLICY "authenticated_select_own_trading_plan" ON trading_plan
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_own_trading_plan" ON trading_plan
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_update_own_trading_plan" ON trading_plan
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_delete_own_trading_plan" ON trading_plan
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Insights: the later AI migration added owner policies but the original
-- shared policies remained, which would still allow authenticated users to
-- see all rows because Supabase RLS policies are OR-combined.
DROP POLICY IF EXISTS "anon_select_insights" ON ai_insights;
DROP POLICY IF EXISTS "anon_insert_insights" ON ai_insights;
DROP POLICY IF EXISTS "anon_update_insights" ON ai_insights;
DROP POLICY IF EXISTS "anon_delete_insights" ON ai_insights;
