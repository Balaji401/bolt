# TraderOS Navigation Framework

## Overview

The navigation system supports 20+ enterprise modules with collapsible groups, favorites, recently visited pages, quick actions, and a global command palette.

## Components

### Sidebar (`components/sidebar.tsx`)

Desktop sidebar with:
- **Brand logo** at top
- **Favorites section** — user-starred modules (persisted in localStorage)
- **Recent section** — last 4 visited modules (auto-tracked)
- **Collapsible groups** — Overview, Intelligence, Connections, Tools, System
- **Module badges** — "NEW", "Soon" for upcoming modules
- **Tier-based visibility** — pro/elite modules hidden for free users
- **Profile footer** — avatar, name, plan tier, sign out

### MobileNav (`components/sidebar.tsx`)

Bottom navigation bar with 5 key modules: Dashboard, Journal, Analytics, AI Chat, Risk.

### Topbar (`components/topbar.tsx`)

Header with:
- **Breadcrumbs** — auto-generated from module group → module
- **Search trigger** — opens command palette (Ctrl+K)
- **Timezone selector** — searchable dropdown with 19 common timezones
- **Live clock** — updates every second
- **Theme toggle** — dark/light/system
- **AI Chat shortcut**
- **Notifications** — bell with pulse indicator
- **Upgrade button** — opens plan modal
- **New Trade button** — contextual to active module

### Breadcrumbs (`components/breadcrumbs.tsx`)

Auto-generated: `Home → Group → Module`. Uses module registry metadata.

### Command Palette (`components/command-palette.tsx`)

Global floating command menu (Ctrl+K or click search):
- **Instant search** across all registered entities
- **Quick actions** — New Trade, Import Trades, AI Chat, Navigate to module
- **Recent searches** — persisted in localStorage
- **Natural language** — "Show Gold trades", "Losing London trades"
- **Keyboard navigation** — ↑↓ to navigate, Enter to select, Esc to close
- **Highlight matching** — query matches highlighted in results

## Module Registry (`lib/module-registry.ts`)

Centralized metadata for all modules:

```typescript
import { MODULES, getModuleMeta, getVisibleModules, type ModuleKey } from '@/lib/module-registry';
```

### Module Groups

| Group | Modules |
|---|---|
| Overview | Dashboard, Trading Journal, Performance |
| Intelligence | AI Coach, AI Chat, Psychology, Achievements, Strategy Intelligence, Decision Intelligence, Market Intelligence, AI Intelligence |
| Connections | Broker Sync, Multi-Account Intelligence, Prop Firms |
| Tools | Risk Management, Trading Plan, Economic Calendar, News Center |
| System | Settings, Admin |

### Visibility

- `all` — visible to all users
- `pro` — visible to pro and elite tiers
- `elite` — visible to elite tier only
- `admin` — visible to admin users only

### Coming Soon

Modules with `comingSoon: true` render a `ComingSoon` placeholder component.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open command palette |
| `Esc` | Close command palette |
| `↑` / `↓` | Navigate results |
| `Enter` | Execute selected result |

## Persistence

| Key | Storage | Purpose |
|---|---|---|
| `traderos-favorites` | localStorage | Favorited modules |
| `traderos-recent-modules` | localStorage | Recently visited modules |
| `traderos-collapsed-groups` | localStorage | Collapsed sidebar groups |
| `traderos-recent-searches` | localStorage | Recent search queries |
