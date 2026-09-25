'use client';
import { TrendingDown, RotateCcw } from 'lucide-react';
import type { RiskMetrics } from '@/lib/risk';
import { AreaChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent, formatDate } from '@/lib/format';

export function DrawdownAnalysis({ metrics }: { metrics: RiskMetrics }) {
  const data = metrics.drawdownSeries.map((d) => ({ date: d.date, drawdown: d.drawdown, equity: d.equity }));
  const drawdownValue = metrics.maxDrawdown < 0 ? Math.abs(metrics.maxDrawdown) : 0;
  const equityDelta = metrics.peakEquity - metrics.accountEquity;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Drawdown Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Current Drawdown" value={formatPercent(metrics.currentDrawdown, 1)} negative={metrics.currentDrawdown < 0} />
          <StatBox label="Max Drawdown" value={formatPercent(metrics.maxDrawdown, 1)} negative={metrics.maxDrawdown < 0} />
          <StatBox label="Peak Equity" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.peakEquity)} />
          <StatBox label="Current Equity" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.accountEquity)} />
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Peak Equity</span>
            <span className="font-medium text-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.peakEquity)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Current Equity</span>
            <span className="font-medium text-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.accountEquity)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Drawdown</span>
            <span className={drawdownValue > 0 ? 'font-medium text-destructive' : 'font-medium text-success'}>
              {drawdownValue > 0 ? `-${drawdownValue.toFixed(2)}%` : '0.00%'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Equity gap</span>
            <span className="font-medium text-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(equityDelta))}</span>
          </div>
        </div>

        {metrics.maxDrawdownDate && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Max DD: <span className="font-medium text-foreground">{formatDate(metrics.maxDrawdownDate)}</span></span>
            {metrics.recoveryCompleteDate && (
              <span>Recovered: <span className="font-medium text-success">{formatDate(metrics.recoveryCompleteDate)}</span></span>
            )}
          </div>
        )}

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
