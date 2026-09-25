'use client';
import { TrendingDown, RotateCcw } from 'lucide-react';
import type { RiskMetrics } from '@/lib/risk';
import { AreaChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent, formatDate } from '@/lib/format';

export function DrawdownAnalysis({ metrics }: { metrics: RiskMetrics }) {
  const data = metrics.drawdownSeries.map((d) => ({ date: d.date, drawdown: d.drawdown }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Drawdown Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Current Drawdown" value={formatPercent(metrics.currentDrawdown, 1)} negative={metrics.currentDrawdown < 0} />
          <StatBox label="Max Drawdown" value={formatPercent(metrics.maxDrawdown, 1)} negative={metrics.maxDrawdown < 0} />
          <StatBox label="Recovery Progress" value={`${metrics.recoveryProgress.toFixed(0)}%`} positive={metrics.recoveryProgress >= 100} />
          <StatBox label="Recovery Days" value={metrics.recoveryDays > 0 ? `${metrics.recoveryDays}d` : '—'} />
        </div>

        {/* Timeline */}
        {metrics.maxDrawdownDate && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Max DD: <span className="font-medium text-foreground">{formatDate(metrics.maxDrawdownDate)}</span></span>
            {metrics.recoveryCompleteDate && (
              <span>Recovered: <span className="font-medium text-success">{formatDate(metrics.recoveryCompleteDate)}</span></span>
            )}
          </div>
        )}

        {/* Chart */}
        {data.length > 0 ? (
          <AreaChart
            data={data}
            xKey="date"
            areas={[{ key: 'drawdown', name: 'Drawdown %', color: 'hsl(var(--chart-4))' }]}
            height={260}
            formatY={(v) => `${v.toFixed(0)}%`}
            formatX={(v) => { const d = new Date(v); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
          />
        ) : (
          <div className="grid place-items-center h-[260px] text-sm text-muted-foreground">No drawdown data yet</div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={`text-sm font-bold tabular-nums mt-0.5 ${positive ? 'text-success' : negative ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  );
}
