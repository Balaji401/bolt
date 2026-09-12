/*
# Create Automation & Notification Tables

1. New Tables
- `automations`: Automation rules with trigger, conditions, actions, schedule, and status.
- `automation_executions`: Execution history for automations with status, duration, result, and error.
- `notifications`: User notifications with category, priority, read/archive state, and related item link.
- `notification_preferences`: Per-user notification preferences for each category and channel.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Reuses existing event bus for trigger integration.
- Automations store trigger type, conditions (JSON), and actions (JSON) for flexibility.
- Notifications support categories: risk, trading, journal, goals, reports, ai, system.
- Notification preferences allow per-category, per-channel enable/disable.
*/

-- Automations
CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'trade_created', 'trade_closed', 'daily_loss_limit', 'weekly_loss_limit',
    'drawdown_threshold', 'journal_not_completed', 'goal_deadline_approaching',
    'habit_missed', 'report_generated', 'ai_review_completed',
    'schedule_daily', 'schedule_weekly', 'schedule_monthly', 'schedule_specific'
  )),
  trigger_config jsonb DEFAULT '{}'::jsonb,
  conditions jsonb DEFAULT '[]'::jsonb,
  condition_logic text DEFAULT 'and' CHECK (condition_logic IN ('and', 'or')),
  action_type text NOT NULL CHECK (action_type IN (
    'send_notification', 'create_reminder', 'generate_report',
    'start_ai_review', 'add_journal_reminder', 'update_goal_status', 'create_task'
  )),
  action_config jsonb DEFAULT '{}'::jsonb,
  schedule_config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS automations_user_idx ON automations (user_id);
CREATE INDEX IF NOT EXISTS automations_workspace_idx ON automations (workspace_id);
CREATE INDEX IF NOT EXISTS automations_status_idx ON automations (status);
CREATE INDEX IF NOT EXISTS automations_next_run_idx ON automations (next_run_at);
DROP POLICY IF EXISTS "select_own_automations" ON automations;
CREATE POLICY "select_own_automations" ON automations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_automations" ON automations;
CREATE POLICY "insert_own_automations" ON automations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_automations" ON automations;
CREATE POLICY "update_own_automations" ON automations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_automations" ON automations;
CREATE POLICY "delete_own_automations" ON automations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Automation Executions
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'running', 'skipped')),
  executed_at timestamptz DEFAULT now(),
  duration_ms integer DEFAULT 0,
  result jsonb DEFAULT '{}'::jsonb,
  error text,
  retried boolean DEFAULT false,
  retry_of uuid REFERENCES automation_executions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS automation_executions_user_idx ON automation_executions (user_id);
CREATE INDEX IF NOT EXISTS automation_executions_automation_idx ON automation_executions (automation_id);
CREATE INDEX IF NOT EXISTS automation_executions_status_idx ON automation_executions (status);
CREATE INDEX IF NOT EXISTS automation_executions_executed_at_idx ON automation_executions (executed_at DESC);
DROP POLICY IF EXISTS "select_own_automation_executions" ON automation_executions;
CREATE POLICY "select_own_automation_executions" ON automation_executions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_automation_executions" ON automation_executions;
CREATE POLICY "insert_own_automation_executions" ON automation_executions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_automation_executions" ON automation_executions;
CREATE POLICY "delete_own_automation_executions" ON automation_executions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('risk', 'trading', 'journal', 'goals', 'reports', 'ai', 'system')),
  priority text NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  related_type text,
  related_id text,
  read boolean DEFAULT false,
  archived boolean DEFAULT false,
  action_url text,
  action_label text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_workspace_idx ON notifications (workspace_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications (read);
CREATE INDEX IF NOT EXISTS notifications_category_idx ON notifications (category);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at DESC);
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('risk', 'trading', 'journal', 'goals', 'reports', 'ai', 'system')),
  in_app_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  min_priority text DEFAULT 'info' CHECK (min_priority IN ('info', 'warning', 'critical')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notification_preferences_user_idx ON notification_preferences (user_id);
DROP POLICY IF EXISTS "select_own_notification_preferences" ON notification_preferences;
CREATE POLICY "select_own_notification_preferences" ON notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notification_preferences" ON notification_preferences;
CREATE POLICY "insert_own_notification_preferences" ON notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notification_preferences" ON notification_preferences;
CREATE POLICY "update_own_notification_preferences" ON notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notification_preferences" ON notification_preferences;
CREATE POLICY "delete_own_notification_preferences" ON notification_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);
