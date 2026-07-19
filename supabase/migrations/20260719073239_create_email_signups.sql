/*
# Create email_signups table

## Overview
Stores every user signup email with metadata for CRM, analytics, and Google Sheets sync.
This table is separate from auth.users so it can hold pre-signup intent emails, signup timestamps,
referral source, and sync status with external tools like Google Sheets.

## New Tables
1. `email_signups`
   - `id` (uuid, primary key)
   - `email` (text, unique, not null) — the user's email address
   - `display_name` (text) — optional name provided at signup
   - `user_id` (uuid, nullable) — linked to auth.users once account is created
   - `source` (text) — where the signup came from (e.g. "signup_form", "google_oauth")
   - `plan_interest` (text) — which plan the user expressed interest in
   - `sheets_synced` (boolean) — whether this row has been pushed to Google Sheets
   - `sheets_synced_at` (timestamptz) — when it was last synced to Google Sheets
   - `created_at` (timestamptz)

## Security
- RLS enabled.
- Anon INSERT allowed (to capture email intent before sign-in).
- Service role only for SELECT/UPDATE/DELETE (admin access only).
- Authenticated users can read their own row.
*/

CREATE TABLE IF NOT EXISTS email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'signup_form',
  plan_interest text,
  sheets_synced boolean NOT NULL DEFAULT false,
  sheets_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_signups_email ON email_signups(email);
CREATE INDEX IF NOT EXISTS idx_email_signups_user_id ON email_signups(user_id);
CREATE INDEX IF NOT EXISTS idx_email_signups_sheets_synced ON email_signups(sheets_synced);

ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon included) to insert their own email
DROP POLICY IF EXISTS "anon_insert_email_signup" ON email_signups;
CREATE POLICY "anon_insert_email_signup" ON email_signups
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read their own row by email
DROP POLICY IF EXISTS "auth_select_own_signup" ON email_signups;
CREATE POLICY "auth_select_own_signup" ON email_signups
  FOR SELECT TO authenticated USING (user_id = auth.uid());
