# TraderOS — Enterprise Architecture

> Living document. Updated as the foundation evolves.

## 1. Current Architecture (Pre-Foundation Audit)

### 1.1 Project Structure

```
app/                      Next.js 13 App Router (single route: /)
  layout.tsx              Root layout: ThemeProvider → TimezoneProvider → AuthProvider
  page.tsx                Single-page shell: sidebar + topbar + active module
  globals.css             Tailwind layers + CSS variables (dark/light themes)
components/
  modules/                12 feature modules (dashboard, journal, analytics, …)
  ui/                     shadcn/ui primitives (button, dialog, table, …) — 40+ components
  auth-page.tsx           Landing + sign-in/sign-up
  auth-provider.tsx       Supabase auth context
  theme-provider.tsx      Dark/light toggle (localStorage)
  timezone-provider.tsx   Timezone context + formatters
  sidebar.tsx             Desktop sidebar + mobile bottom nav
  topbar.tsx              Search, clock, theme toggle, notifications
  stat-card.tsx           Reusable KPI card
  plan-modal.tsx          Subscription upgrade flow
lib/
  supabase.ts             Supabase client + all domain types (Trade, Profile, …)
  analytics.ts            computeMetrics() — pure function, 200+ metrics
  instruments.ts          Instrument specs (pip size, contract size, category)
  format.ts               Currency / date / number formatters
  utils.ts                cn() class merge helper
supabase/
  migrations/             5 SQL migrations (trades, brokers, profiles, email, achievements)
  functions/              2 edge functions (ai-chat, sync-to-sheets)
```

### 1.2 Frontend

- **Framework**: Next.js 13.5 (App Router), React 18, TypeScript 5.2
- **Styling**: Tailwind CSS 3.3 + CSS variables (HSL color tokens) + `tailwindcss-animate`
- **Components**: shadcn/ui (Radix primitives + CVA) — 40+ primitives in `components/ui/`
- **Icons**: `lucide-react` (single icon library — good)
- **Fonts**: `Inter` via `next/font/google`
- **Charts**: `recharts` 2.12
- **Forms**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **State**: Local React state + Context (Auth, Theme, Timezone). No global store.
- **Routing**: Single-page — `active` module state in `page.tsx` switches between modules. No Next.js route segments.

### 1.3 Backend

- **Database**: Supabase (Postgres). 5 migrations applied.
- **Auth**: Supabase Auth (email/password). `onAuthStateChange` with async guard.
- **Edge Functions**: 2 Deno functions — `ai-chat` (OpenAI proxy), `sync-to-sheets` (Google Sheets webhook).
- **API pattern**: Client talks to Supabase directly via anon key. Edge functions proxy external APIs.

### 1.4 Database Schema

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

**Note**: Trading tables are currently single-tenant (`USING (true)`). Profiles/subscriptions/achievements/chat are owner-scoped. This is a known split — future migration to owner-scoped trading data is planned.

### 1.5 AI Features

- **AI Coach** (`components/modules/coach.tsx`): Generates insights from trade history via edge function.
- **AI Chat** (`components/modules/chat.tsx`): Conversational assistant with trade context.
- **AI Insights**: Stored in `ai_insights` table, displayed on dashboard.
- **News** (`components/modules/news.tsx`): AI-curated financial news with sentiment.

### 1.6 Integrations

- **Brokers**: MT4, MT5, cTrader, DXtrade, MatchTrader, Binance, Bybit, OANDA, IBKR (UI connections in `brokers.tsx`).
- **External APIs**: OpenAI (via `ai-chat` edge function), Google Sheets (via `sync-to-sheets`).
- **Auth provider**: Supabase Auth (email/password only).

---

## 2. Strengths

1. **Clean module separation** — 12 modules in `components/modules/`, each self-contained.
2. **Pure analytics engine** — `computeMetrics()` is a pure function, easy to test and reuse.
3. **Comprehensive design tokens** — CSS variables for dark/light themes already in `globals.css`.
4. **Full shadcn/ui library** — 40+ primitives already installed, no need to build from scratch.
5. **Type-safe domain model** — All Supabase types defined in `lib/supabase.ts`.
6. **Single icon library** — `lucide-react` throughout, no mixing.
7. **Edge function pattern** — External API calls proxied correctly via Deno functions.
8. **Responsive shell** — Desktop sidebar + mobile bottom nav.

## 3. Weaknesses & Technical Debt

