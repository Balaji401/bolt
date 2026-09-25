/*
# TraderOS: User Management Profile Columns

## Overview
Extends the existing `profiles` table with user management fields needed for
the Authentication & User Management phase. No new tables are created — only
additive columns on `profiles`. All existing columns and data are preserved.

## Changes to `profiles` table
- `full_name` (text, nullable) — user's full name, distinct from display_name
- `username` (text, nullable, unique) — optional unique username
- `timezone` (text, nullable) — preferred timezone (e.g. "America/New_York")
- `preferred_currency` (text, default 'USD') — preferred display currency
- `preferred_language` (text, default 'en') — preferred UI language code
- `trading_experience` (text, nullable) — experience level (beginner/intermediate/advanced/expert)
- `last_login_at` (timestamptz, nullable) — timestamp of last login
- `account_status` (text, default 'active') — account status (active/suspended/deleted)
- `deleted_at` (timestamptz, nullable) — soft-delete timestamp; null means active

## Security
- RLS already enabled on `profiles` — no changes needed.
- Existing owner-scoped CRUD policies remain in place.
- No new policies required — the existing `update_own_profile` policy already
  allows users to update their own row, which covers the new columns.

## Notes
1. All columns are additive — no existing column is modified or dropped.
2. `username` has a unique constraint but is nullable (users not required to set one).
3. `account_status` defaults to 'active'; soft-delete sets `deleted_at` and
   changes status to 'deleted' without removing the row.
4. `last_login_at` is updated by the frontend on successful sign-in.
*/
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
    ALTER TABLE profiles ADD COLUMN timezone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_currency') THEN
    ALTER TABLE profiles ADD COLUMN preferred_currency text NOT NULL DEFAULT 'USD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text NOT NULL DEFAULT 'en';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trading_experience') THEN
    ALTER TABLE profiles ADD COLUMN trading_experience text CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE profiles ADD COLUMN account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
    ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- Unique constraint on username (nullable, so multiple NULLs are allowed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_unique') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;
