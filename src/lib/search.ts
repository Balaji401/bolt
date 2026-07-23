import { emit } from './event-bus';
import { logger } from './logger';
import type { ModuleKey } from './module-registry';

export type SearchCategory =
  | 'trades' | 'accounts' | 'strategies' | 'tags' | 'sessions' | 'reports'
  | 'prop_firms' | 'brokers' | 'notes' | 'mistakes' | 'lessons' | 'ai_conversations'
  | 'market_events' | 'settings' | 'documentation' | 'modules' | 'actions';

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  icon?: string;
  keywords?: string[];
  action?: { type: 'navigate' | 'callback'; module?: ModuleKey; callback?: () => void };
  score: number;
};

export type SearchProvider = { category: SearchCategory; search: (query: string) => SearchResult[] };

const providers = new Map<SearchCategory, SearchProvider>();
const STORAGE_KEY = 'traderos-recent-searches';

export function registerSearchProvider(provider: SearchProvider): void {
  providers.set(provider.category, provider);
  logger.debug('Search', `Provider registered: ${provider.category}`);
}

export function search(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const normalized = query.toLowerCase().trim();
  const results: SearchResult[] = [...parseNaturalLanguage(normalized)];
  providers.forEach((provider) => {
    try { results.push(...provider.search(normalized)); }
    catch (err) { logger.error('Search', `Provider error: ${provider.category}`, { error: err instanceof Error ? err.message : String(err) }); }
  });
  const seen = new Set<string>();
  const unique = results.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  unique.sort((a, b) => b.score - a.score);
  emit('search:executed', { query, resultCount: unique.length }, 'search-engine');
  return unique.slice(0, 50);
}

function parseNaturalLanguage(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const instruments = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD', 'Gold', 'BTCUSD', 'ETHUSD', 'SPX500', 'NAS100'];
  const foundInstrument = instruments.find((inst) => query.includes(inst.toLowerCase()));
  if (foundInstrument && (query.includes('trade') || query.includes('show') || query.includes('find'))) {
    results.push({ id: `nlp-inst-${foundInstrument}`, title: `Show ${foundInstrument} trades`, subtitle: 'Filter trades by instrument', category: 'trades', action: { type: 'navigate', module: 'journal' }, score: 100 });
  }
  const sessions = ['asia', 'london', 'new york', 'sydney', 'tokyo'];
  const foundSession = sessions.find((s) => query.includes(s));
  if (foundSession && query.includes('trade')) {
    const isLosing = query.includes('losing') || query.includes('loss');
    results.push({ id: `nlp-sess-${foundSession}`, title: `${isLosing ? 'Losing ' : ''}${foundSession.charAt(0).toUpperCase() + foundSession.slice(1)} trades`, subtitle: `Filter by ${foundSession} session`, category: 'trades', action: { type: 'navigate', module: 'analytics' }, score: 95 });
  }
  const strategies = ['ICT', 'SMC', 'scalping', 'swing', 'breakout', 'reversal'];
  const foundStrategy = strategies.find((s) => query.includes(s.toLowerCase()));
  if (foundStrategy && (query.includes('setup') || query.includes('strategy'))) {
    results.push({ id: `nlp-strat-${foundStrategy}`, title: `${foundStrategy} setups`, subtitle: `Filter trades tagged with ${foundStrategy}`, category: 'strategies', action: { type: 'navigate', module: 'journal' }, score: 90 });
  }
  const emotions = ['FOMO', 'greed', 'fear', 'revenge', 'tilt'];
  const foundEmotion = emotions.find((e) => query.includes(e.toLowerCase()));
  if (foundEmotion && query.includes('trade')) {
    results.push({ id: `nlp-emo-${foundEmotion}`, title: `Trades with ${foundEmotion}`, subtitle: `Filter by emotion`, category: 'trades', action: { type: 'navigate', module: 'psychology' }, score: 85 });
  }
  if (query.includes('ftmo') || query.includes('prop firm')) {
    results.push({ id: 'nlp-prop', title: 'Prop firm accounts', subtitle: 'Show all prop firm accounts', category: 'prop_firms', action: { type: 'navigate', module: 'brokers' }, score: 88 });
  }
  return results;
}

export function loadRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function saveRecentSearch(query: string): void {
  const recent = loadRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, 10))); } catch { /* ignore */ }
}

export function clearRecentSearches(): void { localStorage.removeItem(STORAGE_KEY); }

export function highlightMatch(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!query.trim()) return [{ text, isMatch: false }];
  const normalized = text.toLowerCase();
  const q = query.toLowerCase().trim();
  const parts: { text: string; isMatch: boolean }[] = [];
  let lastIndex = 0, index = normalized.indexOf(q);
  while (index !== -1) {
    if (index > lastIndex) parts.push({ text: text.slice(lastIndex, index), isMatch: false });
    parts.push({ text: text.slice(index, index + q.length), isMatch: true });
    lastIndex = index + q.length;
    index = normalized.indexOf(q, lastIndex);
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), isMatch: false });
  return parts;
}