1. **No centralized design-token file** — Colors live in `globals.css` but spacing/radius/shadows are ad-hoc Tailwind values, not tokens.
2. **Theme engine is minimal** — Only dark/light toggle, no `system` option, no SSR-safe hydration (flash of wrong theme possible).
3. **No event bus** — Modules can't react to cross-cutting events (trade created, account synced) without prop drilling.
4. **Module switching is a giant switch** — `page.tsx` has 12 conditional renders; no lazy loading.
5. **No chart wrapper** — Recharts is used directly in each module; no shared theme-aware wrapper.
6. **No empty/error/loading component library** — Each module reinvents spinner states.
7. **Branding is hardcoded** — Logo, app name, colors are inline in `sidebar.tsx` and `auth-page.tsx`.
8. **No barrel exports** — Deep import paths (`@/components/modules/dashboard`) everywhere.
9. **Trading data is single-tenant** — `USING (true)` on trading tables; not yet owner-scoped (planned).
10. **No code splitting** — All 12 modules load eagerly on the dashboard page.

## 4. Refactoring Opportunities

1. **Extract design tokens** → `lib/design-tokens.ts` (single source of truth for spacing, radius, shadows, motion).
2. **Enhance theme engine** → Support `system`, SSR-safe, centralized `brand` config.
3. **Add Event/Intelligence Bus** → `lib/event-bus.ts` for decoupled module communication.
4. **Lazy-load modules** → `next/dynamic` per module to reduce initial bundle.
5. **Create chart wrappers** → `components/charts/` with theme-aware recharts wrappers.
6. **Standardize state components** → EmptyState, ErrorState, LoadingState, Skeleton.
7. **Centralize branding** → `lib/brand.ts` (name, logo, colors, metadata).
8. **Add barrel exports** → `components/ui/index.ts`, `components/modules/index.ts`.

## 5. Reusable Components

Already reusable: `StatCard`, all `components/ui/*` (shadcn primitives), `cn()`, `computeMetrics()`, `getSpec()`, `pipValuePerLot()`, format helpers.

## 6. Performance Notes

- **Bundle**: All modules eagerly imported in `page.tsx`. Lazy loading will help.
- **Charts**: Recharts is heavy; wrappers can enable tree-shaking and shared theming.
- **No memoization**: `computeMetrics()` runs on every render in analytics; consider `useMemo`.

---

## 7. Enterprise Architecture (Post-Foundation)

### 7.1 Module Map

```
lib/
  design-tokens.ts        Centralized spacing, radius, shadow, motion tokens
  brand.ts               TraderOS brand config (name, logo, colors, metadata)
  event-bus.ts           Event & Intelligence Bus (pub/sub)
  module-registry.ts      Module metadata + lazy-load helpers
  supabase.ts             (existing) Supabase client + domain types
  analytics.ts           (existing) Metrics engine
  instruments.ts         (existing) Instrument specs
  format.ts              (existing) Formatters
  utils.ts               (existing) cn()
components/
  theme-provider.tsx     (enhanced) system/dark/light + SSR-safe
  brand/                 BrandLogo, BrandMark components
  feedback/              EmptyState, ErrorState, LoadingState, PageSkeleton
  charts/                ChartContainer, LineChart, BarChart, AreaChart wrappers
  layout/                PageContainer, SectionHeader (extracted patterns)
  modules/               (existing) 12 feature modules
  ui/                    (existing) shadcn primitives
docs/
  ARCHITECTURE.md        This file
  DESIGN-SYSTEM.md       Design system reference
  COMPONENTS.md          Component library reference
```

### 7.2 Event & Intelligence Bus

A lightweight pub/sub system that decouples modules from each other. Events flow:

```
Journal (trade created) → EventBus.emit('trade:created', trade)
  → Analytics engine recomputes metrics
  → AI Coach regenerates insights
  → Dashboard refreshes KPIs
  → Achievements engine checks milestones
```

Consumers subscribe via `useEvent('trade:created', handler)`. No tight coupling between modules.

### 7.3 Conventions

- **Folder structure**: `lib/` for framework-agnostic logic, `components/` for React, `components/ui/` for primitives, `components/modules/` for features, `components/feedback/` for state components, `components/charts/` for chart wrappers.
- **Naming**: PascalCase components, camelCase functions, kebab-case files for non-component libs.
- **Types**: Domain types in `lib/supabase.ts`. UI types co-located with components.
- **Imports**: Use `@/` alias. Barrel exports for `components/ui/` and `components/feedback/`.

### 7.4 Future Scalability

- Modules can be split into separate Next.js route segments when needed.
- Event bus enables adding new AI consumers without touching existing modules.
- Design tokens make rebranding a config change, not a code change.
- Chart wrappers make swapping charting libraries a one-file change.
