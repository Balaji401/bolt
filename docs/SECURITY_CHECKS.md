# Supabase security checks

These checks are read-only. Paste each SQL query into the Supabase SQL Editor and run it against the project database. They inspect the current database catalog, including policies that may have been changed after the migration files were created.

## A. List every public table and whether RLS is enabled

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS row_level_security_enabled
FROM pg_class AS c
JOIN pg_namespace AS n
  ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;
```

`row_level_security_enabled = true` means RLS is enabled for that table. This query lists ordinary tables only, not views or materialized views.

## B. List every policy, its roles, and its expressions

```sql
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  cmd AS command,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

The `roles` column shows the database roles targeted by the policy. `using_expression` is the row filter used for SELECT, UPDATE, and DELETE. `with_check_expression` is the row filter used to validate inserted or updated rows. A null expression means that policy type has no expression recorded.

## C. Flag anonymous/public access and unconditional expressions

```sql
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  cmd AS command,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression,
  (
    'anon' = ANY (roles)
    OR 'public' = ANY (roles)
  ) AS has_anon_or_public_role,
  (
    lower(regexp_replace(coalesce(qual, ''), '\\s+', '', 'g')) IN ('true', '(true)')
    OR lower(regexp_replace(coalesce(with_check, ''), '\\s+', '', 'g')) IN ('true', '(true)')
  ) AS has_unconditional_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    'anon' = ANY (roles)
    OR 'public' = ANY (roles)
    OR lower(regexp_replace(coalesce(qual, ''), '\\s+', '', 'g')) IN ('true', '(true)')
    OR lower(regexp_replace(coalesce(with_check, ''), '\\s+', '', 'g')) IN ('true', '(true)')
  )
ORDER BY tablename, policyname;
```

Any returned row deserves review. Anonymous/public roles may be intentional for a public feature, but they are unsafe for private user records. A `true` USING expression allows every row covered by that policy; a `true` WITH CHECK expression allows any inserted or updated row value covered by that policy.

## Two-user ownership test

This test verifies that user-owned records are isolated from one signed-in user to another. Use two separate accounts:

1. Create or use two test accounts: **Tester A** and **Tester B**. Do not use the same browser session for both users. Use a separate browser profile or private window for Tester B.
2. Sign in as Tester A.
3. Open the Trading Journal and add exactly one clearly identifiable trade, for example instrument `SECURITY-TEST-A`, with a unique note such as `Created by Tester A for RLS test`.
4. Confirm the trade appears for Tester A. Record its visible identifier if the screen shows one.
5. Sign out of Tester A completely.
6. Sign in as Tester B in the separate browser profile/window.
7. Open the Trading Journal and search or refresh the trade list.
8. **Expected read result:** Tester B must see no trades belonging to Tester A. If the app displays a total count or dashboard summary, Tester A's test trade must not be included.
9. If the app exposes a trade identifier or direct record action, attempt to edit Tester A's trade while signed in as Tester B. Change only the test note, then save.
10. **Expected edit result:** the update must be rejected by the database or affect zero rows. Tester A's original note must remain unchanged.
11. Attempt to delete Tester A's trade while signed in as Tester B.
12. **Expected delete result:** the delete must be rejected by the database or affect zero rows. Tester A's trade must still exist when Tester A signs back in.
13. Sign back in as Tester A and verify the original trade and original note are still present.
14. Clean up the test record only by signing in as Tester A and deleting the trade that Tester A created.

### Interpreting a failure

- If Tester B can see Tester A's trade, the SELECT policy is too broad, the table may be intentionally shared, or the app is querying a shared table instead of an owner-scoped table.
- If Tester B can edit or delete Tester A's trade, the UPDATE or DELETE policy is missing an ownership condition, or the application is using an overly privileged server path.
- If Tester B gets a successful-looking response but nothing changes, also check that the table has an UPDATE policy and a SELECT policy; PostgreSQL may require both for an update to find and change a row.

### Important expectation for this project

The current migration history intentionally defines `trades` without a `user_id` column and grants `anon, authenticated` policies using `true`. Therefore, this two-user test is expected to fail for the current `trades` table: Tester B can see and modify the shared trade data. This document does not change that database design; it records the test that should pass after trade ownership and its RLS policies are implemented.
