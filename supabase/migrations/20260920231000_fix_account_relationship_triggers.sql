/*
# TraderOS: complete account relationship trigger coverage

Report records use account_id_uuid while broker/position records use
trading_account_id, so they need dedicated validators.
*/

CREATE OR REPLACE FUNCTION public.validate_trading_account_owner_uuid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_user_id uuid;
  account_workspace_id uuid;
BEGIN
  IF NEW.account_id_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, workspace_id INTO account_user_id, account_workspace_id
  FROM trading_accounts WHERE id = NEW.account_id_uuid;

  IF account_user_id IS NULL THEN
    RAISE EXCEPTION 'Trading account does not exist';
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> account_user_id THEN
    RAISE EXCEPTION 'Trading account does not belong to the row owner';
  END IF;
  IF NEW.workspace_id IS NOT NULL AND NEW.workspace_id <> account_workspace_id THEN
    RAISE EXCEPTION 'Trading account does not belong to the row workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_report_history_account_owner ON report_history;
CREATE TRIGGER validate_report_history_account_owner
  BEFORE INSERT OR UPDATE OF account_id_uuid, user_id, workspace_id ON report_history
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner_uuid();

DROP TRIGGER IF EXISTS validate_scheduled_report_account_owner ON scheduled_reports;
CREATE TRIGGER validate_scheduled_report_account_owner
  BEFORE INSERT OR UPDATE OF account_id_uuid, user_id, workspace_id ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner_uuid();

CREATE OR REPLACE FUNCTION public.validate_trading_account_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_user_id uuid;
  account_workspace_id uuid;
BEGIN
  IF NEW.trading_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, workspace_id INTO account_user_id, account_workspace_id
  FROM trading_accounts WHERE id = NEW.trading_account_id;

  IF account_user_id IS NULL THEN
    RAISE EXCEPTION 'Trading account does not exist';
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> account_user_id THEN
    RAISE EXCEPTION 'Trading account does not belong to the row owner';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_open_position_account_owner ON open_positions;
CREATE TRIGGER validate_open_position_account_owner
  BEFORE INSERT OR UPDATE OF trading_account_id, user_id ON open_positions
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_reference();

DROP TRIGGER IF EXISTS validate_broker_connection_account_owner ON broker_connections;
CREATE TRIGGER validate_broker_connection_account_owner
  BEFORE INSERT OR UPDATE OF trading_account_id, user_id ON broker_connections
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_reference();
