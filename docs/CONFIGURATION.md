# TraderOS Platform Configuration

## Overview

All application configuration is centralized in `lib/config.ts` and accessed via `ConfigProvider`.

## Configuration Categories

### Application
- `theme` — dark / light / system
- `language` — UI language (ISO code)
- `currency` — display currency (USD, EUR, GBP, JPY, etc.)
- `timezone` — timezone identifier or "auto"
- `date_format` — date display format
- `number_format` — locale for number formatting

### Notifications
- `trade_reminders` — remind to journal trades
- `economic_events` — alert before high-impact events
- `ai_insights` — notify when new insights are generated
- `goal_milestones` — notify on goal progress
- `broker_sync_alerts` — notify on sync completion/failure
- `email_digest` — weekly email summary

### AI Preferences
- `ai_coach_enabled` — enable/disable AI Coach
- `ai_chat_enabled` — enable/disable AI Chat
- `ai_insights_frequency` — realtime / daily / weekly
- `openai_model` — gpt-4o / gpt-4o-mini / gpt-4-turbo

### Trading Preferences
- `default_instrument` — default instrument for new trades
- `default_session` — default trading session
- `default_risk_percent` — default risk per trade (%)
- `default_account_size` — default account size
- `default_direction` — long / short / both
- `confirm_before_delete` — confirmation dialog

### Broker Preferences
- `auto_sync_interval` — sync frequency (minutes)
- `sync_on_startup` — sync when app loads
- `notify_on_sync` — notification on sync

### Risk Defaults
- `max_risk_per_trade` — max % of account per trade
- `max_daily_loss` — max daily loss (%)
- `max_weekly_loss` — max weekly loss (%)
- `max_open_positions` — max concurrent positions
- `require_stop_loss` — enforce SL on all trades
- `require_take_profit` — enforce TP on all trades

### Psychology Settings
- `daily_checkin_reminder` — remind to do daily check-in
- `checkin_time` — time for reminder (HH:MM)
- `tilt_detection` — enable tilt detection
- `discipline_scoring` — enable discipline scoring

### Analytics Preferences
- `default_timeframe` — 7d / 30d / 90d / ytd / all
- `show_weekends` — include weekends in charts
- `benchmark_symbol` — benchmark for comparison
- `include_pending` — include pending trades in metrics

### Import Settings
- `default_format` — csv / mt4 / mt5 / ctrader / binance
- `skip_duplicates` — skip duplicate imports
- `auto_map_instruments` — auto-map instrument names
- `require_confirmation` — confirm before importing

### Security Settings
- `two_factor_required` — require 2FA
- `session_timeout_minutes` — auto-logout after inactivity
- `api_key_rotation_days` — remind to rotate API keys

### Developer Settings
- `debug_mode` — show debug info
- `show_event_log` — show event log panel
- `mock_api` — use mock API responses
- `verbose_logging` — enable verbose logging

## Usage

```typescript
import { useConfig } from '@/components/config-provider';

function MyComponent() {
  const { config, updateConfig, reset } = useConfig();

  // Read a value
  const currency = config.currency;

  // Update a section
  updateConfig('trading', { default_risk_percent: 2 });

  // Reset everything
  reset();
}
```

## Feature Flags (`lib/feature-flags.ts`)

Feature flags control access to functionality based on tier and category.

### Categories
- `core` — always available (to eligible tiers)
- `ai` — AI-powered features
- `intelligence` — advanced analytics engines
- `beta` — features in beta testing
- `experimental` — experimental features
- `admin` — admin-only features

### Usage

```typescript
import { isFeatureEnabled, FEATURE_FLAGS, getEnabledFeatures } from '@/lib/feature-flags';

// Check if a feature is enabled for a user
if (isFeatureEnabled('ai_coach', userTier)) {
  // Show AI Coach
}

// Get all enabled features for a tier
const features = getEnabledFeatures('pro');

// Get features by category
const aiFeatures = getFeaturesByCategory('ai', 'pro');
```

### Tier Hierarchy

`free` < `starter` < `pro` < `elite`

Features with `min_tier: 'pro'` are available to pro and elite users.

## Environment Configuration

Environment variables are managed via `.env` and Supabase secrets:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `SUPABASE_DB_URL` | Direct DB connection string |

Never expose service role keys or API secrets in client-side code.
