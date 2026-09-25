'use client';
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { filterByRecentRange, computeMetrics, type RecentRange } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

const RANGES: { key: RecentRange; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'current_month', label: 'This Month' },
  { key: 'previous_month', label: 'Last Month' },
  { key: 'ytd', label: 'YTD' },
  { key: 'lifetime', label: 'Lifetime' },
];

export function RecentPerformance({ trades }: { trades: Trade[] }) {
  const [active, setActive] = useState<RecentRange>('30d');

  const filtered = filterByRecentRange(trades, active);
  const metrics = computeMetrics(filtered);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Recent Performance</CardTitle>
        </div>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setActive(r.key)} className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              active === r.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            )}>{r.label}</button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MiniStat label="Trades" value={String(metrics.totalTrades)} />
          <MiniStat label="Net P&L" value={formatCurrency(metrics.totalPnl)} positive={metrics.totalPnl >= 0} />
          <MiniStat label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} positive={metrics.winRate >= 50} />
          <MiniStat label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)} positive={metrics.profitFactor >= 1} />
          <MiniStat label="Avg Win" value={formatCurrency(metrics.avgWin)} positive />
          <MiniStat label="Avg Loss" value={formatCurrency(-metrics.avgLoss)} positive={false} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={cn('text-sm font-bold tabular-nums mt-0.5', positive === true && 'text-success', positive === false && 'text-destructive')}>{value}</div>
    </div>
  );
}
