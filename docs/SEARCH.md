# TraderOS Global Search Engine

## Overview

One intelligent search system for the entire platform. Users never wonder where information is located.

## Architecture

### Search Registry (`lib/search.ts`)

Every module registers a search provider:

```typescript
import { registerSearchProvider, type SearchProvider } from '@/lib/search';

const tradesProvider: SearchProvider = {
  category: 'trades',
  search: (query) => {
    return trades
      .filter(t => t.instrument.toLowerCase().includes(query))
      .map(t => ({
        id: t.id,
        title: `${t.instrument} ${t.direction}`,
        subtitle: `${t.session} · ${t.pnl > 0 ? 'Win' : 'Loss'}`,
        category: 'trades',
        action: { type: 'navigate', module: 'journal' },
        score: 90,
      }));
  },
};

registerSearchProvider(tradesProvider);
```

### Search Categories

| Category | Description |
|---|---|
| `trades` | Individual trade entries |
| `accounts` | Broker accounts |
| `strategies` | Strategy tags and setups |
| `tags` | Custom tags |
| `sessions` | Trading sessions |
| `reports` | Generated reports |
| `prop_firms` | Prop firm accounts |
| `brokers` | Broker connections |
| `notes` | Trade notes |
| `mistakes` | Recorded mistakes |
| `lessons` | Lessons learned |
| `ai_conversations` | AI chat history |
| `market_events` | Economic calendar events |
| `settings` | Configuration options |
| `documentation` | Help docs |
| `modules` | Navigation modules |
| `actions` | Quick actions |

## Natural Language Search

The engine recognizes natural language patterns:

| Query | Interpretation |
|---|---|
| "Show Gold trades" | Filter trades by instrument XAUUSD |
| "Losing London trades" | Filter by session + negative P&L |
| "Find ICT setups" | Filter by strategy tag |
| "FTMO accounts" | Filter accounts by prop firm |
| "Trades with FOMO" | Filter by emotion |
| "Best EURUSD strategy" | Rank strategies by instrument |
| "Recent screenshots" | Trades with chart screenshots |

### How NLP Works

The `parseNaturalLanguage()` function matches patterns:
1. **Instrument detection** — checks against known forex/crypto/commodity symbols
2. **Session detection** — asia, london, new york, sydney, tokyo, frankfurt
3. **Strategy detection** — ICT, SMC, scalping, swing, breakout, etc.
4. **Emotion detection** — FOMO, greed, fear, revenge, tilt
5. **Outcome detection** — "losing", "winning" modifies the filter
6. **Prop firm detection** — FTMO, prop firm keywords
7. **Media detection** — screenshot, chart, image keywords

## Features

- **Instant search** — results appear as you type
- **Autocomplete** — quick actions and module navigation
- **Recent searches** — last 10 searches persisted in localStorage
- **Highlight matching** — query text highlighted in results
- **Score ranking** — results sorted by relevance score
- **Deduplication** — duplicate results removed by ID
- **Capped results** — max 50 results per query

## API

```typescript
import { search, registerSearchProvider, highlightMatch, loadRecentSearches, saveRecentSearch } from '@/lib/search';

// Execute a search
const results = search('Gold trades');

// Register a provider
registerSearchProvider(myProvider);

// Highlight matches in UI
const parts = highlightMatch('EURUSD Long trade', 'eur');
// [{ text: 'EUR', isMatch: true }, { text: 'USD Long trade', isMatch: false }]
```

## Integration with AI

The search engine emits `search:executed` events. Future AI integration can:
1. Intercept searches with no results
2. Route complex queries to the AI Chat
3. Suggest related searches based on trade history
4. Learn from search patterns to improve NLP
