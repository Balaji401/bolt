'use client';

import { useMemo, useState, useEffect } from 'react';
import { CalendarDays, Filter, AlertOctagon, Clock, X, ChevronLeft, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { supabase, type Trade } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Event = {
  id: string;
  date: string; // ISO date
  time: string;
  currency: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
  actual?: string;
  source: string;
  description: string;
  affects: string[]; // instruments / asset classes affected
};

const SOURCE_FEEDS = ['ForexFactory', 'Investing.com', 'DailyFX', 'TradingEconomics', 'Bloomberg'];

function buildEvents(): Event[] {
  const today = new Date();
  const mk = (offset: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: 'e1', date: mk(0), time: '08:30', currency: 'USD', title: 'Non-Farm Payrolls', impact: 'high', forecast: '180K', previous: '175K', source: 'ForexFactory', description: 'The NFP report shows the change in number of employed people during the previous month, excluding the farming industry. High volatility expected across USD pairs and gold.', affects: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30', 'SP500'] },
    { id: 'e2', date: mk(0), time: '08:30', currency: 'USD', title: 'Unemployment Rate', impact: 'high', forecast: '4.1%', previous: '4.1%', source: 'ForexFactory', description: 'Percentage of total work force that is unemployed and actively seeking employment. Released alongside NFP.', affects: ['EURUSD', 'USDJPY', 'XAUUSD'] },
    { id: 'e3', date: mk(0), time: '10:00', currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', forecast: '48.7', previous: '48.5', source: 'Investing.com', description: 'ISM Manufacturing PMI measures the activity level of purchasing managers in the manufacturing sector. Above 50 indicates expansion.', affects: ['US30', 'SP500', 'NAS100', 'USDJPY'] },
    { id: 'e4', date: mk(0), time: '12:30', currency: 'EUR', title: 'ECB Interest Rate Decision', impact: 'high', forecast: '3.65%', previous: '3.75%', source: 'DailyFX', description: 'European Central Bank minimum bid rate. Traders watch the statement for forward guidance on future rate moves.', affects: ['EURUSD', 'GBPUSD', 'EURJPY', 'GER30'] },
    { id: 'e5', date: mk(0), time: '14:00', currency: 'GBP', title: 'BoE Gov Bailey Speech', impact: 'medium', forecast: '—', previous: '—', source: 'Bloomberg', description: 'Bank of England Governor Andrew Bailey speaks. Market participants look for hints on monetary policy direction.', affects: ['GBPUSD', 'GBPJPY', 'EURGBP'] },
    { id: 'e6', date: mk(0), time: '23:50', currency: 'JPY', title: 'BoJ Policy Rate', impact: 'high', forecast: '0.10%', previous: '0.10%', source: 'TradingEconomics', description: 'Bank of Japan policy rate. Any change or shift in tone has outsized impact on JPY crosses.', affects: ['USDJPY', 'GBPJPY', 'EURJPY'] },
    { id: 'e7', date: mk(1), time: '01:30', currency: 'AUD', title: 'RBA Rate Statement', impact: 'medium', forecast: '—', previous: '—', source: 'ForexFactory', description: 'Reserve Bank of Australia rate statement. The RBA commentary on inflation and growth drives AUD direction.', affects: ['AUDUSD', 'AUDJPY', 'NZDUSD'] },
    { id: 'e8', date: mk(1), time: '09:00', currency: 'EUR', title: 'German CPI (YoY)', impact: 'medium', forecast: '2.3%', previous: '2.2%', source: 'Investing.com', description: 'German consumer price inflation. A leading input for ECB policy decisions.', affects: ['EURUSD', 'EURGBP', 'GER30'] },
    { id: 'e9', date: mk(1), time: '13:30', currency: 'CAD', title: 'GDP MoM', impact: 'low', forecast: '0.2%', previous: '0.1%', source: 'DailyFX', description: 'Canadian monthly gross domestic product. Affects CAD crosses, particularly USDCAD and oil-correlated pairs.', affects: ['USDCAD', 'CADJPY', 'BRENT', 'CRUDE'] },
    { id: 'e10', date: mk(1), time: '15:30', currency: 'USD', title: 'Crude Oil Inventories', impact: 'low', forecast: '-1.2M', previous: '3.4M', source: 'TradingEconomics', description: 'EIA weekly crude oil stocks change. Larger than expected draws are bullish for oil prices.', affects: ['BRENT', 'CRUDE', 'USDCAD'] },
    { id: 'e11', date: mk(2), time: '08:30', currency: 'USD', title: 'CPI (YoY)', impact: 'high', forecast: '3.1%', previous: '3.3%', source: 'ForexFactory', description: 'US consumer price index year-over-year. The single most important USD driver for the month.', affects: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SP500', 'NAS100', 'US30', 'BTCUSD'] },
    { id: 'e12', date: mk(2), time: '14:00', currency: 'USD', title: 'FOMC Statement & Rate Decision', impact: 'high', forecast: '5.50%', previous: '5.50%', source: 'Bloomberg', description: 'Federal Open Market Committee statement and federal funds rate. Press conference follows 30 minutes later.', affects: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SP500', 'NAS100', 'US30', 'BTCUSD', 'ETHUSD'] },
    { id: 'e13', date: mk(3), time: '08:30', currency: 'USD', title: 'Retail Sales (MoM)', impact: 'medium', forecast: '0.3%', previous: '0.1%', source: 'Investing.com', description: 'US retail sales month-over-month. A gauge of consumer spending, the largest component of US GDP.', affects: ['US30', 'SP500', 'NAS100', 'USDJPY'] },
    { id: 'e14', date: mk(3), time: '10:30', currency: 'EUR', title: 'ECB President Lagarde Speech', impact: 'medium', forecast: '—', previous: '—', source: 'DailyFX', description: 'ECB President Christine Lagarde speaks. Markets parse her tone for forward guidance.', affects: ['EURUSD', 'EURGBP', 'EURJPY', 'GER30'] },
    { id: 'e15', date: mk(4), time: '02:00', currency: 'CNY', title: 'Chinese Industrial Production', impact: 'medium', forecast: '5.2%', previous: '5.0%', source: 'TradingEconomics', description: 'China industrial production growth. Affects commodity currencies (AUD, NZD) and industrial metals.', affects: ['AUDUSD', 'NZDUSD', 'XAUUSD', 'XAGUSD', 'BRENT', 'CRUDE'] },
    { id: 'e16', date: mk(4), time: '13:00', currency: 'USD', title: 'Consumer Sentiment (UoM)', impact: 'low', forecast: '78.0', previous: '77.5', source: 'ForexFactory', description: 'University of Michigan consumer sentiment preliminary reading.', affects: ['US30', 'SP500', 'USDJPY'] },
    { id: 'e17', date: mk(-1), time: '09:00', currency: 'EUR', title: 'Eurozone HICP (YoY)', impact: 'high', forecast: '2.4%', previous: '2.5%', source: 'Investing.com', description: 'Eurozone harmonized index of consumer prices. Key ECB inflation gauge.', affects: ['EURUSD', 'EURGBP', 'EURJPY', 'GER30'] },
    { id: 'e18', date: mk(-1), time: '13:30', currency: 'USD', title: 'Initial Jobless Claims', impact: 'medium', forecast: '220K', previous: '215K', source: 'ForexFactory', description: 'US weekly initial jobless claims. A high-frequency labor market indicator.', affects: ['EURUSD', 'USDJPY', 'SP500'] },
    { id: 'e19', date: mk(5), time: '00:30', currency: 'JPY', title: 'Tokyo CPI (YoY)', impact: 'medium', forecast: '2.1%', previous: '2.0%', source: 'Bloomberg', description: 'Tokyo consumer price index. A leading indicator for nationwide Japan CPI and BoJ policy.', affects: ['USDJPY', 'GBPJPY', 'EURJPY'] },
    { id: 'e20', date: mk(5), time: '08:30', currency: 'GBP', title: 'UK GDP (QoQ)', impact: 'high', forecast: '0.2%', previous: '0.1%', source: 'DailyFX', description: 'UK quarterly gross domestic product growth. Affects BoE rate expectations.', affects: ['GBPUSD', 'GBPJPY', 'EURGBP', 'UK100'] },
  ];
}

const impactStyle: Record<string, { dot: string; text: string; bg: string }> = {
  high: { dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' },
  low: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDateLong(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(s: string) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function EconomicCalendar() {
  const allEvents = useMemo(() => buildEvents(), []);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Event | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [relevantOnly, setRelevantOnly] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    supabase.from('trades').select('*').then(({ data }) => setTrades((data || []) as Trade[]));
  }, []);

  const tradedInstruments = useMemo(() => new Set(trades.map((t) => t.instrument)), [trades]);

  const currencies = Array.from(new Set(allEvents.map((e) => e.currency)));
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + dayOffset);
  const baseDateStr = baseDate.toISOString().slice(0, 10);

  const filtered = useMemo(
    () =>
      allEvents
        .filter((e) => e.date === baseDateStr)
        .filter((e) => (filter === 'all' ? true : e.impact === filter))
        .filter((e) => (currencyFilter === 'all' ? true : e.currency === currencyFilter))
        .filter((e) => (relevantOnly ? e.affects.some((a) => tradedInstruments.has(a)) : true))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [allEvents, baseDateStr, filter, currencyFilter, relevantOnly, tradedInstruments]
  );

  const weekDays = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [dayOffset]);

  const countsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    allEvents.forEach((e) => { map[e.date] = (map[e.date] || 0) + 1; });
    return map;
  }, [allEvents]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Week strip */}
      <div className="glass rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDayOffset((d) => d - 7)} className="p-1.5 rounded hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium">{fmtDateLong(baseDate)}</span>
          <button onClick={() => setDayOffset((d) => d + 7)} className="p-1.5 rounded hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => {
            const date = new Date(d + 'T00:00:00');
            const isToday = d === new Date().toISOString().slice(0, 10);
            const isSelected = d === baseDateStr;
            const count = countsByDay[d] || 0;
            return (
              <button
                key={d}
                onClick={() => setDayOffset(((date.getTime() - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00').getTime()) / 86400000))}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-secondary/60 text-foreground' : 'hover:bg-secondary/40 text-muted-foreground'
                )}
              >
                <span className="text-[10px] uppercase tracking-wider">{DAY_LABELS[i]}</span>
                <span className="text-base font-semibold">{date.getDate()}</span>
                <span className={cn('text-[10px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{count} events</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="w-4 h-4" /> Impact:</div>
        <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-0.5">
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors', filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground md:ml-4">Currency:</div>
        <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-0.5 flex-wrap">
          <button onClick={() => setCurrencyFilter('all')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', currencyFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>All</button>
          {currencies.map((c) => (
            <button key={c} onClick={() => setCurrencyFilter(c)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', currencyFilter === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{c}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer md:ml-auto text-sm">
          <input type="checkbox" checked={relevantOnly} onChange={(e) => setRelevantOnly(e.target.checked)} className="accent-primary w-4 h-4" />
          <Star className="w-4 h-4 text-warning" />
          <span>Only events affecting my trades</span>
        </label>
      </div>

      {/* Events */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">{fmtDateLong(baseDate)}</h3>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} events</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            {relevantOnly ? 'No events match your traded instruments on this day.' : 'No events scheduled for this day.'}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((e) => {
              const s = impactStyle[e.impact];
              const isRelevant = e.affects.some((a) => tradedInstruments.has(a));
              return (
                <button key={e.id} onClick={() => setSelected(e)} className="w-full px-5 py-3 flex items-center gap-4 hover:bg-secondary/20 transition-colors text-left">
                  <div className="flex items-center gap-2 w-20 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{e.time}</span>
                  </div>
                  <div className="grid place-items-center w-12 h-7 rounded bg-secondary/60 text-xs font-semibold">{e.currency}</div>
                  <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium', s.bg, s.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                    <span className="capitalize">{e.impact}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {e.title}
                      {isRelevant && <Star className="w-3 h-3 text-warning fill-warning" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">Affects: {e.affects.slice(0, 4).join(', ')}{e.affects.length > 4 ? '...' : ''}</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="text-center"><div className="text-[10px] uppercase tracking-wider">Forecast</div><div className="text-foreground font-medium">{e.forecast}</div></div>
                    <div className="text-center"><div className="text-[10px] uppercase tracking-wider">Previous</div><div className="text-foreground font-medium">{e.previous}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <AlertOctagon className="w-5 h-5 text-warning shrink-0" />
        <p className="text-sm text-muted-foreground">High-impact events can cause significant volatility. Consider pausing new positions 15 minutes before and after red-folder events. Events sourced from {SOURCE_FEEDS.join(', ')}.</p>
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} relevant={selected.affects.some((a) => tradedInstruments.has(a))} />}
    </div>
  );
}

function EventDetail({ event, onClose, relevant }: { event: Event; onClose: () => void; relevant: boolean }) {
  const s = impactStyle[event.impact];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-lg p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-lg bg-secondary/60 text-sm font-semibold">{event.currency}</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{event.title}</h2>
                {relevant && <Star className="w-4 h-4 text-warning fill-warning" />}
              </div>
              <div className="text-xs text-muted-foreground">{fmtDateShort(event.date)} • {event.time} • {event.source}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mb-4', s.bg, s.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
          <span className="capitalize">{event.impact} impact</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Stat label="Forecast" value={event.forecast} />
          <Stat label="Previous" value={event.previous} />
          <Stat label="Actual" value={event.actual || '—'} highlight={!!event.actual} />
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Description</div>
          <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Instruments Affected
          </div>
          <div className="flex flex-wrap gap-1.5">
            {event.affects.map((a) => (
              <span key={a} className="text-xs px-2 py-1 rounded bg-secondary/60 border border-border font-medium">{a}</span>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-3 border-t border-border">Source: {event.source}. Data shown is illustrative and aggregated from public financial feeds.</div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn('text-base font-semibold', highlight && 'text-primary')}>{value}</div>
    </div>
  );
}
