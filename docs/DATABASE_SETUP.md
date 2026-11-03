# Database setup

Run the migrations in the following filename order. The combined copy is available at `supabase/all_migrations_in_order.sql`.

1. `20260718175116_create_trades_and_journal.sql` — Creates the original shared trading tables: trades, trading plans, psychology logs, trading goals, and AI insights.
2. `20260718182142_add_brokers_and_positions.sql` — Adds shared broker connections and open-position tracking.
3. `20260718183930_add_profiles_subscriptions.sql` — Adds authenticated user profiles and subscription records with owner-scoped access.
4. `20260719073239_create_email_signups.sql` — Adds email signup capture with anonymous insertion and authenticated self-read access.
5. `20260719083014_add_achievements_and_chat.sql` — Adds user achievements, AI chat messages, and extended journaling fields to trades.
6. `20260804093226_add_user_management_columns.sql.sql` — Adds profile management fields such as name, username, timezone, language, login time, and account status.
7. `20260804094220_create_workspaces_trading_accounts.sql.sql` — Adds personal workspaces and owner-scoped trading accounts.
8. `20260806085157_add_trade_tags_and_extended_fields.sql.sql` — Adds user-owned trade tags and market, timeframe, risk, and archive fields to trades.
9. `20260806090059_add_import_infrastructure.sql.sql` — Adds import jobs, import errors, CSV mapping templates, and broker import fields on trades.
10. `20260807061659_create_risk_rules_and_alerts.sql` — Adds per-workspace risk rules and generated risk alerts.
11. `20260808062136_create_psychology_journal_tables.sql` — Adds daily journals, weekly/monthly reviews, habits, habit logs, mistakes, trade reviews, and custom emotions.
12. `20260902050053_create_strategy_management_tables.sql` — Adds strategies, versions, setups, playbooks, checklist templates, attachments, and categories.
13. `20260904042610_create_ai_intelligence_tables.sql` — Adds AI conversations, memory, reviews, scores, and recommendations.
14. `20260905051115_add_ai_decision_intelligence_tables.sql` — Converts AI insights to owner-scoped records and adds evidence, behavior patterns, trader profiles, behavior events, and feedback.
15. `20260906061512_create_reports_tables.sql` — Adds report templates, report history, and scheduled reports.
16. `20260911035858_create_automation_notification_tables.sql` — Adds automations, execution history, notifications, and notification preferences.
17. `20261025033400_create_daily_checklist.sql` — Adds one owner-scoped daily checklist per user and date.

## Empty-database review

No migration has an obvious failure when applied to a freshly provisioned Supabase database in this order. The required `auth.users` table and standard Postgres/Supabase functions such as `gen_random_uuid()` are provided by Supabase.

The later migrations depend on earlier migrations having run first. In particular, workspaces must exist before risk, psychology, strategy, AI, reports, automation, and checklist tables are created; profiles must exist before its management columns are added; and import jobs must exist before trades receive their import-job foreign key.

The four filenames ending in `.sql.sql` are naming mistakes, but they do not make the SQL fail when the files are executed. The combined file preserves those names in separator comments while containing the SQL in the same filename order.

The database still has an important design concern rather than an empty-database failure: the first migration intentionally creates shared, anonymous-access tables for trades, plans, psychology logs, goals, and broker data. Later migrations create owner-scoped tables alongside them instead of converting those original tables. That will apply successfully, but it leaves two different ownership models in the finished database.
