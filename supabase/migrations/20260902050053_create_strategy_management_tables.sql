/*
# Create Strategy Management tables

1. New Tables
- `strategies`: Trading strategies with rules, conditions, and metadata.
- `strategy_versions`: Version history for strategies (track changes).
- `trade_setups`: Setups belonging to a strategy (entry patterns, confirmations, etc.).
- `playbooks`: Trading playbooks with checklists and golden rules.
- `checklist_templates`: Reusable checklist templates with items.
- `strategy_attachments`: File attachments (images, PDFs, links) for strategies.
- `strategy_categories`: Custom strategy categories.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Strategies link to trades via existing `strategy_tags` and `setup_type` columns on trades table.
- Version history tracks changes with version numbers and change summaries.
- Attachments support file URLs (uploaded to Supabase Storage) and external links.
*/

-- Strategies
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Scalping',
  description text,
  market text,
  instrument_type text,
  timeframe text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing', 'archived')),
  market_conditions text,
  entry_conditions text,
  exit_conditions text,
  risk_rules text,
  position_rules text,
  advantages text,
  weaknesses text,
  common_mistakes text,
  improvements text,
  tags text[] DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS strategies_workspace_idx ON strategies (workspace_id);
CREATE INDEX IF NOT EXISTS strategies_user_idx ON strategies (user_id);
DROP POLICY IF EXISTS "select_own_strategies" ON strategies;
CREATE POLICY "select_own_strategies" ON strategies FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategies" ON strategies;
CREATE POLICY "insert_own_strategies" ON strategies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_strategies" ON strategies;
CREATE POLICY "update_own_strategies" ON strategies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategies" ON strategies;
CREATE POLICY "delete_own_strategies" ON strategies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Strategy Versions
CREATE TABLE IF NOT EXISTS strategy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  change_summary text,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_versions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS strategy_versions_strategy_idx ON strategy_versions (strategy_id);
DROP POLICY IF EXISTS "select_own_strategy_versions" ON strategy_versions;
CREATE POLICY "select_own_strategy_versions" ON strategy_versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategy_versions" ON strategy_versions;
CREATE POLICY "insert_own_strategy_versions" ON strategy_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategy_versions" ON strategy_versions;
CREATE POLICY "delete_own_strategy_versions" ON strategy_versions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trade Setups
CREATE TABLE IF NOT EXISTS trade_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  setup_type text,
  entry_pattern text,
  confirmation_rules text,
  invalidation_rules text,
  preferred_session text,
  preferred_market text,
  screenshot_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trade_setups ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trade_setups_strategy_idx ON trade_setups (strategy_id);
DROP POLICY IF EXISTS "select_own_trade_setups" ON trade_setups;
CREATE POLICY "select_own_trade_setups" ON trade_setups FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_trade_setups" ON trade_setups;
CREATE POLICY "insert_own_trade_setups" ON trade_setups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_trade_setups" ON trade_setups;
CREATE POLICY "update_own_trade_setups" ON trade_setups FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_trade_setups" ON trade_setups;
CREATE POLICY "delete_own_trade_setups" ON trade_setups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Playbooks
CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES strategies(id) ON DELETE SET NULL,
  name text NOT NULL,
  market_preparation text,
  entry_checklist text[],
  risk_checklist text[],
  exit_checklist text[],
  post_trade_checklist text[],
  common_mistakes text[],
  golden_rules text[],
  example_chart_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS playbooks_workspace_idx ON playbooks (workspace_id);
DROP POLICY IF EXISTS "select_own_playbooks" ON playbooks;
CREATE POLICY "select_own_playbooks" ON playbooks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_playbooks" ON playbooks;
CREATE POLICY "insert_own_playbooks" ON playbooks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_playbooks" ON playbooks;
CREATE POLICY "update_own_playbooks" ON playbooks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_playbooks" ON playbooks;
CREATE POLICY "delete_own_playbooks" ON playbooks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  checklist_type text NOT NULL DEFAULT 'before_entry' CHECK (checklist_type IN ('before_entry', 'after_exit', 'pre_market', 'risk_check', 'custom')),
  items text[] NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS checklist_templates_workspace_idx ON checklist_templates (workspace_id);
DROP POLICY IF EXISTS "select_own_checklist_templates" ON checklist_templates;
CREATE POLICY "select_own_checklist_templates" ON checklist_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_checklist_templates" ON checklist_templates;
CREATE POLICY "insert_own_checklist_templates" ON checklist_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_checklist_templates" ON checklist_templates;
CREATE POLICY "update_own_checklist_templates" ON checklist_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_checklist_templates" ON checklist_templates;
CREATE POLICY "delete_own_checklist_templates" ON checklist_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Strategy Attachments
CREATE TABLE IF NOT EXISTS strategy_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  attachment_type text NOT NULL DEFAULT 'image' CHECK (attachment_type IN ('image', 'pdf', 'note', 'link')),
  title text,
  file_url text,
  external_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS strategy_attachments_strategy_idx ON strategy_attachments (strategy_id);
DROP POLICY IF EXISTS "select_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "select_own_strategy_attachments" ON strategy_attachments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "insert_own_strategy_attachments" ON strategy_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategy_attachments" ON strategy_attachments;
CREATE POLICY "delete_own_strategy_attachments" ON strategy_attachments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Strategy Categories
CREATE TABLE IF NOT EXISTS strategy_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_categories ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS strategy_categories_user_name_unique ON strategy_categories (user_id, name);
DROP POLICY IF EXISTS "select_own_strategy_categories" ON strategy_categories;
CREATE POLICY "select_own_strategy_categories" ON strategy_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_strategy_categories" ON strategy_categories;
CREATE POLICY "insert_own_strategy_categories" ON strategy_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_strategy_categories" ON strategy_categories;
CREATE POLICY "delete_own_strategy_categories" ON strategy_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);
