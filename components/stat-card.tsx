'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  icon: Icon,
  accent = 'primary',
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'chart';
  sub?: string;
}) {
  const accentMap: Record<string, string> = {
    primary: 'from-primary/20 to-transparent text-primary',
    success: 'from-success/20 to-transparent text-success',
    warning: 'from-warning/20 to-transparent text-warning',
    destructive: 'from-destructive/20 to-transparent text-destructive',
    chart: 'from-chart-4/20 to-transparent text-chart-4',
  };
  return (
    <div className="group relative overflow-hidden glass rounded-xl p-4 hover:border-primary/40 transition-all">
      <div className={cn('absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br blur-2xl opacity-60', accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
        {Icon && (
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-secondary/60 border border-border">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {delta && (
        <div className="relative mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium',
              deltaPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
            )}
          >
            {deltaPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta}
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
