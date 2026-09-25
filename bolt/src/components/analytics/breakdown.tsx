'use client';
import { useState, useMemo } from 'react';
import { Table2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Metrics } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

type BreakdownKey = 'account' | 'instrument' | 'session' | 'timeframe' | 'direction' | 'day' | 'month' | 'year';

type SortDir = 'asc' | 'desc';

type Row = { label: string; trades: number; pnl: number; winRate: number };

export function PerformanceBreakdown({ metrics }: { metrics: Metrics }) {
  const [tab, setTab] = useState<BreakdownKey>('instrument');
  const [sortKey, setSortKey] = useState<'label' | 'trades' | 'pnl' | 'winRate'>('pnl');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const data = useMemo<Row[]>(() => {
    let rows: Row[] = [];
    switch (tab) {
      case 'account':
        rows = Object.entries(metrics.byAccount).map(([k, v]) => ({ label: k === 'manual' ? 'Manual' : k.slice(0, 8), ...v }));
        break;
      case 'instrument':
        rows = Object.entries(metrics.byInstrument).map(([k, v]) => ({ label: k, ...v }));
        break;
      case 'session':
        rows = Object.entries(metrics.bySession).map(([k, v]) => ({ label: k, ...v }));
        break;
      case 'timeframe':
        rows = Object.entries(metrics.byTimeframe).map(([k, v]) => ({ label: k, ...v }));
        break;
      case 'direction':
        rows = [
          { label: 'Long', ...metrics.byDirection.long },
          { label: 'Short', ...metrics.byDirection.short },
        ];
        break;
      case 'day':
        rows = Object.entries(metrics.byDay).map(([k, v]) => ({ label: k, ...v, winRate: 0 }));
        break;
      case 'month':
        rows = Object.entries(metrics.byMonth).map(([k, v]) => ({ label: k, ...v, winRate: 0 }));
        break;
      case 'year':
        rows = Object.entries(metrics.byYear).map(([k, v]) => ({ label: k, ...v, winRate: 0 }));
        break;
    }
    rows.sort((a, b) => {
      const av = sortKey === 'label' ? a[sortKey] : a[sortKey];
      const bv = sortKey === 'label' ? b[sortKey] : b[sortKey];
      if (sortKey === 'label') return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [metrics, tab, sortKey, sortDir]);

  const tabs: { key: BreakdownKey; label: string }[] = [
    { key: 'instrument', label: 'Instrument' },
    { key: 'account', label: 'Account' },
    { key: 'session', label: 'Session' },
    { key: 'timeframe', label: 'Timeframe' },
    { key: 'direction', label: 'Direction' },
    { key: 'day', label: 'Day' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  const toggleSort = (key: 'label' | 'trades' | 'pnl' | 'winRate') => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: 'label' | 'trades' | 'pnl' | 'winRate' }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Performance Breakdown</CardTitle>
        </div>
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            )}>{t.label}</button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/50 border-b border-border">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('label')}>
                    <span className="flex items-center gap-1">Label <SortIcon col="label" /></span>
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('trades')}>
                    <span className="flex items-center gap-1 justify-end">Trades <SortIcon col="trades" /></span>
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('pnl')}>
                    <span className="flex items-center gap-1 justify-end">P&L <SortIcon col="pnl" /></span>
                  </th>
                  {tab !== 'day' && tab !== 'month' && tab !== 'year' && (
                    <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('winRate')}>
                      <span className="flex items-center gap-1 justify-end">Win Rate <SortIcon col="winRate" /></span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2 text-sm font-medium capitalize">{row.label}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{row.trades}</td>
                    <td className={cn('px-3 py-2 text-right text-sm font-semibold tabular-nums', row.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(row.pnl)}</td>
                    {tab !== 'day' && tab !== 'month' && tab !== 'year' && (
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-muted-foreground">{row.winRate.toFixed(1)}%</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid place-items-center h-32 text-sm text-muted-foreground">No data for this breakdown</div>
        )}
      </CardContent>
    </Card>
  );
}
