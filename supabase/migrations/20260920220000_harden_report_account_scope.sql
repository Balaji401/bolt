/*
# TraderOS: harden report account ownership

Report history and scheduled reports can refer to a specific trading account.
Convert legacy text account IDs to UUIDs safely and add account-aware indexes.
Invalid legacy values are preserved as NULL rather than aborting production migration.
*/

ALTER TABLE report_history
  ADD COLUMN IF NOT EXISTS account_id_uuid uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

ALTER TABLE scheduled_reports
  ADD COLUMN IF NOT EXISTS account_id_uuid uuid REFERENCES trading_accounts(id) ON DELETE SET NULL;

UPDATE report_history
SET account_id_uuid = CASE
  WHEN account_id IS NULL OR account_id = '' THEN NULL
  WHEN account_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN account_id::uuid
  ELSE NULL
END
WHERE account_id_uuid IS NULL;

UPDATE scheduled_reports
SET account_id_uuid = CASE
  WHEN account_id IS NULL OR account_id = '' THEN NULL
  WHEN account_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN account_id::uuid
  ELSE NULL
END
WHERE account_id_uuid IS NULL;

CREATE INDEX IF NOT EXISTS report_history_account_idx ON report_history(account_id_uuid);
CREATE INDEX IF NOT EXISTS scheduled_reports_account_idx ON scheduled_reports(account_id_uuid);

-- Keep the legacy text columns temporarily for backward compatibility.
-- The application will use the validated UUID columns from this migration.
