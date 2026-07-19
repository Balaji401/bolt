/*
# Add achievements/gamification + AI chat messages

## New Tables
1. `achievements` - Tracks earned badges/awards per user
2. `ai_chat_messages` - Stores AI chat history per user session

## Trade Table Enhancements
- Add `mistakes`, `lessons_learned`, `setup_type`, `before_notes`, `during_notes`, `after_notes`, `screenshots`
*/

-- ─── Enhance trades with journaling fields ───────────────────────────────────
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS setup_type text,
  ADD COLUMN IF NOT EXISTS before_notes text,
  ADD COLUMN IF NOT EXISTS during_notes text,
  ADD COLUMN IF NOT EXISTS after_notes text,
  ADD COLUMN IF NOT EXISTS mistakes text[],
  ADD COLUMN IF NOT EXISTS lessons_learned text,
  ADD COLUMN IF NOT EXISTS screenshots text[],
  ADD COLUMN IF NOT EXISTS holding_minutes integer;

-- ─── Achievements table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Trophy',
  category text NOT NULL DEFAULT 'general',
  earned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_achievements" ON achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_achievements" ON achievements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── AI chat messages table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON ai_chat_messages(session_id);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_chat" ON ai_chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_chat" ON ai_chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_chat" ON ai_chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
