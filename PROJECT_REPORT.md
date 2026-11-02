# TraderOS — Project Report

## 1. Modules wired into the app

The sidebar lists 23 modules in the registry, but only 17 are actually wired to a screen in `App.tsx`. The rest render the generic "Coming Soon" placeholder.

| Module key | Wired? | What it does |
|---|---|---|
| dashboard | Yes | Trading command center — shows recent trades, AI insights, open positions, and goals at a glance. |
| journal | Yes | Trading journal — add/edit/annotate every trade with notes, screenshots, mistakes, and lessons. |
| analytics | Yes | Performance analytics — equity curve, breakdowns, comparison tools, and recent performance. |
| risk | Yes | Risk management — risk dashboard, calculators, drawdown analysis, risk rules, alerts, and behavior stats. |
| coach | Yes | AI trading coach — generates and shows AI insights based on your trade history. |
| chat | Yes | AI chat assistant — ask questions about your trades; backed by the `ai-chat` edge function. |
| psychology | Yes | Trading psychology — daily journal, weekly/monthly reviews, emotion tracker, habit tracker, mistake library, goal manager, discipline tracker, trade reviews. |
| strategy | Yes | Strategy management — build strategies, setups, playbooks, checklists, versions, attachments, and view performance. |
| achievements | Yes | Gamified milestones — badges earned based on trading activity. |
| ai_intelligence | Yes | AI Intelligence suite — trader profile, behavior patterns/timeline, correlations, comparisons, memory, recommendations, trading score, enhanced insights, intelligence reports, and trade/psychology reviews. |
| brokers | Yes | Broker sync — connect broker accounts and import trades via CSV import wizard. |
| accounts | Yes | Trading accounts — manage accounts across brokers and prop firms (manual, MT4/5, cTrader, etc.). |
| plan | Yes | Trading plan — define rules, risk limits, and checklists. |
| market_context | Yes | Market context — economic calendar, news, trading sessions, and watchlist (seeded data by default). |
| reports | Yes | Reports & reviews — generate, export, and schedule trading reports. |
| automation | Yes | Automation & notifications — create rules that trigger notifications and actions. |
| settings | Yes | Workspace settings — configure profile, timezone, currency, theme, and preferences. |
| strategy_intelligence | No (Coming Soon) | Listed as a Pro-tier deep strategy performance analysis screen; not implemented. |
| decision_intelligence | No (Coming Soon) | Listed as a Pro-tier pre-trade decision support engine; not implemented. |
| market_intelligence | No (Coming Soon) | Listed as a Pro-tier market structure/sentiment analysis screen; not implemented. |
| multi_account_intelligence | No (Coming Soon) | Listed as an Elite-tier aggregate analytics screen; not implemented. |
| prop_firms | No (Coming Soon) | Listed as a Pro-tier prop-firm challenge/rules tracker; not implemented. |
| admin | No (Coming Soon) | Listed as an admin-only system administration panel; not implemented. |

In addition, three placeholder "future intelligence" cards are embedded inside existing modules:
- `components/analytics/ai-placeholders.tsx` — "Future Performance Intelligence" tiles inside Analytics.
- `components/psychology/ai-placeholders.tsx` — "Future Psychology Intelligence" tiles inside Psychology.
- `components/strategy/ai-placeholders.tsx` — "Future Strategy Intelligence" tiles inside Strategy.

## 2. Database tables and whether they have a `user_id` column

All tables below were created across 17 migrations. "user_id?" means a `user_id` column exists.

