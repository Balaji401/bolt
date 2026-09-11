/*
# Create Reports & Performance Review Tables

1. New Tables
- `report_templates`: Reusable report templates with type, filters, sections, and schedule settings.
- `report_history`: Generated report records with name, type, period, account, status, and export data.
- `scheduled_reports`: Scheduled report generation with frequency, template, and delivery preferences.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Reuses existing analytics, risk, psychology, and strategy calculations.
- Report templates store filter configuration and section selection for reuse.
- Report history stores metadata about each generated report (not the full report content — reports are regenerated from templates + data).
- Scheduled reports reference templates and store frequency/delivery preferences.
*/

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  report_type text NOT NULL CHECK (report_type IN ('performance', 'trade', 'risk', 'psychology', 'strategy', 'journal', 'account', 'ai_review', 'custom')),
  filters jsonb DEFAULT '{}'::jsonb,
  sections text[] DEFAULT '{}',
  is_custom boolean DEFAULT false,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS report_templates_user_idx ON report_templates (user_id);
CREATE INDEX IF NOT EXISTS report_templates_workspace_idx ON report_templates (workspace_id);
CREATE INDEX IF NOT EXISTS report_templates_type_idx ON report_templates (report_type);
DROP POLICY IF EXISTS "select_own_report_templates" ON report_templates;
CREATE POLICY "select_own_report_templates" ON report_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_report_templates" ON report_templates;
CREATE POLICY "insert_own_report_templates" ON report_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_report_templates" ON report_templates;
CREATE POLICY "update_own_report_templates" ON report_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_report_templates" ON report_templates;
CREATE POLICY "delete_own_report_templates" ON report_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Report History
CREATE TABLE IF NOT EXISTS report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  template_id uuid REFERENCES report_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('performance', 'trade', 'risk', 'psychology', 'strategy', 'journal', 'account', 'ai_review', 'custom')),
  period_start date,
  period_end date,
  account_id text,
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  filters jsonb DEFAULT '{}'::jsonb,
  sections text[] DEFAULT '{}',
  metrics jsonb DEFAULT '{}'::jsonb,
  include_ai_summary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS report_history_user_idx ON report_history (user_id);
CREATE INDEX IF NOT EXISTS report_history_workspace_idx ON report_history (workspace_id);
CREATE INDEX IF NOT EXISTS report_history_type_idx ON report_history (report_type);
CREATE INDEX IF NOT EXISTS report_history_created_idx ON report_history (created_at DESC);
DROP POLICY IF EXISTS "select_own_report_history" ON report_history;
CREATE POLICY "select_own_report_history" ON report_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_report_history" ON report_history;
CREATE POLICY "insert_own_report_history" ON report_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_report_history" ON report_history;
CREATE POLICY "update_own_report_history" ON report_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_report_history" ON report_history;
CREATE POLICY "delete_own_report_history" ON report_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  template_id uuid NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  account_id text,
  delivery_preference text DEFAULT 'view' CHECK (delivery_preference IN ('view', 'download', 'email')),
  active boolean DEFAULT true,
  last_generated_at timestamptz,
  next_generation_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS scheduled_reports_user_idx ON scheduled_reports (user_id);
CREATE INDEX IF NOT EXISTS scheduled_reports_workspace_idx ON scheduled_reports (workspace_id);
CREATE INDEX IF NOT EXISTS scheduled_reports_active_idx ON scheduled_reports (active);
DROP POLICY IF EXISTS "select_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "select_own_scheduled_reports" ON scheduled_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "insert_own_scheduled_reports" ON scheduled_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "update_own_scheduled_reports" ON scheduled_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_scheduled_reports" ON scheduled_reports;
CREATE POLICY "delete_own_scheduled_reports" ON scheduled_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);
