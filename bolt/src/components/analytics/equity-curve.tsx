'use client';
import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { Metrics } from '@/lib/analytics';
import { AreaChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCompact } from '@/lib/format';

type Mode = 'equity' | 'balance' | 'pnl';

export function EquityCurve({ metrics }: { metrics: Metrics }) {
  const [mode, setMode] = useState<Mode>('equity');
  const [range, setRange] = useState<'all' | '30d' | '90d' | 'ytd'>('all');

  const data = useMemo(() => {
    let points = metrics.equity;
    if (range === '30d' || range === '90d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (range === '30d' ? 30 : 90));
      points = points.filter((p) => new Date(p.date) >= cutoff);
    } else if (range === 'ytd') {
      const cutoff = new Date(new Date().getFullYear(), 0, 1);
      points = points.filter((p) => new Date(p.date) >= cutoff);
    }
    return points.map((p) => ({
      date: p.date,
      equity: p.cumulative,
      balance: p.balance,
      pnl: p.pnl,
    }));
  }, [metrics.equity, range]);

  const areas = mode === 'equity'
    ? [{ key: 'equity', name: 'Equity', color: 'hsl(var(--chart-1))' }]
    : mode === 'balance'
    ? [{ key: 'balance', name: 'Balance', color: 'hsl(var(--chart-2))' }]
    : [{ key: 'pnl', name: 'Daily P&L', color: 'hsl(var(--chart-3))' }];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Equity Curve</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['equity', 'balance', 'pnl'] as Mode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
              )}>{m === 'pnl' ? 'P&L' : m}</button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['30d', '90d', 'ytd', 'all'] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors uppercase',
                range === r ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
              )}>{r}</button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <AreaChart data={data} xKey="date" areas={areas} height={300} formatY={(v) => formatCompact(v)} formatX={(v) => {
            const d = new Date(v);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }} />
        ) : (
          <div className="grid place-items-center h-[300px] text-sm text-muted-foreground">No equity data yet</div>
        )}
        <div className="mt-2 text-[10px] text-muted-foreground/70 text-center">
          Future: Drawdown overlay coming soon
        </div>
      </CardContent>
    </Card>
  );
}
