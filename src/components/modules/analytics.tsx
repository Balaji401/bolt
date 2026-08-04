'use client';
import { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { formatCurrency, formatPercent, formatCompact, formatDuration } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, AreaChart } from '@/components/charts';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

export function Analytics({ trades }: { trades: Trade[] }) {
  const metrics = useMemo(() => computeMetrics(trades), [trades]);

  if (trades.length === 0) return <EmptyState icon={BarChart3} title="No analytics yet" description="Add trades to see detailed performance analytics." />;

  const sessionData = Object.entries(metrics.bySession).map(([k, v]) => ({ session: k, pnl: v.pnl, trades: v.trades }));
  const dailyData = metrics.dailyPnl.map((d) => ({ date: d.date, pnl: d.pnl }));
  const instrumentData = Object.entries(metrics.byInstrument).map(([k, v]) => ({ instrument: k, pnl: v.pnl, trades: v.trades })).sort((a, b) => b.pnl - a.pnl).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total P&L" value={formatCurrency(metrics.totalPnl)} color={metrics.totalPnl >= 0 ? 'text-success' : 'text-destructive'} />
        <StatCard label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} color="text-primary" />
        <StatCard label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)} color={metrics.profitFactor >= 1 ? 'text-success' : 'text-destructive'} />
        <StatCard label="Expectancy" value={formatCurrency(metrics.expectancy)} color={metrics.expectancy >= 0 ? 'text-success' : 'text-destructive'} />
        <StatCard label="Avg Win" value={formatCurrency(metrics.avgWin)} color="text-success" />
        <StatCard label="Avg Loss" value={formatCurrency(-metrics.avgLoss)} color="text-destructive" />
        <StatCard label="Best Trade" value={formatCurrency(metrics.bestTrade)} color="text-success" />
        <StatCard label="Worst Trade" value={formatCurrency(metrics.worstTrade)} color="text-destructive" />
        <StatCard label="Max Win Streak" value={`${metrics.maxWinStreak}`} color="text-success" />
        <StatCard label="Max Loss Streak" value={`${metrics.maxLossStreak}`} color="text-destructive" />
        <StatCard label="Avg Hold Time" value={metrics.avgHoldTime > 0 ? formatDuration(metrics.avgHoldTime) : '—'} color="text-foreground" />
        <StatCard label="Avg Confidence" value={metrics.avgConfidence > 0 ? `${metrics.avgConfidence.toFixed(0)}` : '—'} color="text-foreground" />
      </div>

      {/* Daily P&L */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Daily P&L</CardTitle></CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <BarChart data={dailyData} xKey="date" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-1))' }]} height={280} formatY={(v) => formatCompact(v)} />
          ) : <EmptyState title="No daily data" />}
        </CardContent>
      </Card>

      {/* By Session + By Instrument */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">P&L by Session</CardTitle></CardHeader>
          <CardContent>
            {sessionData.length > 0 ? (
              <BarChart data={sessionData} xKey="session" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-2))' }]} height={250} formatY={(v) => formatCompact(v)} />
            ) : <EmptyState title="No session data" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">P&L by Instrument (Top 10)</CardTitle></CardHeader>
          <CardContent>
            {instrumentData.length > 0 ? (
              <BarChart data={instrumentData} xKey="instrument" bars={[{ key: 'pnl', name: 'P&L', color: 'hsl(var(--chart-3))' }]} height={250} horizontal formatY={(v) => formatCompact(v)} />
            ) : <EmptyState title="No instrument data" />}
          </CardContent>
        </Card>
      </div>

      {/* Direction breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Direction Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-success/10"><TrendingUp className="w-6 h-6 text-success mx-auto mb-2" /><div className="text-2xl font-bold">{metrics.byDirection.long.trades}</div><div className="text-xs text-muted-foreground">Long Trades</div><div className={cn('text-sm font-semibold mt-1', metrics.byDirection.long.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(metrics.byDirection.long.pnl)}</div></div>
              <div className="text-center p-4 rounded-lg bg-destructive/10"><TrendingUp className="w-6 h-6 text-destructive mx-auto mb-2 rotate-180" /><div className="text-2xl font-bold">{metrics.byDirection.short.trades}</div><div className="text-xs text-muted-foreground">Short Trades</div><div className={cn('text-sm font-semibold mt-1', metrics.byDirection.short.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(metrics.byDirection.short.pnl)}</div></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Strategy Tags</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(metrics.byTag).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(metrics.byTag).sort((a, b) => b[1].pnl - a[1].pnl).map(([tag, data]) => (
                  <div key={tag} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium">{tag}</span>
                    <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{data.trades} trades · {data.winRate.toFixed(0)}% WR</span><span className={cn('text-sm font-semibold', data.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(data.pnl)}</span></div>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No tags" description="Add strategy tags to your trades to see tag-level analytics." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return <Card><CardContent className="p-4"><div className={cn('text-xl font-bold tabular-nums', color)}>{value}</div><div className="text-xs text-muted-foreground mt-0.5">{label}</div></CardContent></Card>;
}
