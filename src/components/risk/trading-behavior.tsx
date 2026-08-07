'use client';
import { Brain, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import type { RiskMetrics } from '@/lib/risk';
import { BarChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function TradingBehavior({ metrics }: { metrics: RiskMetrics }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Trading Behavior Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Behavior stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BehaviorStat label="Risk Consistency" value={`${metrics.riskConsistency.toFixed(0)}%`} positive={metrics.riskConsistency >= 70} negative={metrics.riskConsistency < 50} />
          <BehaviorStat label="Avg Risk %" value={`${metrics.avgRiskPct.toFixed(2)}%`} />
          <BehaviorStat label="Over-Risking Freq." value={`${metrics.overRiskingFrequency.toFixed(0)}%`} negative={metrics.overRiskingFrequency > 20} />
          <BehaviorStat label="Under-Risking Freq." value={`${metrics.underRiskingFrequency.toFixed(0)}%`} negative={metrics.underRiskingFrequency > 30} />
        </div>

        {/* Streak behavior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold">Winning Streak Behavior</span>
            </div>
            <div className="text-sm text-muted-foreground">
              After a win, your next trade averages{' '}
              <span className={cn('font-semibold', metrics.winningStreakBehavior.avgPnlAfterWin >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(metrics.winningStreakBehavior.avgPnlAfterWin)}
              </span>
              {' '}({metrics.winningStreakBehavior.count} occurrences)
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs font-semibold">Losing Streak Behavior</span>
            </div>
            <div className="text-sm text-muted-foreground">
              After a loss, your next trade averages{' '}
              <span className={cn('font-semibold', metrics.losingStreakBehavior.avgPnlAfterLoss >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(metrics.losingStreakBehavior.avgPnlAfterLoss)}
              </span>
              {' '}({metrics.losingStreakBehavior.count} occurrences)
            </div>
          </div>
        </div>

        {/* Risk distribution chart */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">Risk % Distribution</span>
          </div>
          {metrics.riskDistribution.some((d) => d.count > 0) ? (
            <BarChart data={metrics.riskDistribution} xKey="bucket" bars={[{ key: 'count', name: 'Trades', color: 'hsl(var(--chart-3))' }]} height={200} />
          ) : (
            <div className="grid place-items-center h-[200px] text-sm text-muted-foreground">No risk data</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BehaviorStat({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={cn('text-sm font-bold tabular-nums mt-0.5', positive && 'text-success', negative && 'text-destructive')}>{value}</div>
    </div>
  );
}
