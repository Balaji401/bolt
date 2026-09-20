/*
# TraderOS: scope risk configuration and alert history to trading accounts

Risk limits are evaluated against the currently selected trading account.
Existing workspace-level rules are assigned to the workspace's default active
account when possible; rows without an account are preserved as legacy rows.
*/

ALTER TABLE risk_rules
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE risk_alerts
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS risk_rules_account_idx ON risk_rules (account_id);
CREATE INDEX IF NOT EXISTS risk_alerts_account_idx ON risk_alerts (account_id);

-- Preserve existing configuration by attaching it to the user's default active account.
UPDATE risk_rules rr
SET account_id = (
  SELECT ta.id
  FROM trading_accounts ta
  WHERE ta.workspace_id = rr.workspace_id
    AND ta.status = 'active'
  ORDER BY ta.is_default DESC, ta.created_at ASC
  LIMIT 1
)
WHERE rr.account_id IS NULL;

-- The old schema allowed one rules row per workspace. Multiple accounts need
-- one independent rules row per account instead.
DROP INDEX IF EXISTS risk_rules_workspace_unique;
CREATE UNIQUE INDEX IF NOT EXISTS risk_rules_workspace_account_unique
  ON risk_rules (workspace_id, account_id)
  WHERE account_id IS NOT NULL;
