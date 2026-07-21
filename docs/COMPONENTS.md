# TraderOS Component Library

## Primitives (`components/ui/`)

40+ shadcn/ui components built on Radix + CVA. All support:
- Theme awareness via CSS variables
- Dark/light variants
- Responsive layouts
- Keyboard navigation (Radix)
- Disabled states

Key components: `Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Table`, `Tabs`, `Tooltip`, `Popover`, `Dropdown`, `Toast`, `Calendar`, `Chart`, `Accordion`, `Avatar`, `Badge`, `Card`, `Checkbox`, `Switch`, `Slider`, `Progress`, `ScrollArea`, `Separator`, `Skeleton`.

## Feedback Components (`components/feedback/`)

| Component | Purpose |
|---|---|
| `EmptyState` | No data placeholder with icon, title, description, optional action |
| `ErrorState` | Error display with retry action |
| `LoadingState` | Centered spinner with label |
| `PageSkeleton` | Full page loading skeleton matching dashboard layout |
| `Spinner` | Standalone spinner element |

## Layout Components (`components/layout/`)

| Component | Purpose |
|---|---|
| `PageContainer` | Centered max-width container (default/wide/narrow) |
| `SectionHeader` | Section title + description + optional action |

## Chart Wrappers (`components/charts/`)

Theme-aware wrappers around Recharts. Shared tooltip, axis, grid styling.

| Component | Props |
|---|---|
| `ChartContainer` | `height`, `children` |
| `LineChart` | `data`, `xKey`, `lines[]`, `height`, `formatY` |
| `AreaChart` | `data`, `xKey`, `areas[]`, `height`, `formatY` |
| `BarChart` | `data`, `xKey`, `bars[]`, `height`, `formatY`, `horizontal` |

All charts use `chartColors` from design tokens and render with `ChartTooltip` (glass-styled).

## Brand Components (`components/brand/`)

| Component | Purpose |
|---|---|
| `BrandLogo` | Full logo (icon + text), sizes sm/md/lg |
| `BrandMark` | Icon-only logo mark |

Brand identity is configured in `lib/brand.ts`.

## Shell Components

| Component | Location | Purpose |
|---|---|---|
| `Sidebar` | `components/sidebar.tsx` | Desktop nav, uses module registry |
| `MobileNav` | `components/sidebar.tsx` | Mobile bottom nav |
| `Topbar` | `components/topbar.tsx` | Search, clock, theme toggle, notifications |
| `StatCard` | `components/stat-card.tsx` | KPI card with accent, delta, icon |

## Module Registry (`lib/module-registry.ts`)

Centralized metadata for all 12 modules. Used by sidebar, topbar, and page routing.

```ts
import { MODULES, getModuleMeta, lazyModules, type ModuleKey } from '@/lib/module-registry';
```

## Event Bus (`lib/event-bus.ts`)

Pub/sub for decoupled module communication.

```ts
import { emit, on, useEvent } from '@/lib/event-bus';
emit('trade:created', trade);
useEvent('trade:created', (trade) => { ... });
```

Events: `trade:*`, `account:*`, `goal:*`, `plan:*`, `review:completed`, `insight:generated`, `psychology:logged`, `theme:changed`, `module:changed`.
