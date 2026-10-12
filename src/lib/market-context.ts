export type MarketImpact = 'low' | 'medium' | 'high';
export type EventStatus = 'scheduled' | 'released' | 'updated' | 'cancelled';
export type MarketNewsCategory = 'Forex' | 'Stocks' | 'Crypto' | 'Commodities' | 'Central Banks' | 'Macroeconomics' | 'Geopolitics' | 'General Markets';
export type MarketSessionName = 'Sydney' | 'Tokyo' | 'London' | 'New York';

export type MarketEvent = {
  id: string;
  title: string;
  eventType: string;
  country: string;
  currency: string;
  impact: MarketImpact;
  date: string;
  scheduledTime: string;
  previous: string | null;
  forecast: string | null;
  actual: string | null;
  status: EventStatus;
  source: string;
  description: string;
  relatedAssets: string[];
};

export type MarketNewsItem = {
  id: string;
  headline: string;
  summary: string;
  publishedAt: string;
  source: string;
  country: string;
  currency: string;
  asset: string;
  category: MarketNewsCategory;
  tags: string[];
  url: string;
};

export type MarketSession = {
  name: MarketSessionName;
  openTime: string;
  closeTime: string;
  timezone: string;
  status: 'Open' | 'Closed' | 'Opening Soon';
  timeRemaining: string;
  overlap: string[];
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  assetClass: string;
  market: string;
  preferredSession: MarketSessionName;
  relatedCurrencies: string[];
  notes: string;
};

export type MarketContextSnapshot = {
  events: MarketEvent[];
  news: MarketNewsItem[];
  sessions: MarketSession[];
  watchlist: WatchlistItem[];
  preferences: MarketContextPreference;
};

export type MarketContextProvider = {
  getEvents: (params?: Partial<{ search: string; country: string; currency: string; impact: string; eventType: string; status: string; dateRange: string; sortBy: string }>) => MarketEvent[];
  getNews: (params?: Partial<{ search: string; asset: string; currency: string; country: string; category: string; dateRange: string; sortBy: string }>) => MarketNewsItem[];
  getSessions: (timezone?: string) => MarketSession[];
  getWatchlist: () => WatchlistItem[];
  saveWatchlist: (items: WatchlistItem[]) => WatchlistItem[];
  getPreferences: () => MarketContextPreference;
  savePreferences: (preferences: Partial<MarketContextPreference>) => MarketContextPreference;
};

export type MarketContextPreference = {
  preferredCountries: string[];
  preferredCurrencies: string[];
  preferredAssetClasses: string[];
  preferredInstruments: string[];
  minimumImpact: MarketImpact;
  defaultCalendarRange: 'today' | 'tomorrow' | 'this_week';
  timezone: string;
  newsCategories: MarketNewsCategory[];
  notificationPreferences: {
    highImpact: boolean;
    sessionOpen: boolean;
    newsAvailable: boolean;
  };
};

const addDays = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const MARKET_CONTEXT_PREFERENCES: MarketContextPreference = {
  preferredCountries: ['United States', 'Eurozone', 'United Kingdom', 'Japan'],
  preferredCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
  preferredAssetClasses: ['Forex', 'Commodities'],
  preferredInstruments: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
  minimumImpact: 'medium',
  defaultCalendarRange: 'this_week',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  newsCategories: ['Forex', 'Central Banks', 'Macroeconomics', 'General Markets'],
  notificationPreferences: {
    highImpact: true,
    sessionOpen: true,
    newsAvailable: false,
  },
};

