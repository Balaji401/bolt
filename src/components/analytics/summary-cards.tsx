'use client';
import { DollarSign, Target, Activity, Award, TrendingUp, TrendingDown, BarChart3, Zap, Calendar, Scale, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { Metrics } from '@/lib/analytics';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function SummaryCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    { label: 'Total Trades', value: String(metrics.totalTrades), icon: BarChart3, accent: 'primary' as const, sub: `${metrics.totalWins}W / ${metrics.totalLosses}L / ${metrics.breakeven}BE` },
    { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%`, icon: Target, accent: 'success' as const, sub: `Loss: ${metrics.lossRate.toFixed(1)}%` },
    { label: 'Breakeven Rate', value: `${metrics.breakevenRate.toFixed(1)}%`, icon: Minus, accent: 'warning' as const, sub: `${metrics.breakeven} trades` },
    { label: 'Net Profit', value: formatCurrency(metrics.totalPnl), icon: DollarSign, accent: metrics.totalPnl >= 0 ? 'success' as const : 'destructive' as const, sub: 'All closed trades' },
    { label: 'Gross Profit', value: formatCurrency(metrics.grossProfit), icon: TrendingUp, accent: 'success' as const, sub: 'Winning trades only' },
    { label: 'Gross Loss', value: formatCurrency(-metrics.grossLoss), icon: TrendingDown, accent: 'destructive' as const, sub: 'Losing trades only' },
    { label: 'Profit Factor', value: metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2), icon: Scale, accent: metrics.profitFactor >= 1 ? 'success' as const : 'destructive' as const, sub: 'Gross profit / gross loss' },
    { label: 'Average RR', value: metrics.avgRr.toFixed(2), icon: Activity, accent: 'primary' as const, sub: 'Risk-reward ratio' },
    { label: 'Expectancy', value: formatCurrency(metrics.expectancy), icon: Zap, accent: metrics.expectancy >= 0 ? 'success' as const : 'destructive' as const, sub: 'Per trade avg' },
    { label: 'Average Win', value: formatCurrency(metrics.avgWin), icon: ArrowUp, accent: 'success' as const, sub: 'Per winning trade' },
    { label: 'Average Loss', value: formatCurrency(-metrics.avgLoss), icon: ArrowDown, accent: 'destructive' as const, sub: 'Per losing trade' },
    { label: 'Largest Win', value: formatCurrency(metrics.largestWin), icon: Award, accent: 'success' as const, sub: 'Best single trade' },
    { label: 'Largest Loss', value: formatCurrency(metrics.largestLoss), icon: TrendingDown, accent: 'destructive' as const, sub: 'Worst single trade' },
    { label: 'Current Streak', value: metrics.currentStreak > 0 ? `${metrics.currentWinStreak}W` : metrics.currentStreak < 0 ? `${metrics.currentLossStreak}L` : '—', icon: Activity, accent: metrics.currentStreak > 0 ? 'success' as const : metrics.currentStreak < 0 ? 'destructive' as const : 'warning' as const, sub: `Best: ${metrics.maxWinStreak}W / Worst: ${metrics.maxLossStreak}L` },
    { label: 'Best Trading Day', value: metrics.bestDay ? formatCurrency(metrics.bestDay.pnl) : '—', icon: Calendar, accent: 'success' as const, sub: metrics.bestDay ? metrics.bestDay.date : 'No data' },
    { label: 'Worst Trading Day', value: metrics.worstDay ? formatCurrency(metrics.worstDay.pnl) : '—', icon: Calendar, accent: 'destructive' as const, sub: metrics.worstDay ? metrics.worstDay.date : 'No data' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <SummaryCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  accent: 'primary' | 'success' | 'warning' | 'destructive'; sub?: string;
}) {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn('grid place-items-center w-7 h-7 rounded-lg', colors[accent])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
