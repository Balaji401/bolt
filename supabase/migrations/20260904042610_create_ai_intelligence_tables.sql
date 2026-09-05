/*
# Create AI Intelligence tables

1. New Tables
- `ai_conversations`: Chat conversation sessions with titles, pins, and search.
- `ai_memory`: Long-term memory entries (strategies, habits, mistakes, preferences, etc.).
- `ai_reviews`: Structured AI reviews (trade, psychology, goal, weekly, monthly).
- `ai_scores`: Trading, psychology, and discipline scores over time.
- `ai_recommendations`: Personalized, data-backed AI recommendations.

2. Security
- Enable RLS on all tables. Owner-scoped CRUD (user_id = auth.uid()).
- All tables have user_id DEFAULT auth.uid() for seamless inserts.

3. Notes
- Reuses existing `ai_chat_messages` table for conversation messages (joined by session_id).
- `ai_conversations` provides metadata (title, pin) for each session_id.
- Memory is persistent; conversations are ephemeral and can be deleted.
*/

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_conversations_user_idx ON ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS ai_conversations_session_idx ON ai_conversations (session_id);
DROP POLICY IF EXISTS "select_own_ai_conversations" ON ai_conversations;
CREATE POLICY "select_own_ai_conversations" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_own_ai_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_conversations" ON ai_conversations;
CREATE POLICY "update_own_ai_conversations" ON ai_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_own_ai_conversations" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Memory
CREATE TABLE IF NOT EXISTS ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  memory_type text NOT NULL DEFAULT 'observation' CHECK (memory_type IN ('strategy', 'habit', 'mistake', 'goal', 'preference', 'style', 'observation', 'rule')),
  key text NOT NULL,
  value text NOT NULL,
  source text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_memory_user_idx ON ai_memory (user_id);
CREATE INDEX IF NOT EXISTS ai_memory_type_idx ON ai_memory (memory_type);
DROP POLICY IF EXISTS "select_own_ai_memory" ON ai_memory;
CREATE POLICY "select_own_ai_memory" ON ai_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_memory" ON ai_memory;
CREATE POLICY "insert_own_ai_memory" ON ai_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_memory" ON ai_memory;
CREATE POLICY "delete_own_ai_memory" ON ai_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Reviews
CREATE TABLE IF NOT EXISTS ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  review_type text NOT NULL CHECK (review_type IN ('trade', 'psychology', 'goal', 'weekly', 'monthly', 'daily')),
  ref_id uuid,
  title text,
  summary text,
  strengths text[],
  weaknesses text[],
  recommendations text[],
  rating integer CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_reviews_user_idx ON ai_reviews (user_id);
CREATE INDEX IF NOT EXISTS ai_reviews_type_idx ON ai_reviews (review_type);
DROP POLICY IF EXISTS "select_own_ai_reviews" ON ai_reviews;
CREATE POLICY "select_own_ai_reviews" ON ai_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_reviews" ON ai_reviews;
CREATE POLICY "insert_own_ai_reviews" ON ai_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_reviews" ON ai_reviews;
CREATE POLICY "delete_own_ai_reviews" ON ai_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Scores
CREATE TABLE IF NOT EXISTS ai_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  score_type text NOT NULL CHECK (score_type IN ('trading', 'psychology', 'discipline', 'risk', 'overall')),
  score numeric NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  breakdown jsonb,
  period text DEFAULT 'current',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_scores_user_idx ON ai_scores (user_id);
CREATE INDEX IF NOT EXISTS ai_scores_type_idx ON ai_scores (score_type);
DROP POLICY IF EXISTS "select_own_ai_scores" ON ai_scores;
CREATE POLICY "select_own_ai_scores" ON ai_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_scores" ON ai_scores;
CREATE POLICY "insert_own_ai_scores" ON ai_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_scores" ON ai_scores;
CREATE POLICY "delete_own_ai_scores" ON ai_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('risk', 'psychology', 'discipline', 'strategy', 'habit', 'goal', 'general')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  body text NOT NULL,
  data_ref text,
  action_taken boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_recommendations_user_idx ON ai_recommendations (user_id);
DROP POLICY IF EXISTS "select_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "select_own_ai_recommendations" ON ai_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "insert_own_ai_recommendations" ON ai_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "update_own_ai_recommendations" ON ai_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_recommendations" ON ai_recommendations;
CREATE POLICY "delete_own_ai_recommendations" ON ai_recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);