export const MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'evt-1', title: 'Non-Farm Payrolls', eventType: 'Employment', country: 'United States', currency: 'USD', impact: 'high',
    date: addDays(0), scheduledTime: '08:30', previous: '175K', forecast: '180K', actual: null, status: 'scheduled', source: 'BLS', description: 'Monthly employment report used to gauge labor-market strength and Fed policy expectations.', relatedAssets: ['USD', 'EUR/USD', 'GBP/USD'],
  },
  {
    id: 'evt-2', title: 'ECB Interest Rate Decision', eventType: 'Central Bank', country: 'Eurozone', currency: 'EUR', impact: 'high',
    date: addDays(1), scheduledTime: '13:45', previous: '4.25%', forecast: '4.25%', actual: null, status: 'scheduled', source: 'ECB', description: 'Policy decision and press conference that can reshape euro sentiment and short-term spreads.', relatedAssets: ['EUR/USD', 'EUR/JPY'],
  },
  {
    id: 'evt-3', title: 'BoE Inflation Report', eventType: 'Inflation', country: 'United Kingdom', currency: 'GBP', impact: 'medium',
    date: addDays(0), scheduledTime: '09:30', previous: '3.2%', forecast: '3.1%', actual: null, status: 'released', source: 'Bank of England', description: 'Inflation and policy summary with emphasis on rate-path messaging and sterling volatility.', relatedAssets: ['GBP/USD', 'GBP/JPY'],
  },
  {
    id: 'evt-4', title: 'Bank of Japan Policy Statement', eventType: 'Central Bank', country: 'Japan', currency: 'JPY', impact: 'high',
    date: addDays(2), scheduledTime: '06:50', previous: '0.25%', forecast: '0.25%', actual: null, status: 'scheduled', source: 'BoJ', description: 'Policy statement and rate guidance that often influences yen direction and cross-market liquidity.', relatedAssets: ['USD/JPY', 'EUR/JPY'],
  },
  {
    id: 'evt-5', title: 'US CPI', eventType: 'Inflation', country: 'United States', currency: 'USD', impact: 'high',
    date: addDays(3), scheduledTime: '08:30', previous: '3.3%', forecast: '3.2%', actual: null, status: 'scheduled', source: 'BLS', description: 'Consumer price data that shapes expectations for future monetary policy and market repricing.', relatedAssets: ['USD', 'XAU/USD', 'EUR/USD'],
  },
];

export const MARKET_NEWS: MarketNewsItem[] = [
  {
    id: 'news-1', headline: 'Dollar steadies as traders price a slower rate-cut cycle', summary: 'The greenback held firm after the latest comments from central-bank speakers suggested rate cuts may be delayed.', publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), source: 'Reuters', country: 'United States', currency: 'USD', asset: 'USD', category: 'Forex', tags: ['Fed', 'Rates'], url: 'https://www.reuters.com/',
  },
  {
    id: 'news-2', headline: 'Euro remains supported as inflation data cools but remains sticky', summary: 'Euro traders continue to watch inflation as the ECB balances easing hopes against a still-tight pricing backdrop.', publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), source: 'Bloomberg', country: 'Eurozone', currency: 'EUR', asset: 'EUR/USD', category: 'Forex', tags: ['ECB', 'Inflation'], url: 'https://www.bloomberg.com/',
  },
  {
    id: 'news-3', headline: 'Gold consolidates ahead of US inflation release', summary: 'Spot gold stayed in focus as traders looked for confirmation of the next directional move in US data.', publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), source: 'Kitco', country: 'United States', currency: 'USD', asset: 'XAU/USD', category: 'Commodities', tags: ['Gold', 'Inflation'], url: 'https://www.kitco.com/',
  },
  {
    id: 'news-4', headline: 'Bank of Japan commentary keeps yen reaction muted', summary: 'Market participants assessed whether recent yen weakness will be met with a sharper policy response.', publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), source: 'FXStreet', country: 'Japan', currency: 'JPY', asset: 'USD/JPY', category: 'Central Banks', tags: ['BoJ', 'JPY'], url: 'https://www.fxstreet.com/',
  },
];

export const MARKET_SESSIONS: Omit<MarketSession, 'status' | 'timeRemaining'>[] = [
  { name: 'Sydney', openTime: '09:00', closeTime: '18:00', timezone: 'Australia/Sydney', overlap: ['Tokyo'] },
  { name: 'Tokyo', openTime: '09:00', closeTime: '18:00', timezone: 'Asia/Tokyo', overlap: ['Sydney', 'London'] },
  { name: 'London', openTime: '08:00', closeTime: '17:00', timezone: 'Europe/London', overlap: ['Tokyo', 'New York'] },
  { name: 'New York', openTime: '08:00', closeTime: '17:00', timezone: 'America/New_York', overlap: ['London'] },
];

