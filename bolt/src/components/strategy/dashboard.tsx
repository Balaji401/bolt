'use client';
import { useMemo } from 'react';
import { Activity, Award, BarChart3, BookOpen, CheckCircle2, Layers, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import type { Strategy, Trade } from '@/lib/supabase';
import { calculateStrategyPerformance, calculateStrategyStats } from '@/lib/strategy';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StrategyDashboard({ strategies, setupCount, playbookCount, trades }: { strategies: Strategy[]; setupCount: number; playbookCount: number; trades: Trade[] }) {
  const stats = useMemo(() => calculateStrategyStats(strategies, trades), [strategies, trades]);
  const cards = [
    { label: 'Total Strategies', value: stats.total, icon: Layers, color: 'text-primary' },
    { label: 'Active Strategies', value: stats.active, icon: CheckCircle2, color: 'text-success' },
    { label: 'Inactive Strategies', value: stats.inactive, icon: XCircle, color: 'text-muted-foreground' },
    { label: 'Winning Strategies', value: stats.winning, icon: Award, color: 'text-warning' },
    { label: 'Strategy Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: BarChart3, color: 'text-chart-2' },
    { label: 'Best Performing', value: stats.best, icon: TrendingUp, color: 'text-success' },
    { label: 'Worst Performing', value: stats.worst, icon: TrendingDown, color: 'text-destructive' },
    { label: 'Total Setups', value: setupCount, icon: Activity, color: 'text-chart-3' },
    { label: 'Total Playbooks', value: playbookCount, icon: BookOpen, color: 'text-chart-4' },
    { label: 'Success Rate', value: `${stats.winRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-primary' },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <Card key={card.label} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <card.icon className={cn('w-4 h-4 mb-3', card.color)} />
              <div className="text-lg font-semibold truncate">{card.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {strategies.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Strategy Performance Snapshot</h3>
            <div className="space-y-2">
              {strategies.slice(0, 8).map((strategy) => {
                const performance = calculateStrategyPerformance(strategy, trades);
                return <div key={strategy.id} className="flex items-center gap-3 text-xs"><span className="w-32 truncate font-medium">{strategy.name}</span><div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden"><div className={cn('h-full rounded-full', performance.netProfit >= 0 ? 'bg-success' : 'bg-destructive')} style={{ width: `${Math.min(Math.max(performance.winRate, 4), 100)}%` }} /></div><span className={cn('w-20 text-right', performance.netProfit >= 0 ? 'text-success' : 'text-destructive')}>{performance.netProfit >= 0 ? '+' : ''}{performance.netProfit.toFixed(2)}</span></div>;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
