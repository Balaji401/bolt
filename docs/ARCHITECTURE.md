# TraderOS — Architecture

> Living document. Updated as the foundation evolves.

## 1. Project Structure

```
src/
  App.tsx                 Root: ThemeProvider → TimezoneProvider → AuthProvider → ErrorBoundary
  main.tsx                Vite entry point
  index.css               Tailwind layers + CSS variables (dark/light themes)
  vite-env.d.ts           Vite client type reference
  components/
    modules/              12 feature modules (dashboard, journal, analytics, …)
    ui/                   shadcn/ui primitives (button, card, dialog, input, …)
    brand/                BrandLogo, BrandMark
    charts/               Theme-aware Recharts wrappers
    feedback/             EmptyState, ErrorState, LoadingState, PageSkeleton, Spinner
    auth-page.tsx          Landing + sign-in/sign-up
    auth-provider.tsx     Supabase auth context
    theme-provider.tsx    Dark/light/system toggle (localStorage)
    timezone-provider.tsx Timezone context + formatters
    sidebar.tsx           Desktop sidebar + mobile bottom nav
    topbar.tsx            Search, clock, theme toggle, notifications
    breadcrumbs.tsx       Navigation breadcrumbs
    command-palette.tsx   Ctrl+K global search
    error-boundary.tsx    Error boundary wrapper
  lib/
    supabase.ts           Supabase client + all domain types
    analytics.ts          computeMetrics() — pure function, 200+ metrics
    instruments.ts        Instrument specs (pip size, contract size, category)
    format.ts             Currency / date / number formatters
    utils.ts              cn() class merge helper
    brand.ts              TraderOS brand config
    design-tokens.ts      Spacing, radius, shadow, motion tokens
    event-bus.ts          Event & Intelligence Bus (pub/sub)
    feature-flags.ts      24 tier-based feature flags
    logger.ts             Structured logger with audit trail
    module-registry.ts    20 module metadata entries
    search.ts             NLP search engine
    validation.ts         Zod schemas
supabase/
  migrations/             5 SQL migrations
  functions/              2 edge functions (ai-chat, sync-to-sheets)
docs/
  ARCHITECTURE.md          This file
  DESIGN-SYSTEM.md         Design system reference
  COMPONENTS.md            Component library reference
  CONFIGURATION.md         Configuration reference
  DEVELOPER.md             Developer guide
  EVENTS.md                Event bus reference
  NAVIGATION.md            Navigation framework reference
  SEARCH.md                Search engine reference
```

## 2. Frontend

- **Framework**: Vite 5.4 + React 18 + TypeScript 5.6
- **Styling**: Tailwind CSS 3.4 + CSS variables (HSL color tokens) + `tailwindcss-animate`
- **Components**: shadcn/ui pattern (Radix primitives + CVA)
- **Icons**: `lucide-react`
- **Fonts**: `Inter` via Google Fonts
- **Charts**: `recharts` 2.12 with theme-aware wrappers
- **Forms**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **State**: Local React state + Context (Auth, Theme, Timezone). No global store.
- **Routing**: Single-page — `active` module state in `App.tsx` switches between modules.

## 3. Backend

- **Database**: Supabase (Postgres). 5 migrations applied.
- **Auth**: Supabase Auth (email/password). `onAuthStateChange` with async guard.
- **Edge Functions**: 2 Deno functions — `ai-chat` (OpenAI proxy), `sync-to-sheets` (Google Sheets webhook).
- **API pattern**: Client talks to Supabase directly via anon key. Edge functions proxy external APIs.

## 4. Database Schema

| Table | Scope | Purpose |
|---|---|---|
| `trades` | shared (anon+auth) | Every executed trade + enhanced journaling fields |
| `trading_plan` | shared | Daily/weekly/monthly plans, checklists, rules |
| `psychology_logs` | shared | Daily psychology check-ins |
| `trading_goals` | shared | Measurable goals with progress |
| `ai_insights` | shared | AI-generated coaching insights |
| `broker_connections` | shared | Connected broker accounts (MT4/MT5/cTrader/Binance…) |
| `open_positions` | shared | Live open positions from brokers |
| `profiles` | owner-scoped | Display name, avatar, plan tier |
| `subscriptions` | owner-scoped | Plan tier, billing period, status |
| `email_signups` | shared | Email capture → Google Sheets sync |
| `achievements` | owner-scoped | Earned badges per user |
| `ai_chat_messages` | owner-scoped | AI chat history per session |

## 5. Module Inventory

| Module | Status | Notes |
|---|---|---|
| Dashboard | Complete | KPI cards, equity curve, recent trades, AI insights, open positions, goals |
| Trading Journal | Complete | Trade list, add/edit/delete, search/filter |
| Analytics | Complete | 12 stat cards, daily P&L, session/instrument/direction breakdown |
| Risk Management | Complete | Position size calculator with live results |
| AI Coach | Complete | Insight generation with local fallback |
| AI Chat | Complete | Chat interface with edge function + fallback |
| Psychology | Complete | Daily check-in with 7 metric sliders |
| Achievements | Complete | 12 achievements with earned/locked states |
| Plan | Complete | Trading goals CRUD with progress bars |
| Calendar | Complete | Economic calendar with sample events |
| News | Complete | News center with sample articles |
| Brokers | Complete | Broker connections, add/remove/sync, open positions |

## 6. Event & Intelligence Bus

A lightweight pub/sub system that decouples modules from each other. Events flow:

```
Journal (trade created) → EventBus.emit('trade:created', trade)
  → Analytics engine recomputes metrics
  → AI Coach regenerates insights
  → Dashboard refreshes KPIs
  → Achievements engine checks milestones
```

Consumers subscribe via `useEvent('trade:created', handler)`.

## 7. Conventions

- **Folder structure**: `lib/` for framework-agnostic logic, `components/` for React, `components/ui/` for primitives, `components/modules/` for features.
- **Naming**: PascalCase components, camelCase functions, kebab-case files for non-component libs.
- **Types**: Domain types in `lib/supabase.ts`. UI types co-located with components.
- **Imports**: Use `@/` alias (resolves to `./src/`).