export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { id: 'watch-1', symbol: 'EUR/USD', assetClass: 'Forex', market: 'FX', preferredSession: 'London', relatedCurrencies: ['EUR', 'USD'], notes: 'High-volume pair; watch ECB and US data flow.' },
  { id: 'watch-2', symbol: 'GBP/USD', assetClass: 'Forex', market: 'FX', preferredSession: 'London', relatedCurrencies: ['GBP', 'USD'], notes: 'Sterling remains sensitive to inflation and policy guidance.' },
  { id: 'watch-3', symbol: 'XAU/USD', assetClass: 'Commodities', market: 'Metals', preferredSession: 'New York', relatedCurrencies: ['USD'], notes: 'Safe-haven proxy with reaction to inflation and risk sentiment.' },
];

const MARKET_CONTEXT_STORAGE_KEY = 'traderos-market-context';
const MARKET_PROVIDER_MODE = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_MARKET_DATA_PROVIDER || import.meta.env?.NEXT_PUBLIC_MARKET_DATA_PROVIDER)) || 'seeded';
const MARKET_DATA_API_KEY = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_MARKET_DATA_API_KEY || import.meta.env?.VITE_ALPHA_VANTAGE_API_KEY || import.meta.env?.NEXT_PUBLIC_MARKET_DATA_API_KEY)) || 'demo';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function pairToYahooTicker(symbol: string): string | null {
  const normalized = symbol.replace(/\s+/g, '').replace(/\//g, '').toUpperCase();
  if (!normalized || normalized === 'XAUUSD') return null;
  return `${normalized}=X`;
}

async function loadLiveCalendar(): Promise<MarketEvent[]> {
  if (MARKET_PROVIDER_MODE !== 'live' || !MARKET_DATA_API_KEY || MARKET_DATA_API_KEY === 'demo') return MARKET_EVENTS;

  const endpoint = new URL('https://www.alphavantage.co/query');
  endpoint.searchParams.set('function', 'ECONOMIC_CALENDAR');
  endpoint.searchParams.set('apikey', MARKET_DATA_API_KEY);

  const payload = await fetchJson<{ economicCalendar?: Array<{
    date?: string;
    time?: string;
    country?: string;
    currency?: string;
    event?: string;
    impact?: string;
    previous?: string;
    forecast?: string;
    actual?: string;
  }> }>(endpoint.toString());

  if (!payload?.economicCalendar || payload.economicCalendar.length === 0) return MARKET_EVENTS;

  return payload.economicCalendar.slice(0, 8).map((item, index) => ({
    id: `live-event-${index + 1}`,
    title: item.event || 'Economic Update',
    eventType: item.event?.split(' ')[0] || 'Macro',
    country: item.country || 'Global',
    currency: item.currency || 'USD',
    impact: (item.impact || 'medium').toLowerCase() as MarketImpact,
    date: item.date || addDays(index),
    scheduledTime: item.time || '08:00',
    previous: item.previous || null,
    forecast: item.forecast || null,
    actual: item.actual || null,
    status: item.actual ? 'released' : 'scheduled',
    source: 'Alpha Vantage',
    description: 'Public economic calendar entry loaded from the configured market provider.',
    relatedAssets: [item.currency || 'USD'],
  }));
}

async function loadLiveNews(): Promise<MarketNewsItem[]> {
  if (MARKET_PROVIDER_MODE !== 'live' || !MARKET_DATA_API_KEY || MARKET_DATA_API_KEY === 'demo') return MARKET_NEWS;

  const endpoint = new URL('https://www.alphavantage.co/query');
  endpoint.searchParams.set('function', 'NEWS_SENTIMENT');
  endpoint.searchParams.set('tickers', 'FOREX');
  endpoint.searchParams.set('apikey', MARKET_DATA_API_KEY);

  const payload = await fetchJson<{ feed?: Array<{ title?: string; summary?: string; url?: string; published_at?: string; source?: string; topic?: string; banner_image?: string }> }>(endpoint.toString());
  if (!payload?.feed || payload.feed.length === 0) return MARKET_NEWS;

  return payload.feed.slice(0, 6).map((item, index) => ({
    id: `live-news-${index + 1}`,
    headline: item.title || 'Market headline',
    summary: item.summary || 'Public market update from a financial news feed.',
    publishedAt: item.published_at || new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    source: item.source || 'Alpha Vantage',
    country: 'Global',
    currency: 'USD',
    asset: 'FX',
    category: 'General Markets',
    tags: item.topic ? [item.topic] : ['Market'],
    url: item.url || 'https://www.alphavantage.co/',
  }));
}

export async function hydrateMarketContext(): Promise<MarketContextSnapshot> {
  const [liveEvents, liveNews] = await Promise.all([loadLiveCalendar(), loadLiveNews()]);
  const liveWatchlist = DEFAULT_WATCHLIST.map((item, index) => ({
    ...item,
    notes: item.notes || `Public context item ${index + 1}`,
  }));

  return {
    events: liveEvents,
    news: liveNews,
    sessions: getMarketSessions(MARKET_CONTEXT_PREFERENCES.timezone),
    watchlist: marketContextProvider.getWatchlist().length ? marketContextProvider.getWatchlist() : liveWatchlist,
    preferences: marketContextProvider.getPreferences(),
  };
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): T {
  if (typeof window === 'undefined') return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  return value;
}

export const marketContextProvider: MarketContextProvider = {
  getEvents: (params = {}) => getMarketEvents(params),
  getNews: (params = {}) => getMarketNews(params),
  getSessions: (timezone = MARKET_CONTEXT_PREFERENCES.timezone) => getMarketSessions(timezone),
  getWatchlist: () => readStorage<WatchlistItem[]>(`${MARKET_CONTEXT_STORAGE_KEY}:watchlist`, DEFAULT_WATCHLIST),
  saveWatchlist: (items) => writeStorage(`${MARKET_CONTEXT_STORAGE_KEY}:watchlist`, items),
  getPreferences: () => readStorage<MarketContextPreference>(`${MARKET_CONTEXT_STORAGE_KEY}:preferences`, MARKET_CONTEXT_PREFERENCES),
  savePreferences: (preferences) => {
    const current = marketContextProvider.getPreferences();
    const merged = { ...current, ...preferences };
    return writeStorage(`${MARKET_CONTEXT_STORAGE_KEY}:preferences`, merged);
  },
};

export function getMarketContextSnapshot(): MarketContextSnapshot {
  return {
    events: MARKET_EVENTS,
    news: MARKET_NEWS,
    sessions: marketContextProvider.getSessions(),
    watchlist: marketContextProvider.getWatchlist(),
    preferences: marketContextProvider.getPreferences(),
  };
}

export function saveMarketContextSnapshot(snapshot: Partial<MarketContextSnapshot>): MarketContextSnapshot {
  const current = getMarketContextSnapshot();
  const next: MarketContextSnapshot = {
    events: snapshot.events ?? current.events,
    news: snapshot.news ?? current.news,
    sessions: snapshot.sessions ?? current.sessions,
    watchlist: snapshot.watchlist ?? current.watchlist,
    preferences: snapshot.preferences ?? current.preferences,
  };

  marketContextProvider.saveWatchlist(next.watchlist);
  marketContextProvider.savePreferences(next.preferences);

  return next;
}

export function filterEvents(params: Partial<{ search: string; country: string; currency: string; impact: string; eventType: string; status: string; dateRange: string }> = {}) {
  const search = (params.search || '').toLowerCase();
  const country = params.country || 'all';
  const currency = params.currency || 'all';
  const impact = params.impact || 'all';
  const eventType = params.eventType || 'all';
  const status = params.status || 'all';
  const dateRange = params.dateRange || 'this_week';
  const offsetByRange: Record<string, number> = { today: 0, tomorrow: 1, this_week: 7 };

  return MARKET_EVENTS.filter((event) => {
    const matchesSearch = !search || event.title.toLowerCase().includes(search) || event.description.toLowerCase().includes(search) || event.country.toLowerCase().includes(search) || event.currency.toLowerCase().includes(search);
    const matchesCountry = country === 'all' || event.country === country;
    const matchesCurrency = currency === 'all' || event.currency === currency;
    const matchesImpact = impact === 'all' || event.impact === impact;
    const matchesType = eventType === 'all' || event.eventType.toLowerCase() === eventType.toLowerCase();
    const matchesStatus = status === 'all' || event.status === status;
    const matchesDate = (() => {
      const latest = new Date();
      const offset = offsetByRange[dateRange] ?? 7;
      const eventDate = new Date(`${event.date}T00:00:00`);
      return eventDate <= new Date(latest.getTime() + offset * 24 * 60 * 60 * 1000);
    })();

    return matchesSearch && matchesCountry && matchesCurrency && matchesImpact && matchesType && matchesStatus && matchesDate;
  });
}

export function getMarketEvents(params: Partial<{ search: string; country: string; currency: string; impact: string; eventType: string; status: string; dateRange: string; sortBy: string }> = {}) {
  const result = [...filterEvents(params)];
  const sortBy = params.sortBy || 'time';

  result.sort((a, b) => {
    switch (sortBy) {
      case 'impact':
        return (['low', 'medium', 'high'].indexOf(b.impact) - ['low', 'medium', 'high'].indexOf(a.impact));
      case 'country':
        return a.country.localeCompare(b.country);
      case 'currency':
        return a.currency.localeCompare(b.currency);
      case 'time':
      default:
        return a.scheduledTime.localeCompare(b.scheduledTime);
    }
  });

  return result;
}

export function getMarketNews(params: Partial<{ search: string; asset: string; currency: string; country: string; category: string; dateRange: string; sortBy: string }> = {}) {
  const search = (params.search || '').toLowerCase();
  const assetFilter = params.asset || 'all';
  const currencyFilter = params.currency || 'all';
  const countryFilter = params.country || 'all';
  const categoryFilter = params.category || 'all';
  const sortBy = params.sortBy || 'newest';

  const list = MARKET_NEWS.filter((item) => {
    const matchesSearch = !search || item.headline.toLowerCase().includes(search) || item.summary.toLowerCase().includes(search) || item.tags.some((tag) => tag.toLowerCase().includes(search));
    const matchesAsset = assetFilter === 'all' || item.asset === assetFilter;
    const matchesCurrency = currencyFilter === 'all' || item.currency === currencyFilter;
    const matchesCountry = countryFilter === 'all' || item.country === countryFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesAsset && matchesCurrency && matchesCountry && matchesCategory;
  });

  if (sortBy === 'relevant') {
    return [...list].sort((a, b) => b.tags.length - a.tags.length || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  return [...list].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getMarketSessions(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
  const currentMinutes = (() => {
    const parts = formatter.formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    return hour * 60 + minute;
  })();

  return MARKET_SESSIONS.map((session) => {
    const openMinutes = timeToMinutes(session.openTime);
    const closeMinutes = timeToMinutes(session.closeTime);
    let status: MarketSession['status'] = 'Closed';
    let timeRemaining = 'Closed';

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      status = 'Open';
      const minutesLeft = closeMinutes - currentMinutes;
      timeRemaining = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
    } else {
      const diff = openMinutes - currentMinutes;
      if (diff > 0 && diff <= 120) {
        status = 'Opening Soon';
        const minutesLeft = diff;
        timeRemaining = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
      } else {
        status = 'Closed';
        timeRemaining = 'Closed';
      }
    }

    return {
      ...session,
      status,
      timeRemaining,
      overlap: session.overlap,
    } satisfies MarketSession;
  });
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function getTradeContext(trade: { instrument: string; executed_at: string; currency?: string | null } | null) {
  if (!trade) return { events: [], news: [], session: null, note: 'No context available for this trade.' };

  const instrument = trade.instrument || '';
  const extracted = new Set<string>();
  const currencyMatches = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  currencyMatches.forEach((c) => {
    if (instrument.includes(c)) extracted.add(c);
  });

  const events = getMarketEvents({
    currency: extracted.size > 0 ? Array.from(extracted)[0] : 'all',
    impact: 'high',
    dateRange: 'this_week',
  }).slice(0, 3);

  const news = getMarketNews({
    asset: instrument,
    currency: extracted.size > 0 ? Array.from(extracted)[0] : 'all',
    sortBy: 'newest',
  }).slice(0, 2);

  const session = getMarketSessions().find((item) => item.name === 'London') || null;

  return {
    events,
    news,
    session,
    note: `Occurred near trade time. This context is informational only and should be reviewed alongside your own execution notes.`,
  };
}
