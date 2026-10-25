'use client';
import { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Metrics } from '@/lib/analytics';
import { DashboardWidget } from '@/components/dashboard/widget';
import { AreaChart } from '@/components/charts';
import { formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

export function EquityCurveWidget({ metrics, onNavigate }: { metrics: Metrics; onNavigate?: (key: string) => void }) {
  const data = useMemo(() =>
    metrics.equity.map((p) => ({ date: p.date, equity: p.cumulative })),
  [metrics.equity]);

  const isPositive = metrics.totalPnl >= 0;
  const lastEquity = data.length > 0 ? data[data.length - 1].equity : 0;
  const firstEquity = data.length > 0 ? data[0].equity : 0;
  const change = lastEquity - firstEquity;

  return (
    <DashboardWidget
      title="Equity Curve"
      description={data.length > 0 ? `${data.length} trading days` : 'No data yet'}
      icon={TrendingUp}
      action={
        <button
          onClick={() => onNavigate?.('analytics')}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-1 rounded"
          title="View full analytics"
        >
          Details
        </button>
      }
    >
      {data.length > 1 ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums">{formatCompact(lastEquity)}</span>
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', isPositive ? 'text-success' : 'text-destructive')}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {formatCompact(Math.abs(change))}
            </span>
          </div>
          <AreaChart
            data={data}
            xKey="date"
            areas={[{ key: 'equity', name: 'Equity', color: isPositive ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))' }]}
            height={120}
            formatY={(v) => formatCompact(v)}
            formatX={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
        </div>
      ) : data.length === 1 ? (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums">{formatCompact(lastEquity)}</span>
          </div>
          <div className="grid place-items-center h-[120px] text-xs text-muted-foreground">
            More data needed to draw curve
          </div>
        </div>
      ) : (
        <div className="grid place-items-center h-[120px] text-xs text-muted-foreground">
          No closed trades yet
        </div>
      )}
    </DashboardWidget>
  );
}