| Table | user_id? | Notes |
|---|---|---|
| trades | No | Core trade log; extended across several migrations with journaling, market, import-tracking, and archive columns. Ownerless/shared by design. |
| trading_plan | No | Daily/weekly/monthly plan with checklists and rules. Ownerless/shared. |
| psychology_logs | No | Legacy daily psychology check-ins (confidence, fear, greed, FOMO, discipline). Ownerless/shared. |
| trading_goals | No | Measurable goals with target/progress. Ownerless/shared. |
| ai_insights | Yes (added later) | Originally ownerless; migration `20260905051115` added `user_id` (NOT NULL, default `auth.uid()`), `workspace_id`, confidence, evidence_refs, feedback, generated_at. |
| broker_connections | No | Connected broker accounts. Ownerless/shared. |
| open_positions | No | Live open positions synced from brokers. Ownerless/shared. |
| profiles | Yes | Display name, avatar, plan tier, full name, username, timezone, currency, language, experience, last login, account status, soft-delete. |
| subscriptions | Yes | Subscription plan, status, billing period. |
| email_signups | Yes (nullable) | Pre-signup email capture; `user_id` nullable, links to auth.users once account exists. |
| achievements | Yes | Earned badges per user. |
| ai_chat_messages | Yes | AI chat history per user session. |
| workspaces | Yes | Personal workspace (team type reserved for future). |
| trading_accounts | Yes | Trading accounts within a workspace. |
| trade_tags | Yes | User-created custom tag library. |
| import_jobs | Yes | CSV/import job tracking. |
| import_errors | No (scoped via import_jobs) | Row-level import errors; ownership checked through `import_jobs` join. |
| csv_mapping_templates | Yes | Saved per-broker CSV column mappings. |
| risk_rules | Yes | User risk-management rule set per workspace. |
| risk_alerts | Yes | Generated risk alerts. |
| daily_journals | Yes | Daily pre/post trading journal entries. |
| weekly_reviews | Yes | Weekly review entries. |
| monthly_reviews | Yes | Monthly review entries. |
| habits | Yes | Recurring trading habits. |
| habit_logs | Yes | Daily habit completion logs. |
| mistakes | Yes | User's mistake library. |
| trade_reviews | Yes | Structured per-trade review. |
| custom_emotions | Yes | User-defined emotion tags. |
| strategies | Yes | Trading strategies with rules, conditions, metadata. |
| strategy_versions | Yes | Version history snapshots for strategies. |
| trade_setups | Yes | Setups belonging to a strategy. |
| playbooks | Yes | Trading playbooks with checklists and golden rules. |
| checklist_templates | Yes | Reusable checklist templates. |
| strategy_attachments | Yes | File/link attachments for strategies. |
| strategy_categories | Yes | Custom strategy categories. |
| ai_conversations | Yes | AI chat conversation session metadata. |
| ai_memory | Yes | Long-term AI memory entries. |
| ai_reviews | Yes | Structured AI reviews (trade, psychology, goal, weekly, monthly, daily). |
| ai_scores | Yes | Trading/psychology/discipline/risk/overall scores over time. |
| ai_recommendations | Yes | Personalized, data-backed AI recommendations. |
| ai_insight_evidence | Yes | Evidence backing for AI insights. |
| ai_behavior_patterns | Yes | Detected behavior patterns (revenge trading, FOMO, overtrading, etc.). |
| ai_trader_profile | Yes | Aggregated trader profile (style, markets, strengths, weaknesses). |
| ai_behavior_events | Yes | Timeline of behavior/risk/drawdown/streak changes. |
| ai_insight_feedback | Yes | User feedback on AI insights. |
| report_templates | Yes | Reusable report templates. |
| report_history | Yes | Generated report records. |
| scheduled_reports | Yes | Scheduled report generation config. |
| automations | Yes | Automation rules (trigger, conditions, actions, schedule). |
| automation_executions | Yes | Execution history for automations. |
| notifications | Yes | User notifications (risk, trading, journal, goals, reports, ai, system). |
| notification_preferences | Yes | Per-user per-category notification preferences. |
| daily_checklists | Yes | Daily trading checklist (one per user per day). |

## 3. Row-level-security policies allowing `anon` or `USING (true)`

These are the policies that either grant access to the `anon` role or use `USING (true)` (i.e. no per-user ownership check at the row level).

### trades
- `anon_select_trades` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_trades` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_trades` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_trades` — DELETE `TO anon, authenticated USING (true)`

### trading_plan
- `anon_select_plan` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_plan` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_plan` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_plan` — DELETE `TO anon, authenticated USING (true)`

### psychology_logs
- `anon_select_psych` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_psych` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_psych` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_psych` — DELETE `TO anon, authenticated USING (true)`

### trading_goals
- `anon_select_goals` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_goals` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_goals` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_goals` — DELETE `TO anon, authenticated USING (true)`

### ai_insights (original policies, replaced later)
- `anon_select_insights` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_insights` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_insights` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_insights` — DELETE `TO anon, authenticated USING (true)`

  Note: migration `20260905051115` later drops these and replaces them with owner-scoped `select_own_ai_insights` / `insert_own_ai_insights` / `update_own_ai_insights` / `delete_own_ai_insights` (all `TO authenticated` with `auth.uid() = user_id`). The original `anon` policies are removed by the later migration.

### broker_connections
- `anon_select_brokers` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_brokers` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_brokers` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_brokers` — DELETE `TO anon, authenticated USING (true)`

