'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Filter, AlertOctagon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Event = {
  time: string;
  currency: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
  actual?: string;
};

const EVENTS: Event[] = [
  { time: '08:30', currency: 'USD', title: 'Non-Farm Payrolls', impact: 'high', forecast: '180K', previous: '175K' },
  { time: '08:30', currency: 'USD', title: 'Unemployment Rate', impact: 'high', forecast: '4.1%', previous: '4.1%' },
  { time: '10:00', currency: 'USD', title: 'ISM Manufacturing PMI', impact: 'high', forecast: '48.7', previous: '48.5' },
  { time: '12:30', currency: 'EUR', title: 'ECB Interest Rate Decision', impact: 'high', forecast: '3.65%', previous: '3.75%' },
  { time: '14:00', currency: 'GBP', title: 'BoE Gov Bailey Speech', impact: 'medium', forecast: '—', previous: '—' },
  { time: '23:50', currency: 'JPY', title: 'BoJ Policy Rate', impact: 'high', forecast: '0.10%', previous: '0.10%' },
  { time: '01:30', currency: 'AUD', title: 'RBA Rate Statement', impact: 'medium', forecast: '—', previous: '—' },
  { time: '09:00', currency: 'EUR', title: 'German CPI (YoY)', impact: 'medium', forecast: '2.3%', previous: '2.2%' },
  { time: '13:30', currency: 'CAD', title: 'GDP MoM', impact: 'low', forecast: '0.2%', previous: '0.1%' },
  { time: '15:30', currency: 'USD', title: 'Crude Oil Inventories', impact: 'low', forecast: '-1.2M', previous: '3.4M' },
];

const impactStyle: Record<string, { dot: string; text: string; bg: string }> = {
  high: { dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' },
  low: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
};

export function EconomicCalendar() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  const currencies = Array.from(new Set(EVENTS.map((e) => e.currency)));
  const filtered = useMemo(
    () => EVENTS.filter((e) => (filter === 'all' ? true : e.impact === filter)).filter((e) => (currencyFilter === 'all' ? true : e.currency === currencyFilter)),
    [filter, currencyFilter]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" /> Impact:
        </div>
        <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-0.5">
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors', filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground md:ml-4">
          Currency:
        </div>
        <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-0.5 flex-wrap">
          <button onClick={() => setCurrencyFilter('all')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', currencyFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>All</button>
          {currencies.map((c) => (
            <button key={c} onClick={() => setCurrencyFilter(c)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', currencyFilter === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{c}</button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Today&apos;s Events</h3>
          <span className="ml-auto text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="divide-y divide-border/40">
          {filtered.map((e, i) => {
            const s = impactStyle[e.impact];
            return (
              <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-2 w-20 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{e.time}</span>
                </div>
                <div className="grid place-items-center w-12 h-7 rounded bg-secondary/60 text-xs font-semibold">{e.currency}</div>
                <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium', s.bg, s.text)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                  <span className="capitalize">{e.impact}</span>
                </div>
                <div className="flex-1 min-w-0 text-sm font-medium truncate">{e.title}</div>
                <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="text-center"><div className="text-[10px] uppercase tracking-wider">Forecast</div><div className="text-foreground font-medium">{e.forecast}</div></div>
                  <div className="text-center"><div className="text-[10px] uppercase tracking-wider">Previous</div><div className="text-foreground font-medium">{e.previous}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <AlertOctagon className="w-5 h-5 text-warning shrink-0" />
        <p className="text-sm text-muted-foreground">High-impact events can cause significant volatility. Consider pausing new positions 15 minutes before and after red-folder events.</p>
      </div>
    </div>
  );
}
