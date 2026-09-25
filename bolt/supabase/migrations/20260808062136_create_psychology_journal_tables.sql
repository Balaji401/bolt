/*
# Create Psychology & Journal tables

1. New Tables
- `daily_journals`: Daily pre/post trading journal entries.
- `weekly_reviews`: Weekly review entries.
- `monthly_reviews`: Monthly review entries.
- `habits`: Recurring trading habits.
- `habit_logs`: Daily habit completion logs.
- `mistakes`: User's mistake library.
- `trade_reviews`: Structured per-trade review.
- `custom_emotions`: User-defined emotion tags.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).

3. Notes
- All tables have user_id DEFAULT auth.uid() for seamless inserts.
*/

-- Daily Journals
CREATE TABLE IF NOT EXISTS daily_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  journal_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  emotional_state_pre text,
  confidence_pre integer CHECK (confidence_pre >= 1 AND confidence_pre <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  trading_plan text,
  market_bias text,
  goals_today text,
  overall_mood text,
  biggest_mistake text,
  biggest_success text,
  lessons_learned text,
  improvements text,
  followed_plan boolean DEFAULT null,
  overall_satisfaction integer CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE daily_journals ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS daily_journals_user_date_unique ON daily_journals (user_id, journal_date);
DROP POLICY IF EXISTS "select_own_daily_journals" ON daily_journals;
CREATE POLICY "select_own_daily_journals" ON daily_journals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_daily_journals" ON daily_journals;
CREATE POLICY "insert_own_daily_journals" ON daily_journals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_daily_journals" ON daily_journals;
CREATE POLICY "update_own_daily_journals" ON daily_journals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_daily_journals" ON daily_journals;
CREATE POLICY "delete_own_daily_journals" ON daily_journals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Weekly Reviews
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  trades_taken integer DEFAULT 0,
  win_rate numeric DEFAULT 0,
  biggest_win text,
  biggest_loss text,
  best_decision text,
  worst_decision text,
  psychology_notes text,
  lessons_learned text,
  goals_next_week text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS weekly_reviews_user_week_unique ON weekly_reviews (user_id, week_start);
DROP POLICY IF EXISTS "select_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "select_own_weekly_reviews" ON weekly_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "insert_own_weekly_reviews" ON weekly_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "update_own_weekly_reviews" ON weekly_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weekly_reviews" ON weekly_reviews;
CREATE POLICY "delete_own_weekly_reviews" ON weekly_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Monthly Reviews
CREATE TABLE IF NOT EXISTS monthly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  performance_summary text,
  discipline_review text,
  psychology_review text,
  goal_progress text,
  habit_completion text,
  biggest_improvements text,
  biggest_problems text,
  action_plan text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS monthly_reviews_user_month_unique ON monthly_reviews (user_id, month_year);
DROP POLICY IF EXISTS "select_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "select_own_monthly_reviews" ON monthly_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "insert_own_monthly_reviews" ON monthly_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "update_own_monthly_reviews" ON monthly_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "delete_own_monthly_reviews" ON monthly_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'daily',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_user_habit_date_unique ON habit_logs (user_id, habit_id, log_date);
DROP POLICY IF EXISTS "select_own_habit_logs" ON habit_logs;
CREATE POLICY "select_own_habit_logs" ON habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habit_logs" ON habit_logs;
CREATE POLICY "insert_own_habit_logs" ON habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habit_logs" ON habit_logs;
CREATE POLICY "update_own_habit_logs" ON habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habit_logs" ON habit_logs;
CREATE POLICY "delete_own_habit_logs" ON habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mistakes
CREATE TABLE IF NOT EXISTS mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  frequency integer DEFAULT 1,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity = ANY (ARRAY['low', 'medium', 'high', 'critical'])),
  solution text,
  related_trade_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_mistakes" ON mistakes;
CREATE POLICY "select_own_mistakes" ON mistakes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_mistakes" ON mistakes;
CREATE POLICY "insert_own_mistakes" ON mistakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_mistakes" ON mistakes;
CREATE POLICY "update_own_mistakes" ON mistakes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_mistakes" ON mistakes;
CREATE POLICY "delete_own_mistakes" ON mistakes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trade Reviews
CREATE TABLE IF NOT EXISTS trade_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  why_taken text,
  followed_setup boolean DEFAULT null,
  respected_risk boolean DEFAULT null,
  entered_early boolean DEFAULT null,
  exited_early boolean DEFAULT null,
  improvements text,
  rating integer CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trade_reviews ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS trade_reviews_trade_unique ON trade_reviews (trade_id);
DROP POLICY IF EXISTS "select_own_trade_reviews" ON trade_reviews;
CREATE POLICY "select_own_trade_reviews" ON trade_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_trade_reviews" ON trade_reviews;
CREATE POLICY "insert_own_trade_reviews" ON trade_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_trade_reviews" ON trade_reviews;
CREATE POLICY "update_own_trade_reviews" ON trade_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_trade_reviews" ON trade_reviews;
CREATE POLICY "delete_own_trade_reviews" ON trade_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Custom Emotions
CREATE TABLE IF NOT EXISTS custom_emotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE custom_emotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_custom_emotions" ON custom_emotions;
CREATE POLICY "select_own_custom_emotions" ON custom_emotions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_custom_emotions" ON custom_emotions;
CREATE POLICY "insert_own_custom_emotions" ON custom_emotions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_custom_emotions" ON custom_emotions;
CREATE POLICY "delete_own_custom_emotions" ON custom_emotions FOR DELETE TO authenticated USING (auth.uid() = user_id);
