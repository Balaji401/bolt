# TraderOS Developer Framework

## Folder Structure

```
app/                      Next.js App Router
  layout.tsx              Root layout (Theme → Timezone → Config → ErrorBoundary → Auth)
  page.tsx                Main shell (sidebar + topbar + active module)
  globals.css             Tailwind + CSS variables

components/
  ui/                     shadcn/ui primitives (40+ components)
  modules/                Feature modules (12 existing + enterprise)
  feedback/               EmptyState, ErrorState, LoadingState, PageSkeleton, Spinner
  charts/                 ChartContainer, LineChart, AreaChart, BarChart wrappers
  layout/                 PageContainer, SectionHeader
  brand/                  BrandLogo, BrandMark
  auth-page.tsx           Landing + sign-in/sign-up
  auth-provider.tsx       Supabase auth context
  config-provider.tsx     Platform configuration context
  theme-provider.tsx      Dark/light/system theme
  timezone-provider.tsx   Timezone + formatters
  sidebar.tsx             Desktop sidebar + mobile nav
  topbar.tsx              Header with search, clock, theme, notifications
  breadcrumbs.tsx         Auto-generated breadcrumbs
  command-palette.tsx     Global search + quick actions (Ctrl+K)
  error-boundary.tsx      Global error boundary
  plan-modal.tsx          Subscription upgrade flow
  stat-card.tsx           KPI card

lib/
  supabase.ts             Supabase client + domain types
  config.ts               Platform configuration schema + defaults
  feature-flags.ts        Feature flag registry + tier-based access
  event-bus.ts            Event & Intelligence Bus (pub/sub + audit)
  logger.ts               Centralized logger with levels + audit trail
  validation.ts           Zod validation schemas (shared client/server)
  search.ts               Global search engine + NLP parser
  module-registry.ts      Module metadata + lazy loading
  brand.ts                Brand identity config
  design-tokens.ts        Spacing, radius, shadows, motion tokens
  analytics.ts            Metrics engine (computeMetrics)
  instruments.ts          Instrument specs
  format.ts               Formatters
  utils.ts                cn() class merge

docs/
  ARCHITECTURE.md         System architecture
  DESIGN-SYSTEM.md        Design tokens reference
  COMPONENTS.md           Component library reference
  DEVELOPER.md            This file — developer guidelines
  EVENTS.md              Event bus reference
  NAVIGATION.md           Navigation framework reference
  SEARCH.md               Search engine reference
  CONFIGURATION.md        Configuration + feature flags reference

supabase/
  migrations/             SQL migrations (5 applied)
  functions/              Edge functions (ai-chat, sync-to-sheets)
```

## Naming Conventions

- **Components**: PascalCase (`Dashboard.tsx`, `StatCard.tsx`)
- **Functions**: camelCase (`computeMetrics`, `formatCurrency`)
- **Files (components)**: kebab-case (`auth-page.tsx`, `error-boundary.tsx`)
- **Files (lib)**: kebab-case (`event-bus.ts`, `feature-flags.ts`)
- **Types**: PascalCase (`Trade`, `PsychologyLog`, `PlatformConfig`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`, `FEATURE_FLAGS`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useEvent`, `useConfig`)

## Type Safety

- All domain types defined in `lib/supabase.ts`
- Validation schemas in `lib/validation.ts` (Zod)
- Config types in `lib/config.ts`
- Feature flag types in `lib/feature-flags.ts`
- Event types in `lib/event-bus.ts`
- Search types in `lib/search.ts`
- Module types in `lib/module-registry.ts`

## Coding Standards

- **SOLID**: Single Responsibility per component/module. One file = one purpose.
- **Reuse**: Import from `lib/` and `components/ui/` before writing new code.
- **Dependency Injection**: Pass data via props, not module-level state.
- **Error Handling**: Check I/O results. Show visible error states. Use `ErrorBoundary`.
- **Logging**: Use `logger` from `lib/logger.ts`. Never `console.log` in production code.
- **Events**: Use `emit()` / `useEvent()` for cross-module communication. Never import modules directly.
- **Validation**: Use schemas from `lib/validation.ts` at all boundaries.

## Logging

```typescript
import { logger } from '@/lib/logger';

logger.info('Journal', 'Trade created', { tradeId: '...' });
logger.warn('Risk', 'Position size exceeds max risk', { ... });
logger.error('Broker', 'Sync failed', { broker: 'MT4', error: '...' });
logger.debug('Search', 'Query executed', { query: '...' });
logger.audit('EventBus', 'User signed in', { userId: '...' });
```

Levels: `debug`, `info`, `warn`, `error`, `audit`. Set min level via `logger.setMinLevel()`.

## Error Handling

- **Global**: `ErrorBoundary` wraps the entire app in `layout.tsx`.
- **Module-level**: Use `ErrorState` from `components/feedback/` for module-specific errors.
- **API errors**: Check response status, show user-friendly message, log to logger.
- **Retry**: For transient failures, retry with exponential backoff (implement per-call).

## Validation

```typescript
import { validate, tradeSchema } from '@/lib/validation';

const result = validate(tradeSchema, inputData);
if (result.success) {
  // result.data is typed as TradeInput
} else {
  // result.error is a user-friendly message
}
```

## Testing Standards

- **Unit Tests**: Pure functions in `lib/` (computeMetrics, formatters, validation).
- **Component Tests**: Component renders, user interactions, prop variations.
- **Integration Tests**: Module + Supabase queries, event bus pub/sub.
- **E2E Tests**: Full user flows (sign up → create trade → view analytics).
- **Regression Tests**: Bug fixes include a test that would have caught the bug.

## Performance

- **Lazy loading**: Modules use `next/dynamic` via `lazyModules` in module registry.
- **Bundle splitting**: Each module is a separate chunk.
- **Memoization**: Use `useMemo` for expensive computations (e.g., `computeMetrics`).
- **Search**: Search is debounced and capped at 50 results.

## Security

- **RLS**: All database tables have row-level security enabled.
- **Config**: Sensitive config stored in Supabase, not localStorage.
- **Feature flags**: Tier-based access enforced via `isFeatureEnabled()`.
- **Events**: Event bus is client-side only; no sensitive data in payloads.
- **Admin**: Admin modules hidden unless `isAdmin` flag is set.
