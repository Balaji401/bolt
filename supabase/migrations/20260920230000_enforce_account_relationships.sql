/*
# TraderOS: enforce account ownership relationships

RLS protects rows by user_id, but account_id values submitted by a client must
also belong to that same user/workspace. These triggers prevent cross-account
references even when a request is manually crafted outside the UI.
*/

CREATE OR REPLACE FUNCTION public.validate_trading_account_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_user_id uuid;
  account_workspace_id uuid;
BEGIN
  IF NEW.account_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, workspace_id
    INTO account_user_id, account_workspace_id
  FROM trading_accounts
  WHERE id = NEW.account_id;

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

DROP TRIGGER IF EXISTS validate_trade_account_owner ON trades;
CREATE TRIGGER validate_trade_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON trades
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_goal_account_owner ON trading_goals;
CREATE TRIGGER validate_goal_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON trading_goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_risk_rule_account_owner ON risk_rules;
CREATE TRIGGER validate_risk_rule_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON risk_rules
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_risk_alert_account_owner ON risk_alerts;
CREATE TRIGGER validate_risk_alert_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON risk_alerts
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_psychology_account_owner ON psychology_logs;
CREATE TRIGGER validate_psychology_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON psychology_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_daily_journal_account_owner ON daily_journals;
CREATE TRIGGER validate_daily_journal_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON daily_journals
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_weekly_review_account_owner ON weekly_reviews;
CREATE TRIGGER validate_weekly_review_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON weekly_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_monthly_review_account_owner ON monthly_reviews;
CREATE TRIGGER validate_monthly_review_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_ai_insight_account_owner ON ai_insights;
CREATE TRIGGER validate_ai_insight_account_owner
  BEFORE INSERT OR UPDATE OF account_id, user_id, workspace_id ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_report_history_account_owner ON report_history;
CREATE TRIGGER validate_report_history_account_owner
  BEFORE INSERT OR UPDATE OF account_id_uuid, user_id, workspace_id ON report_history
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();

DROP TRIGGER IF EXISTS validate_scheduled_report_account_owner ON scheduled_reports;
CREATE TRIGGER validate_scheduled_report_account_owner
  BEFORE INSERT OR UPDATE OF account_id_uuid, user_id, workspace_id ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_trading_account_owner();
