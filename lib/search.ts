/**
 * TraderOS Global Search Engine
 * Centralized search service. Every module registers searchable entities.
 *
 * Supports:
 * - Instant search with autocomplete
 * - Recent searches + search history (localStorage)
 * - Natural language queries ("Show Gold trades", "Losing London trades")
 * - Keyboard navigation (handled by the command palette component)
 * - Highlight matching results
 */

import { type ModuleKey } from '@/lib/module-registry';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/event-bus';

export type SearchCategory =
  | 'trades'
  | 'accounts'
  | 'strategies'
  | 'tags'
  | 'sessions'
  | 'reports'
  | 'prop_firms'
  | 'brokers'
  | 'notes'
  | 'mistakes'
  | 'lessons'
  | 'ai_conversations'
  | 'market_events'
  | 'settings'
  | 'documentation'
  | 'modules'
  | 'actions';

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  icon?: string;
  keywords?: string[];
  data?: Record<string, unknown>;
  action?: {
    type: 'navigate' | 'callback';
    module?: ModuleKey;
    callback?: () => void;
  };
  score: number;
};

export type SearchProvider = {
  category: SearchCategory;
  search: (query: string) => SearchResult[];
};

const providers = new Map<SearchCategory, SearchProvider>();
const recentSearches: string[] = [];
const MAX_RECENT = 10;
const STORAGE_KEY = 'traderos-recent-searches';

export function registerSearchProvider(provider: SearchProvider): void {
  providers.set(provider.category, provider);
  logger.debug('Search', `Provider registered: ${provider.category}`);
}

export function unregisterSearchProvider(category: SearchCategory): void {
  providers.delete(category);
}

export function search(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const normalized = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  // Check for natural language patterns first
  const nlpResults = parseNaturalLanguage(normalized);
  if (nlpResults.length > 0) results.push(...nlpResults);

  // Query all registered providers
  providers.forEach((provider) => {
    try {
      const providerResults = provider.search(normalized);
      results.push(...providerResults);
    } catch (err) {
      logger.error('Search', `Provider error: ${provider.category}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  // Sort by score descending
  unique.sort((a, b) => b.score - a.score);

  // Emit search event
  emit('search:executed', { query, resultCount: unique.length }, 'search-engine');

  return unique.slice(0, 50);
}

/**
 * Natural language query parser.
 * Recognizes patterns like:
 *   "Show Gold trades"       → filter trades by instrument
 *   "Losing London trades"   → filter trades by session + outcome
 *   "Find ICT setups"        → filter trades by strategy tag
 *   "FTMO accounts"          → filter accounts by broker
 *   "Trades with FOMO"       → filter trades by emotion
 *   "Best EURUSD strategy"   → rank strategies by instrument
 */
function parseNaturalLanguage(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Instrument patterns (common forex pairs, crypto, commodities)
  const instruments = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY',
    'XAUUSD', 'Gold', 'Silver', 'BTCUSD', 'ETHUSD', 'SP500', 'NAS100', 'US30',
    'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'Gold', 'Silver', 'BTC', 'ETH',
  ];

  const foundInstrument = instruments.find((inst) =>
    query.includes(inst.toLowerCase())
  );

  if (foundInstrument && (query.includes('trade') || query.includes('show') || query.includes('find'))) {
    results.push({
      id: `nlp-instrument-${foundInstrument}`,
      title: `Show ${foundInstrument} trades`,
      subtitle: 'Filter trades by instrument',
      category: 'trades',
      icon: 'Filter',
      keywords: [foundInstrument],
      action: { type: 'navigate', module: 'journal' },
      score: 100,
    });
  }

  // Session patterns
  const sessions = ['asia', 'london', 'new york', 'sydney', 'tokyo', 'frankfurt'];
  const foundSession = sessions.find((s) => query.includes(s));
  if (foundSession && query.includes('trade')) {
    const isLosing = query.includes('losing') || query.includes('loss') || query.includes('negative');
    results.push({
      id: `nlp-session-${foundSession}`,
      title: `${isLosing ? 'Losing ' : ''}${foundSession.charAt(0).toUpperCase() + foundSession.slice(1)} trades`,
      subtitle: `Filter trades by ${foundSession} session${isLosing ? ' (losing only)' : ''}`,
      category: 'trades',
      icon: 'Clock',
      keywords: [foundSession, isLosing ? 'losing' : ''],
      action: { type: 'navigate', module: 'analytics' },
      score: 95,
    });
  }

  // Strategy tag patterns
  const strategies = ['ICT', 'SMC', 'scalping', 'swing', 'day trading', 'breakout', 'reversal', 'trend following'];
  const foundStrategy = strategies.find((s) => query.includes(s.toLowerCase()));
  if (foundStrategy && (query.includes('setup') || query.includes('strategy') || query.includes('find'))) {
    results.push({
      id: `nlp-strategy-${foundStrategy}`,
      title: `${foundStrategy} setups`,
      subtitle: `Filter trades tagged with ${foundStrategy}`,
      category: 'strategies',
      icon: 'Target',
      keywords: [foundStrategy],
      action: { type: 'navigate', module: 'journal' },
      score: 90,
    });
  }

  // Emotion patterns
  const emotions = ['FOMO', 'greed', 'fear', 'revenge', 'tilt', 'overconfident'];
  const foundEmotion = emotions.find((e) => query.includes(e.toLowerCase()));
  if (foundEmotion && query.includes('trade')) {
    results.push({
      id: `nlp-emotion-${foundEmotion}`,
      title: `Trades with ${foundEmotion}`,
      subtitle: `Filter trades where ${foundEmotion} was recorded`,
      category: 'trades',
      icon: 'HeartPulse',
      keywords: [foundEmotion],
      action: { type: 'navigate', module: 'psychology' },
      score: 85,
    });
  }

  // Prop firm patterns
  if (query.includes('ftmo') || query.includes('prop firm') || query.includes('propfirm')) {
    results.push({
      id: 'nlp-prop-firms',
      title: 'Prop firm accounts',
      subtitle: 'Show all prop firm accounts',
      category: 'prop_firms',
      icon: 'Building',
      keywords: ['ftmo', 'prop firm'],
      action: { type: 'navigate', module: 'brokers' },
      score: 88,
    });
  }

  // Screenshot patterns
  if (query.includes('screenshot') || query.includes('chart') || query.includes('image')) {
    results.push({
      id: 'nlp-screenshots',
      title: 'Recent screenshots',
      subtitle: 'Trades with chart screenshots',
      category: 'trades',
      icon: 'Image',
      keywords: ['screenshot', 'chart'],
      action: { type: 'navigate', module: 'journal' },
      score: 80,
    });
  }

  return results;
}

export function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const recent = loadRecentSearches();
  const filtered = recent.filter((q) => q !== query);
  filtered.unshift(query);
  const trimmed = filtered.slice(0, MAX_RECENT);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Highlight matching text in a result.
 */
export function highlightMatch(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!query.trim()) return [{ text, isMatch: false }];
  const normalized = text.toLowerCase();
  const q = query.toLowerCase().trim();
  const parts: { text: string; isMatch: boolean }[] = [];
  let lastIndex = 0;
  let index = normalized.indexOf(q);
  while (index !== -1) {
    if (index > lastIndex) parts.push({ text: text.slice(lastIndex, index), isMatch: false });
    parts.push({ text: text.slice(index, index + q.length), isMatch: true });
    lastIndex = index + q.length;
    index = normalized.indexOf(q, lastIndex);
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isMatch: false });
  return parts;
}
