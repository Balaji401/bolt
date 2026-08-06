/*
# TraderOS: Trade Tags & Extended Trade Fields

## Overview
Adds a `trade_tags` table for user-created custom tags and extends the
existing `trades` table with columns needed for comprehensive manual trade
management: market, timeframe, risk percentage, and archive support.

## New Tables

### 1. `trade_tags`
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users, defaults to auth.uid())
- `name` (text, not null)
- `color` (text, default 'default') — for UI display
- `created_at` (timestamptz)
- Unique constraint on (user_id, name) — no duplicate tags per user

## Changes to `trades` table (all additive)
- `market` (text, nullable) — e.g. "Forex", "Crypto", "Stocks", "Futures"
- `timeframe` (text, nullable) — e.g. "1m", "5m", "15m", "1H", "4H", "1D"
- `risk_pct` (numeric, nullable) — risk percentage for the trade
- `archived` (boolean, default false) — soft-archive flag

## Security
- RLS enabled on `trade_tags` with owner-scoped CRUD (TO authenticated, auth.uid() = user_id).
- `trades` table already has RLS with anon+authenticated policies — no changes needed.

## Notes
1. All columns are additive — no existing data is modified or lost.
2. `trade_tags` is owner-scoped so each user manages their own tag library.
3. `archived` on trades allows soft-archiving without deletion.
*/
CREATE TABLE IF NOT EXISTS trade_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE trade_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trade_tags" ON trade_tags;
CREATE POLICY "select_own_trade_tags" ON trade_tags FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trade_tags" ON trade_tags;
CREATE POLICY "insert_own_trade_tags" ON trade_tags FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trade_tags" ON trade_tags;
CREATE POLICY "update_own_trade_tags" ON trade_tags FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trade_tags" ON trade_tags;
CREATE POLICY "delete_own_trade_tags" ON trade_tags FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Extend trades table with additive columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'market') THEN
    ALTER TABLE trades ADD COLUMN market text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'timeframe') THEN
    ALTER TABLE trades ADD COLUMN timeframe text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'risk_pct') THEN
    ALTER TABLE trades ADD COLUMN risk_pct numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'archived') THEN
    ALTER TABLE trades ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trade_tags_user ON trade_tags(user_id);
