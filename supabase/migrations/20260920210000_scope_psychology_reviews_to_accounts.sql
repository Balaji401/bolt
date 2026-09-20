/*
# TraderOS: scope psychology and review records to trading accounts

Psychology entries and periodic trading reviews describe an account's actual
trading behavior. Add account ownership while preserving existing rows.
*/

ALTER TABLE psychology_logs
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE daily_journals
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE weekly_reviews
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;
ALTER TABLE monthly_reviews
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS psychology_logs_account_idx ON psychology_logs(account_id);
CREATE INDEX IF NOT EXISTS daily_journals_account_idx ON daily_journals(account_id);
CREATE INDEX IF NOT EXISTS weekly_reviews_account_idx ON weekly_reviews(account_id);
CREATE INDEX IF NOT EXISTS monthly_reviews_account_idx ON monthly_reviews(account_id);

-- Attach existing records to the first active account in their workspace.
UPDATE psychology_logs p SET account_id = (
  SELECT ta.id FROM trading_accounts ta
  WHERE ta.workspace_id = p.workspace_id AND ta.status = 'active'
  ORDER BY ta.is_default DESC, ta.created_at ASC LIMIT 1
) WHERE p.account_id IS NULL;
UPDATE daily_journals d SET account_id = (
  SELECT ta.id FROM trading_accounts ta
  WHERE ta.workspace_id = d.workspace_id AND ta.status = 'active'
  ORDER BY ta.is_default DESC, ta.created_at ASC LIMIT 1
) WHERE d.account_id IS NULL;
UPDATE weekly_reviews w SET account_id = (
  SELECT ta.id FROM trading_accounts ta
  WHERE ta.workspace_id = w.workspace_id AND ta.status = 'active'
  ORDER BY ta.is_default DESC, ta.created_at ASC LIMIT 1
) WHERE w.account_id IS NULL;
UPDATE monthly_reviews m SET account_id = (
  SELECT ta.id FROM trading_accounts ta
  WHERE ta.workspace_id = m.workspace_id AND ta.status = 'active'
  ORDER BY ta.is_default DESC, ta.created_at ASC LIMIT 1
) WHERE m.account_id IS NULL;
