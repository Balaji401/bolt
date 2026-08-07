'use client';
import { BarChart3, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import type { RiskMetrics, AdvancedStats } from '@/lib/risk';
import { BarChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

export function AdvancedStatistics({ metrics }: { metrics: RiskMetrics }) {
  const [showExplanations, setShowExplanations] = useState(false);
  const s = metrics.advancedStats;

  const stats: { label: string; value: string; explanation: string; positive?: boolean; negative?: boolean }[] = [
    { label: 'Profit Factor', value: s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2), explanation: 'Gross profit divided by gross loss. Above 1.0 means profitable.', positive: s.profitFactor >= 1, negative: s.profitFactor < 1 && s.profitFactor !== Infinity },
    { label: 'Recovery Factor', value: s.recoveryFactor.toFixed(2), explanation: 'Net profit divided by max drawdown. Measures how well you recover from losses.', positive: s.recoveryFactor >= 1 },
    { label: 'Expectancy', value: formatCurrency(s.expectancy), explanation: 'Average amount you expect to make per trade.', positive: s.expectancy >= 0, negative: s.expectancy < 0 },
    { label: 'Sharpe Ratio', value: s.sharpeRatio !== null ? s.sharpeRatio.toFixed(2) : 'N/A', explanation: 'Risk-adjusted return. Above 1.0 is good, above 2.0 is excellent.', positive: s.sharpeRatio !== null && s.sharpeRatio >= 1 },
    { label: 'Avg Holding Time', value: formatDuration(s.avgHoldingTime), explanation: 'Average duration of your trades.' },
    { label: 'Average Win', value: formatCurrency(s.avgWin), explanation: 'Average profit per winning trade.', positive: true },
    { label: 'Average Loss', value: formatCurrency(-s.avgLoss), explanation: 'Average loss per losing trade.', negative: true },
    { label: 'Largest Win', value: formatCurrency(s.largestWin), explanation: 'Your single best trade.', positive: true },
    { label: 'Largest Loss', value: formatCurrency(s.largestLoss), explanation: 'Your single worst trade.', negative: true },
    { label: 'Average Risk %', value: `${s.avgRisk.toFixed(2)}%`, explanation: 'Average risk percentage per trade.' },
    { label: 'Average Reward', value: `1:${s.avgReward.toFixed(2)}`, explanation: 'Average risk-reward ratio across trades.' },
    { label: 'Max Consecutive Wins', value: String(s.maxConsecutiveWins), explanation: 'Longest winning streak.', positive: true },
    { label: 'Max Consecutive Losses', value: String(s.maxConsecutiveLosses), explanation: 'Longest losing streak.', negative: true },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Advanced Statistics</CardTitle>
        </div>
        <button onClick={() => setShowExplanations(!showExplanations)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="w-3.5 h-3.5" /> {showExplanations ? 'Hide' : 'Show'} explanations
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border p-3">
              <div className="text-[10px] text-muted-foreground uppercase">{stat.label}</div>
              <div className={cn('text-base font-bold tabular-nums mt-0.5', stat.positive && 'text-success', stat.negative && 'text-destructive')}>{stat.value}</div>
              {showExplanations && <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{stat.explanation}</div>}
            </div>
          ))}
        </div>

        {/* RR Distribution */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Risk/Reward Distribution</h4>
          {s.rrDistribution.some((d) => d.count > 0) ? (
            <BarChart data={s.rrDistribution} xKey="bucket" bars={[{ key: 'count', name: 'Trades', color: 'hsl(var(--chart-2))' }]} height={200} />
          ) : (
            <div className="grid place-items-center h-[200px] text-sm text-muted-foreground">No RR data</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
