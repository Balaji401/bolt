'use client';
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, Award, AlertTriangle, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMemo } from 'react';
import type { Trade, AiInsight, OpenPosition, TradingGoal } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { formatCurrency, formatPercent, formatCompact, formatDateTime } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart } from '@/components/charts';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

export function Dashboard({ trades, insights, positions, goals }: { trades: Trade[]; insights: AiInsight[]; positions: OpenPosition[]; goals: TradingGoal[] }) {
  const metrics = useMemo(() => computeMetrics(trades), [trades]);

  if (trades.length === 0) {
    return <EmptyState icon={TrendingUp} title="No trades yet" description="Start by adding your first trade in the Trading Journal. Your dashboard will come alive with performance metrics, equity curves, and AI insights." />;
  }

  const openPositions = positions.filter((p) => p);
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total P&L" value={formatCurrency(metrics.totalPnl)} accent={metrics.totalPnl >= 0 ? 'success' : 'destructive'} delta={metrics.totalTrades > 0 ? `${metrics.totalTrades} trades` : ''} />
        <KpiCard icon={Target} label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} accent="primary" delta={`${metrics.totalWins}W / ${metrics.totalLosses}L`} />
        <KpiCard icon={Activity} label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)} accent={metrics.profitFactor >= 1 ? 'success' : 'destructive'} delta={`Avg: ${formatCurrency(metrics.expectancy)}`} />
        <KpiCard icon={Award} label="Best Streak" value={`${metrics.maxWinStreak}`} accent="warning" delta={`Worst: ${metrics.maxLossStreak}`} />
      </div>

      {/* Equity Curve */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Equity Curve</CardTitle></CardHeader>
        <CardContent>
          {metrics.equity.length > 0 ? (
            <AreaChart data={metrics.equity} xKey="date" areas={[{ key: 'cumulative', name: 'Equity', color: 'hsl(var(--primary))' }]} height={300} formatY={(v) => formatCompact(v)} />
          ) : <EmptyState title="No equity data" description="Equity curve will appear once you have closed trades." />}
        </CardContent>
      </Card>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Trades</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentTrades.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0', t.pnl >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                      {t.direction === 'long' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.instrument}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(t.executed_at)}</div>
                    </div>
                  </div>
                  <div className={cn('text-sm font-semibold tabular-nums', t.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(t.pnl))}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Insights</CardTitle></CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.slice(0, 4).map((insight) => {
                  const Icon = insight.severity === 'critical' ? AlertTriangle : insight.severity === 'warning' ? AlertTriangle : insight.severity === 'success' ? Award : Sparkles;
                  return (
                    <div key={insight.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', insight.severity === 'critical' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : insight.severity === 'success' ? 'text-success' : 'text-primary')} />
                      <div><div className="text-sm font-medium">{insight.title}</div><div className="text-xs text-muted-foreground">{insight.body}</div></div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState title="No insights yet" description="AI insights will be generated as you add trades." />}
          </CardContent>
        </Card>
      </div>

      {/* Open Positions + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Open Positions</CardTitle></CardHeader>
          <CardContent>
            {openPositions.length > 0 ? (
              <div className="space-y-2">
                {openPositions.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3"><Badge variant={p.direction === 'long' ? 'success' : 'destructive'}>{p.direction.toUpperCase()}</Badge><span className="text-sm font-medium">{p.instrument}</span></div>
                    <span className={cn('text-sm font-semibold tabular-nums', Number(p.floating_pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(p.floating_pnl))}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No open positions" description="Connect a broker to see live positions." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Active Goals</CardTitle></CardHeader>
          <CardContent>
            {activeGoals.length > 0 ? (
              <div className="space-y-3">
                {activeGoals.map((g) => {
                  const progress = g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0;
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm"><span className="font-medium">{g.title}</span><span className="text-muted-foreground">{progress.toFixed(0)}%</span></div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${progress}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState title="No active goals" description="Set trading goals to track your progress." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent, delta }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: 'primary' | 'success' | 'warning' | 'destructive'; delta?: string }) {
  const colors = { primary: 'text-primary bg-primary/10', success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', destructive: 'text-destructive bg-destructive/10' };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('grid place-items-center w-9 h-9 rounded-lg', colors[accent])}><Icon className="w-4 h-4" /></div>
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {delta && <div className="text-[10px] text-muted-foreground mt-1">{delta}</div>}
      </CardContent>
    </Card>
  );
}
