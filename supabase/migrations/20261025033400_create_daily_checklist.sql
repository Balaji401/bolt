/*
# Create daily_checklists table

1. New Tables
- `daily_checklists`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
  - `checklist_date` (date, not null — the trading day this checklist belongs to)
  - `items` (jsonb, not null, defaults to an empty array — each item is { id: string, label: string, checked: boolean })
  - `created_at` (timestamptz, defaults to now())
  - `updated_at` (timestamptz, defaults to now())
  - Unique constraint on (user_id, checklist_date) so each user has at most one checklist per day.

2. Security
- Enable RLS on `daily_checklists`.
- Grant SELECT, INSERT, UPDATE, DELETE to `authenticated` only (the app has a sign-in screen).
- Owner-scoped CRUD: each authenticated user can only access rows they own (auth.uid() = user_id).
- user_id defaults to auth.uid() so frontend inserts that omit user_id succeed.

3. Indexes
- Unique index on (user_id, checklist_date) for the "today's checklist" lookup.
*/

CREATE TABLE IF NOT EXISTS daily_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS daily_checklists_user_date_uniq
  ON daily_checklists (user_id, checklist_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON daily_checklists TO authenticated;

DROP POLICY IF EXISTS "select_own_checklists" ON daily_checklists;
CREATE POLICY "select_own_checklists" ON daily_checklists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checklists" ON daily_checklists;
CREATE POLICY "insert_own_checklists" ON daily_checklists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checklists" ON daily_checklists;
CREATE POLICY "update_own_checklists" ON daily_checklists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checklists" ON daily_checklists;
CREATE POLICY "delete_own_checklists" ON daily_checklists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