### open_positions
- `anon_select_positions` — SELECT `TO anon, authenticated USING (true)`
- `anon_insert_positions` — INSERT `TO anon, authenticated WITH CHECK (true)`
- `anon_update_positions` — UPDATE `TO anon, authenticated USING (true) WITH CHECK (true)`
- `anon_delete_positions` — DELETE `TO anon, authenticated USING (true)`

### email_signups
- `anon_insert_email_signup` — INSERT `TO anon, authenticated WITH CHECK (true)` (intentional — captures pre-signup email intent before a user exists)

All other tables (profiles, subscriptions, achievements, ai_chat_messages, workspaces, trading_accounts, trade_tags, import_jobs, import_errors, csv_mapping_templates, risk_rules, risk_alerts, daily_journals, weekly_reviews, monthly_reviews, habits, habit_logs, mistakes, trade_reviews, custom_emotions, strategies, strategy_versions, trade_setups, playbooks, checklist_templates, strategy_attachments, strategy_categories, ai_conversations, ai_memory, ai_reviews, ai_scores, ai_recommendations, ai_insight_evidence, ai_behavior_patterns, ai_trader_profile, ai_behavior_events, ai_insight_feedback, report_templates, report_history, scheduled_reports, automations, automation_executions, notifications, notification_preferences, daily_checklists) use owner-scoped policies restricted to `authenticated` with `auth.uid() = user_id`. None of them grant the `anon` role or use `USING (true)`.

## 4. Environment variables the app reads (names only)

Frontend (read via `import.meta.env` in `src/`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MARKET_DATA_PROVIDER`
- `VITE_MARKET_DATA_API_KEY`
- `VITE_ALPHA_VANTAGE_API_KEY`
- `NEXT_PUBLIC_MARKET_DATA_PROVIDER`
- `NEXT_PUBLIC_MARKET_DATA_API_KEY`

Edge functions (read via `Deno.env.get` in `supabase/functions/`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY`

## 5. Things that look half-finished or placeholder

- **Six unimplemented modules**: `strategy_intelligence`, `decision_intelligence`, `market_intelligence`, `multi_account_intelligence`, `prop_firms`, and `admin` are registered in the sidebar with `comingSoon: true` and fall through to the generic `ComingSoon` component. No backing code exists for any of them.
- **Three "Future Intelligence" placeholder card groups** are embedded inside otherwise-finished modules:
  - `components/analytics/ai-placeholders.tsx` inside Analytics.
  - `components/psychology/ai-placeholders.tsx` inside Psychology.
  - `components/strategy/ai-placeholders.tsx` inside Strategy — explicitly labels features as "SOON".
- **Market context is seeded, not live**: `market-context.ts` defaults to `MARKET_PROVIDER_MODE = 'seeded'` and falls back to a `'demo'` API key. The `.env.example` shows live-provider keys are optional and left blank. There is no live data integration wired up.
- **AI chat depends on an optional OpenAI key**: the `ai-chat` edge function reads `OPENAI_API_KEY` from env and the code paths suggest it can fall back when the key is absent, but no key is configured by default, so the chat feature may be non-functional without setup.
- **Google Sheets sync is stubbed**: the `sync-to-sheets` edge function requires `GOOGLE_SHEETS_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY`, neither of which is configured by default. The `email_signups` table has a `sheets_synced` flag, but no live sync is wired.
- **Workspace `team` type is reserved but unused**: the `workspaces.workspace_type` CHECK allows `'team'`, but the migration notes explicitly say team logic is not implemented.
- **`is_default` on trading_accounts is documented as "future phases"**: the column exists and is set, but the dashboard/journal don't yet use it to pick a default account.
- **Legacy ownerless tables still present**: `trades`, `trading_plan`, `psychology_logs`, `trading_goals`, `broker_connections`, and `open_positions` were created as shared/demo data with `anon` access and no `user_id`. Later migrations added owner-scoped equivalents (daily_journals, trade_reviews, etc.), but the originals were never migrated to be owner-scoped, so the app has two parallel data models for psychology/journaling that overlap.
- **Two filenames have a doubled `.sql` suffix**: `20260804093226_add_user_management_columns.sql.sql`, `20260804094220_create_workspaces_trading_accounts.sql.sql`, `20260806085157_add_trade_tags_and_extended_fields.sql.sql`, and `20260806090059_add_import_infrastructure.sql.sql`. They are harmless but look like copy-paste naming slips.
- **A Python `traderos_agent` package and a `tests/` folder exist** (`src/traderos_agent/`, `tests/test_agent.*`) with compiled bytecode, but they are not referenced by the web app or build — they appear to be an abandoned or experimental separate agent, not wired into TraderOS.
