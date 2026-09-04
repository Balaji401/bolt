'use client';
import { useMemo } from 'react';
import { BarChart3, DollarSign, Gauge, Target, TrendingDown, TrendingUp } from 'lucide-react';
import type { Strategy, Trade } from '@/lib/supabase';
import { calculateStrategyPerformance } from '@/lib/strategy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StrategyPerformance({ strategy, trades }: { strategy: Strategy | null; trades: Trade[] }) {
  const performance = useMemo(() => strategy ? calculateStrategyPerformance(strategy, trades) : null, [strategy, trades]);
  if (!strategy || !performance) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Select a strategy to see its performance.</CardContent></Card>;
  const cards = [{ label: 'Total Trades', value: performance.totalTrades, icon: BarChart3 }, { label: 'Win Rate', value: `${performance.winRate.toFixed(1)}%`, icon: Target }, { label: 'Loss Rate', value: `${performance.lossRate.toFixed(1)}%`, icon: TrendingDown }, { label: 'Average RR', value: performance.averageRr.toFixed(2), icon: Gauge }, { label: 'Net Profit', value: performance.netProfit.toFixed(2), icon: DollarSign }, { label: 'Best Instrument', value: performance.bestInstrument, icon: TrendingUp }];
  return <div className="space-y-4"><Card><CardHeader><CardTitle className="text-sm">{strategy.name} Performance</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{cards.map((card) => <div key={card.label} className="rounded-lg border border-border p-3"><card.icon className="w-4 h-4 text-primary mb-2" /><div className={cn('text-sm font-semibold truncate', card.label === 'Net Profit' && (performance.netProfit >= 0 ? 'text-success' : 'text-destructive'))}>{card.value}</div><div className="text-[10px] text-muted-foreground mt-1">{card.label}</div></div>)}</div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center justify-between text-xs"><span>Total Profit</span><span className="text-success">+{performance.totalProfit.toFixed(2)}</span></div><div className="flex items-center justify-between text-xs mt-2"><span>Total Loss</span><span className="text-destructive">{performance.totalLoss.toFixed(2)}</span></div><div className="flex items-center justify-between text-xs mt-2"><span>Worst Instrument</span><span>{performance.worstInstrument}</span></div></CardContent></Card></div>;
}
