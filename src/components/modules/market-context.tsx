'use client';
import { useMemo, useState, useEffect } from 'react';
import { CalendarClock, Newspaper, Clock3, Plus, Search, BellRing, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/feedback/state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  DEFAULT_WATCHLIST,
  MARKET_CONTEXT_PREFERENCES,
  MARKET_EVENTS,
  MARKET_NEWS,
  MARKET_SESSIONS,
  getMarketContextSnapshot,
  getMarketEvents,
  getMarketNews,
  getMarketSessions,
  hydrateMarketContext,
  saveMarketContextSnapshot,
  type MarketEvent,
  type MarketNewsItem,
  type WatchlistItem,
} from '@/lib/market-context';

const IMPACT_CLASSES = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-destructive/15 text-destructive',
};

export function MarketContext() {
  const [tab, setTab] = useState<'calendar' | 'news' | 'sessions' | 'watchlist'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(MARKET_EVENTS[0] || null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const [eventSearch, setEventSearch] = useState('');
  const [eventFilters, setEventFilters] = useState<{ country: string; currency: string; impact: string; eventType: string; status: string; dateRange: string; sortBy: string }>({
    country: 'all', currency: 'all', impact: 'all', eventType: 'all', status: 'all', dateRange: MARKET_CONTEXT_PREFERENCES.defaultCalendarRange, sortBy: 'time',
  });
  const [newsFilters, setNewsFilters] = useState({ search: '', asset: 'all', currency: 'all', country: 'all', category: 'all', sortBy: 'newest' });
  const [newWatchItem, setNewWatchItem] = useState({ symbol: '', assetClass: 'Forex', market: 'FX', preferredSession: 'London', relatedCurrencies: 'USD', notes: '' });

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const snapshot = await hydrateMarketContext();
      if (!active) return;
      const nextWatchlist = snapshot.watchlist.length ? snapshot.watchlist : DEFAULT_WATCHLIST;
      setWatchlist(nextWatchlist);
      if (snapshot.events[0]) setSelectedEvent(snapshot.events[0]);
      saveMarketContextSnapshot({ watchlist: nextWatchlist, events: snapshot.events, news: snapshot.news, sessions: snapshot.sessions, preferences: snapshot.preferences });
    };

    hydrate();
    const snapshot = getMarketContextSnapshot();
    setWatchlist(snapshot.watchlist);
    if (snapshot.events[0]) setSelectedEvent(snapshot.events[0]);

    return () => { active = false; };
  }, []);

  useEffect(() => {
    saveMarketContextSnapshot({ watchlist });
  }, [watchlist]);

  const events = useMemo(() => getMarketEvents({ ...eventFilters, search: eventSearch }), [eventSearch, eventFilters]);
  const news = useMemo(() => getMarketNews(newsFilters), [newsFilters]);
  const sessions = useMemo(() => getMarketSessions(MARKET_CONTEXT_PREFERENCES.timezone), []);

  const countries = useMemo(() => Array.from(new Set(MARKET_EVENTS.map((event) => event.country))).sort(), []);
  const currencies = useMemo(() => Array.from(new Set(MARKET_EVENTS.map((event) => event.currency))).sort(), []);

  const handleAddWatchItem = () => {
    if (!newWatchItem.symbol.trim()) return;
    const item: WatchlistItem = {
      id: `watch-${Date.now()}`,
      symbol: newWatchItem.symbol.trim().toUpperCase(),
      assetClass: newWatchItem.assetClass,
      market: newWatchItem.market,
      preferredSession: newWatchItem.preferredSession as WatchlistItem['preferredSession'],
      relatedCurrencies: newWatchItem.relatedCurrencies.split(',').map((value) => value.trim()).filter(Boolean),
      notes: newWatchItem.notes,
    };
    setWatchlist((prev) => {
      const next = [item, ...prev];
      saveMarketContextSnapshot({ watchlist: next });
      return next;
    });
    setNewWatchItem({ symbol: '', assetClass: 'Forex', market: 'FX', preferredSession: 'London', relatedCurrencies: 'USD', notes: '' });
  };

  const calendarDetail = selectedEvent || events[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Market Context</h2>
          <p className="text-sm text-muted-foreground">Economic calendar, market news, sessions, and watchlist context</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as 'calendar' | 'news' | 'sessions' | 'watchlist')}>
        <TabsList className="flex flex-wrap justify-start gap-1">
          <TabsTrigger value="calendar">Economic Calendar</TabsTrigger>
          <TabsTrigger value="news">Market News</TabsTrigger>
          <TabsTrigger value="sessions">Market Sessions</TabsTrigger>
          <TabsTrigger value="watchlist">My Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-sm">Economic events</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Input value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} placeholder="Search events" className="h-9 w-full md:w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3">
                  <select value={eventFilters.dateRange} onChange={(e) => setEventFilters((prev) => ({ ...prev, dateRange: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this_week">This Week</option>
                  </select>
                  <select value={eventFilters.country} onChange={(e) => setEventFilters((prev) => ({ ...prev, country: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="all">Country</option>
                    {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                  <select value={eventFilters.currency} onChange={(e) => setEventFilters((prev) => ({ ...prev, currency: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="all">Currency</option>
                    {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                  </select>
                  <select value={eventFilters.impact} onChange={(e) => setEventFilters((prev) => ({ ...prev, impact: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="all">Impact</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select value={eventFilters.eventType} onChange={(e) => setEventFilters((prev) => ({ ...prev, eventType: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="all">Type</option>
                    <option value="Employment">Employment</option>
                    <option value="Inflation">Inflation</option>
                    <option value="Central Bank">Central Bank</option>
                  </select>
                  <select value={eventFilters.sortBy} onChange={(e) => setEventFilters((prev) => ({ ...prev, sortBy: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="time">Sort: Time</option>
                    <option value="impact">Sort: Impact</option>
                    <option value="country">Sort: Country</option>
                    <option value="currency">Sort: Currency</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {events.length === 0 ? (
                  <EmptyState icon={CalendarClock} title="No events found" description="Adjust filters or search to see other upcoming market events." />
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <button key={event.id} onClick={() => setSelectedEvent(event)} className={cn('w-full rounded-lg border p-3 text-left transition-colors', calendarDetail?.id === event.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{event.title}</span>
                              <Badge className={cn('text-[10px] uppercase', IMPACT_CLASSES[event.impact])}>{event.impact}</Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{event.date} · {event.scheduledTime} · {event.country} · {event.currency}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{event.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Event details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {calendarDetail ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-base">{calendarDetail.title}</div>
                      <Badge className={cn('text-[10px] uppercase', IMPACT_CLASSES[calendarDetail.impact])}>{calendarDetail.impact}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div><strong>Scheduled:</strong> {calendarDetail.date} {calendarDetail.scheduledTime}</div>
                      <div><strong>Status:</strong> {calendarDetail.status}</div>
                      <div><strong>Country:</strong> {calendarDetail.country}</div>
                      <div><strong>Currency:</strong> {calendarDetail.currency}</div>
                      <div><strong>Previous:</strong> {calendarDetail.previous || '—'}</div>
                      <div><strong>Forecast:</strong> {calendarDetail.forecast || '—'}</div>
                      <div className="col-span-2"><strong>Actual:</strong> {calendarDetail.actual || 'Not released yet'}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground leading-relaxed">{calendarDetail.description}</div>
                    <div className="text-xs text-muted-foreground"><strong>Source:</strong> {calendarDetail.source}</div>
                    <div className="text-xs text-muted-foreground"><strong>Related assets:</strong> {calendarDetail.relatedAssets.join(', ')}</div>
                  </>
                ) : (
                  <EmptyState icon={CalendarClock} title="No event selected" description="Select an event to view the full market context." />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-sm">Market news</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={newsFilters.search} onChange={(e) => setNewsFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Search headlines" className="h-9 w-full md:w-56 pl-9" />
                  </div>
                  <select value={newsFilters.currency} onChange={(e) => setNewsFilters((prev) => ({ ...prev, currency: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="all">Currency</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                  <select value={newsFilters.category} onChange={(e) => setNewsFilters((prev) => ({ ...prev, category: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="all">Category</option>
                    <option value="Forex">Forex</option>
                    <option value="Stocks">Stocks</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Central Banks">Central Banks</option>
                    <option value="Macroeconomics">Macroeconomics</option>
                    <option value="Geopolitics">Geopolitics</option>
                    <option value="General Markets">General Markets</option>
                  </select>
                  <select value={newsFilters.sortBy} onChange={(e) => setNewsFilters((prev) => ({ ...prev, sortBy: e.target.value }))} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                    <option value="newest">Newest</option>
                    <option value="relevant">Relevant</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {news.length === 0 ? (
                <EmptyState icon={Newspaper} title="No news matches" description="Try broadening the filters or search query." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {news.map((item) => (
                    <Card key={item.id} className="border border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-[10px] uppercase">{item.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(item.publishedAt).toLocaleString()}</span>
                        </div>
                        <div className="font-semibold text-sm">{item.headline}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => <Badge key={`${item.id}-${tag}`} variant="outline" className="text-[10px]">{tag}</Badge>)}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{item.source}</span>
                          <span>{item.country} · {item.currency} · {item.asset}</span>
                        </div>
                        <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary hover:underline">Open article</a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sessions.map((session) => (
              <Card key={session.name} className="border border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{session.name}</div>
                    <Badge className={cn('text-[10px] uppercase', session.status === 'Open' ? 'bg-success/15 text-success' : session.status === 'Opening Soon' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground')}>{session.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{session.openTime} – {session.closeTime}</div>
                  <div className="text-xs text-muted-foreground">Time remaining: {session.timeRemaining}</div>
                  <div className="text-xs text-muted-foreground">Overlap: {session.overlap.join(', ') || '—'}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4 pt-4">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">My watchlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input value={newWatchItem.symbol} onChange={(e) => setNewWatchItem((prev) => ({ ...prev, symbol: e.target.value }))} placeholder="Symbol (EUR/USD)" />
                  <Input value={newWatchItem.market} onChange={(e) => setNewWatchItem((prev) => ({ ...prev, market: e.target.value }))} placeholder="Market" />
                  <select value={newWatchItem.assetClass} onChange={(e) => setNewWatchItem((prev) => ({ ...prev, assetClass: e.target.value }))} className="h-10 rounded-md border border-border bg-background px-2 text-sm">
                    <option value="Forex">Forex</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Indices">Indices</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                  <select value={newWatchItem.preferredSession} onChange={(e) => setNewWatchItem((prev) => ({ ...prev, preferredSession: e.target.value }))} className="h-10 rounded-md border border-border bg-background px-2 text-sm">
                    <option value="Sydney">Sydney</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                  </select>
                  <Input value={newWatchItem.relatedCurrencies} onChange={(e) => setNewWatchItem((prev) => ({ ...prev, relatedCurrencies: e.target.value }))} placeholder="USD, EUR" className="md:col-span-2" />
                  <Input value={newWatchItem.notes} onChange={(e) => setNewWatchItem((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Context notes" className="md:col-span-2" />
                </div>
                <Button onClick={handleAddWatchItem} variant="outline" className="w-full"><Plus className="w-4 h-4 mr-2" /> Add to watchlist</Button>

                <div className="space-y-2">
                  {watchlist.map((item) => {
                    const relevantEvents = MARKET_EVENTS.filter((event) => item.relatedCurrencies.some((currency) => event.currency === currency) || event.relatedAssets.includes(item.symbol)).slice(0, 2);
                    const relevantNews = MARKET_NEWS.filter((article) => article.asset === item.symbol || article.currency === item.relatedCurrencies[0]).slice(0, 2);
                    return (
                      <div key={item.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-medium">{item.symbol}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.assetClass} · {item.market}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{item.preferredSession}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.notes || 'No notes yet.'}</div>
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1"><BellRing className="w-3 h-3" /> Upcoming events: {relevantEvents.length > 0 ? relevantEvents.map((event) => event.title).join(', ') : 'No scheduled events'}</div>
                          <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> Relevant news: {relevantNews.length > 0 ? relevantNews.map((article) => article.headline).join(' · ') : 'No current news'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div><strong>Preferred countries:</strong> {MARKET_CONTEXT_PREFERENCES.preferredCountries.join(', ')}</div>
                  <div><strong>Preferred currencies:</strong> {MARKET_CONTEXT_PREFERENCES.preferredCurrencies.join(', ')}</div>
                  <div><strong>Minimum impact:</strong> {MARKET_CONTEXT_PREFERENCES.minimumImpact}</div>
                  <div><strong>Default range:</strong> {MARKET_CONTEXT_PREFERENCES.defaultCalendarRange}</div>
                  <div><strong>Timezone:</strong> {MARKET_CONTEXT_PREFERENCES.timezone}</div>
                  <div><strong>News categories:</strong> {MARKET_CONTEXT_PREFERENCES.newsCategories.join(', ')}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground leading-relaxed">
                  Notification preferences are intentionally kept workspace-scoped and are future-ready for high-impact events, session open reminders, and relevant market-news alerts.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
