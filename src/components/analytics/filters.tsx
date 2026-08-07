'use client';
import { Filter, X, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Trade } from '@/lib/supabase';
import type { FilterOptions } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function AnalyticsFilters({ trades, filters, onChange }: {
  trades: Trade[];
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const instruments = useMemo(() => [...new Set(trades.map((t) => t.instrument))].sort(), [trades]);
  const markets = useMemo(() => [...new Set(trades.map((t) => t.market).filter(Boolean) as string[])].sort(), [trades]);
  const sessions = useMemo(() => [...new Set(trades.map((t) => t.session).filter(Boolean) as string[])].sort(), [trades]);
  const strategies = useMemo(() => [...new Set(trades.flatMap((t) => t.strategy_tags || []))].sort(), [trades]);
  const timeframes = useMemo(() => [...new Set(trades.map((t) => t.timeframe).filter(Boolean) as string[])].sort(), [trades]);
  const setupTypes = useMemo(() => [...new Set(trades.map((t) => t.setup_type).filter(Boolean) as string[])].sort(), [trades]);

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.instrument || filters.market ||
    filters.strategy || filters.session || filters.direction || filters.setupType ||
    (filters.tags && filters.tags.length > 0) || filters.timeframe;

  const update = (key: keyof FilterOptions, value: any) => {
    onChange({ ...filters, [key]: value || null });
  };

  const clearAll = () => {
    onChange({
      dateFrom: null, dateTo: null, instrument: null, market: null,
      strategy: null, session: null, direction: null, setupType: null,
      tags: [], timeframe: null,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Filters</span>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
          {expanded ? 'Fewer filters' : 'More filters'}
          <ChevronDown className={cn('w-3 h-3 ml-1 transition-transform', expanded && 'rotate-180')} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">From Date</Label>
          <Input type="date" value={filters.dateFrom || ''} onChange={(e) => update('dateFrom', e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">To Date</Label>
          <Input type="date" value={filters.dateTo || ''} onChange={(e) => update('dateTo', e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Instrument</Label>
          <Select value={filters.instrument || 'all'} onValueChange={(v) => update('instrument', v === 'all' ? null : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All instruments</SelectItem>
              {instruments.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Direction</Label>
          <Select value={filters.direction || 'all'} onValueChange={(v) => update('direction', v === 'all' ? null : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All directions</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {markets.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Market</Label>
              <Select value={filters.market || 'all'} onValueChange={(v) => update('market', v === 'all' ? null : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  {markets.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {sessions.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Session</Label>
              <Select value={filters.session || 'all'} onValueChange={(v) => update('session', v === 'all' ? null : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sessions</SelectItem>
                  {sessions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {strategies.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Strategy</Label>
              <Select value={filters.strategy || 'all'} onValueChange={(v) => update('strategy', v === 'all' ? null : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All strategies</SelectItem>
                  {strategies.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {timeframes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Timeframe</Label>
              <Select value={filters.timeframe || 'all'} onValueChange={(v) => update('timeframe', v === 'all' ? null : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All timeframes</SelectItem>
                  {timeframes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {setupTypes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Setup Type</Label>
              <Select value={filters.setupType || 'all'} onValueChange={(v) => update('setupType', v === 'all' ? null : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All setups</SelectItem>
                  {setupTypes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
