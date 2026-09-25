# TraderOS Event & Intelligence Bus

## Overview

The Event Bus is the communication backbone of TraderOS. It enables loose coupling between modules — a trade created in the Journal can trigger analytics recomputation, AI Coach regeneration, dashboard refresh, and achievement checks without any direct imports.

## API

### Publishing Events

```typescript
import { emit } from '@/lib/event-bus';

emit('trade:created', trade, 'journal');
emit('account:synced', { brokerId, count: 42 }, 'brokers');
emit('goal:completed', goal, 'achievements');
```

### Subscribing to Events

```typescript
import { useEvent } from '@/lib/event-bus';

// In a React component
useEvent('trade:created', (trade, metadata) => {
  refreshDashboard();
});

useEvent('account:synced', (data, metadata) => {
  showNotification(`${data.count} trades synced`);
});
```

### Non-React Subscriptions

```typescript
import { on, off } from '@/lib/event-bus';

const unsubscribe = on('trade:created', (trade, metadata) => {
  console.log('Trade created:', trade, 'at', metadata.timestamp);
});

// Later
unsubscribe();
```

## Event Types

### Trade Events
| Event | Payload | Source |
|---|---|---|
| `trade:created` | `Trade` | Journal |
| `trade:updated` | `Trade` | Journal |
| `trade:closed` | `Trade` | Journal |
| `trade:deleted` | `{ id: string }` | Journal |
| `trades:imported` | `{ count: number, source: string }` | Brokers |

### Account Events
| Event | Payload | Source |
|---|---|---|
| `account:connected` | `BrokerConnection` | Brokers |
| `account:disconnected` | `{ id: string }` | Brokers |
| `account:synced` | `{ brokerId: string, count: number }` | Brokers |

### Strategy Events
| Event | Payload | Source |
|---|---|---|
| `strategy:created` | `Strategy` | Strategy Intelligence |
| `strategy:updated` | `Strategy` | Strategy Intelligence |

### Goal Events
| Event | Payload | Source |
|---|---|---|
| `goal:created` | `TradingGoal` | Dashboard |
| `goal:updated` | `TradingGoal` | Dashboard |
| `goal:completed` | `TradingGoal` | Dashboard |

### Plan Events
| Event | Payload | Source |
|---|---|---|
| `plan:created` | `TradingPlan` | Plan |
| `plan:updated` | `TradingPlan` | Plan |

### Psychology Events
| Event | Payload | Source |
|---|---|---|
| `psychology:logged` | `PsychologyLog` | Psychology |
| `psychology:updated` | `PsychologyLog` | Psychology |
| `rule:violated` | `{ rule: string, severity: string }` | Psychology |

### AI Events
| Event | Payload | Source |
|---|---|---|
| `insight:generated` | `AiInsight` | AI Coach |
| `ai:analysis_finished` | `{ type: string, duration: number }` | AI Coach |

### System Events
| Event | Payload | Source |
|---|---|---|
| `theme:changed` | `'dark' \| 'light'` | ThemeProvider |
| `module:changed` | `ModuleKey` | Page |
| `search:executed` | `{ query: string, resultCount: number }` | Search |
| `config:updated` | `{ section: string, updates: any }` | ConfigProvider |
| `notification:sent` | `{ type: string, message: string }` | Any |
| `subscription:updated` | `{ tier: PlanTier }` | PlanModal |
| `review:completed` | `{ tradeId: string }` | Journal |
| `screenshot:uploaded` | `{ tradeId: string, url: string }` | Journal |

## Event Metadata

Every event carries metadata:

```typescript
type EventMetadata = {
  timestamp: string;       // ISO timestamp
  correlationId: string;  // Unique per event
  source: string;          // Module that emitted the event
  userId?: string;         // Optional user context
  retryCount: number;      // Retry attempts (0 on first emit)
};
```

## Audit Trail

All events are stored in an in-memory audit trail (max 500 events). Access via:

```typescript
import { getAuditTrail, subscribeEventLog } from '@/lib/event-bus';

const trail = getAuditTrail(); // EventRecord[]

// Real-time event log (for dev panel)
subscribeEventLog((record) => {
  console.log('Event:', record.event, record.metadata);
});
```

## Consumers

The following engines should subscribe to events:

| Consumer | Subscribes To | Action |
|---|---|---|
| Analytics Engine | `trade:*` | Recompute metrics |
| Risk Engine | `trade:created`, `config:updated` | Check risk limits |
| Psychology Engine | `psychology:*`, `trade:*` | Update discipline score |
| Trader DNA | `trade:*`, `psychology:*` | Update personality profile |
| Decision Intelligence | `trade:created` | Log decision outcome |
| AI Coach | `trade:*`, `psychology:*` | Regenerate insights |
| Notifications | `goal:completed`, `account:synced` | Show toast |
| Reports | `trade:*`, `review:completed` | Queue report generation |
| Dashboard | `trade:*`, `account:*`, `goal:*` | Refresh KPIs |
| Achievements | `trade:*`, `goal:completed` | Check milestones |

## Design Principles

1. **Loose coupling**: Producers don't know who consumes their events.
2. **Scalable**: Add new consumers without touching producers.
3. **Observable**: Every event is logged and auditable.
4. **Extensible**: New event types added via the `TraderOSEvent` union type.
5. **Maintainable**: Events are typed, documented, and traceable.
