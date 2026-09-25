/*
# TraderOS: User Profiles & Subscriptions

## Overview
Adds owner-scoped tables for user accounts and subscription plans. Auth uses Supabase's built-in `auth.users` table (email/password + Google OAuth). Trading data tables remain shared demo data (anon+authenticated) so the app remains browsable without sign-in; profiles and subscriptions are owner-scoped.

## New Tables
1. `profiles` — display name, avatar URL, plan tier, linked to auth.users. Owner-scoped.
2. `subscriptions` — subscription plan, status, billing period, linked to auth.users. Owner-scoped.

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD: `TO authenticated` with `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so inserts from the authenticated client succeed without explicitly passing the owner.
*/
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  avatar_url text,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'elite')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'elite')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sub" ON subscriptions;
CREATE POLICY "select_own_sub" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sub" ON subscriptions;
CREATE POLICY "insert_own_sub" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sub" ON subscriptions;
CREATE POLICY "update_own_sub" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sub" ON subscriptions;
CREATE POLICY "delete_own_sub" ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
