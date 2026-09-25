'use client';
import { useMemo, useState } from 'react';
import { BarChart3, PieChart as PieIcon, Calendar, Clock, Layers, Compass } from 'lucide-react';
import type { Metrics } from '@/lib/analytics';
import { BarChart, PieChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCompact } from '@/lib/format';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function PerformanceCharts({ metrics }: { metrics: Metrics }) {
  const [period, setPeriod] = useState<Period>('daily');

  const pnlData = useMemo(() => {
    switch (period) {
      case 'daily': return metrics.dailyPnl.map((d) => ({ label: d.date, pnl: d.pnl }));
      case 'weekly': return metrics.weeklyPnl.map((d) => ({ label: d.week, pnl: d.pnl }));
      case 'monthly': return metrics.monthlyPnl.map((d) => ({ label: d.month, pnl: d.pnl }));
      case 'yearly': return metrics.yearlyPnl.map((d) => ({ label: d.year, pnl: d.pnl }));
    }
  }, [metrics, period]);

  const winLossData = [
    { name: 'Winning', value: metrics.totalWins, color: 'hsl(var(--chart-2))' },
    { name: 'Losing', value: metrics.totalLosses, color: 'hsl(var(--chart-4))' },
    { name: 'Breakeven', value: metrics.breakeven, color: 'hsl(var(--chart-5))' },
  ].filter((d) => d.value > 0);

  const profitDistData = useMemo(() => {
    const buckets = [
      { range: '< -$500', min: -Infinity, max: -500, count: 0, color: 'hsl(var(--chart-4))' },
      { range: '-$500 to -$100', min: -500, max: -100, count: 0, color: 'hsl(var(--chart-4))' },
      { range: '-$100 to $0', min: -100, max: 0, count: 0, color: 'hsl(var(--chart-5))' },
      { range: '$0 to $100', min: 0, max: 100, count: 0, color: 'hsl(var(--chart-5))' },
      { range: '$100 to $500', min: 100, max: 500, count: 0, color: 'hsl(var(--chart-2))' },
      { range: '> $500', min: 500, max: Infinity, count: 0, color: 'hsl(var(--chart-2))' },
    ];
    for (const t of metrics.recentTrades) {
      const pnl = Number(t.pnl);
      for (const b of buckets) {
        if (pnl >= b.min && pnl < b.max) { b.count++; break; }
      }
    }
    return buckets.map((b) => ({ label: b.range, count: b.count, color: b.color }));
  }, [metrics.recentTrades]);

  const sessionData = Object.entries(metrics.bySession).map(([k, v]) => ({ label: k, pnl: v.pnl, trades: v.trades }));
  const dayOfWeekData = Object.entries(metrics.byDayOfWeek).map(([k, v]) => ({ label: k.slice(0, 3), pnl: v.pnl, trades: v.trades }));
  const hourData = Object.entries(metrics.byHour).map(([k, v]) => ({ label: k, pnl: v.pnl, trades: v.trades })).sort((a, b) => a.label.localeCompare(b.label));
  const instrumentData = Object.entries(metrics.byInstrument).map(([k, v]) => ({ label: k, pnl: v.pnl, trades: v.trades })).sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  const directionData = [
    { name: 'Long', value: metrics.byDirection.long.trades, color: 'hsl(var(--chart-2))' },
    { name: 'Short', value: metrics.byDirection.short.trades, color: 'hsl(var(--chart-4))' },
  ].filter((d) => d.value > 0);
  const rDistributionData = metrics.rDistribution.map((d) => ({ label: d.bucket, count: d.count, avgR: d.avgR }));

  return (
    <div className="space-y-6">
      {/* P&L by Period */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">P&L by Period</CardTitle>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
              )}>{p}</button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {pnlData && pnlData.length > 0 ? (
            <BarChart data={pnlData} xKey="label" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-1))' }]} height={260} formatY={(v) => formatCompact(v)} />
          ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
        </CardContent>
      </Card>

      {/* Win/Loss + Direction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><PieIcon className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Winning vs Losing Trades</CardTitle></div></CardHeader>
          <CardContent>
            {winLossData.length > 0 ? (
              <PieChart data={winLossData} height={260} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Compass className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Direction (Buy vs Sell)</CardTitle></div></CardHeader>
          <CardContent>
            {directionData.length > 0 ? (
              <PieChart data={directionData} height={260} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
      </div>

      {/* Profit Distribution + R-Multiple Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Profit Distribution</CardTitle></div></CardHeader>
          <CardContent>
            {profitDistData.some((d) => d.count > 0) ? (
              <BarChart data={profitDistData} xKey="label" bars={[{ key: 'count', name: 'Trades', color: 'hsl(var(--chart-3))' }]} height={260} formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><CardTitle className="text-sm">R-Multiple Distribution</CardTitle></div></CardHeader>
          <CardContent>
            {rDistributionData.some((d) => d.count > 0) ? (
              <BarChart data={rDistributionData} xKey="label" bars={[{ key: 'count', name: 'Trades', color: 'hsl(var(--chart-5))' }]} height={260} formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
      </div>

      {/* Trade Frequency + Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Trade Frequency</CardTitle></div></CardHeader>
          <CardContent>
            {metrics.dailyPnl.length > 0 ? (
              <BarChart data={metrics.dailyPnl.map((d) => ({ label: d.date, count: 1 }))} xKey="label" bars={[{ key: 'count', name: 'Trades', color: 'hsl(var(--chart-1))' }]} height={260} formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Session Performance</CardTitle></div></CardHeader>
          <CardContent>
            {sessionData.length > 0 ? (
              <BarChart data={sessionData} xKey="label" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-2))' }]} height={260} formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
      </div>

      {/* Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Day of Week Performance</CardTitle></div></CardHeader>
          <CardContent>
            {dayOfWeekData.length > 0 ? (
              <BarChart data={dayOfWeekData} xKey="label" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-3))' }]} height={260} formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Hour of Day Performance</CardTitle></div></CardHeader>
          <CardContent>
            {hourData.length > 0 ? (
              <BarChart data={hourData} xKey="label" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-4))' }]} height={260} formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
      </div>

      {/* Instrument */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><CardTitle className="text-sm">Instrument Performance (Top 10)</CardTitle></div></CardHeader>
          <CardContent>
            {instrumentData.length > 0 ? (
              <BarChart data={instrumentData} xKey="label" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-5))' }]} height={260} horizontal formatY={(v) => formatCompact(v)} />
            ) : <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No data</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
