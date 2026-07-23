'use client';
import { useMemo } from 'react';
import { Trophy, Award, Star, Flame, Target, TrendingUp } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Achievement = { slug: string; title: string; description: string; icon: React.ComponentType<{ className?: string }>; earned: boolean; category: string };

export function Achievements({ trades }: { trades: Trade[] }) {
  const metrics = useMemo(() => computeMetrics(trades), [trades]);

  const all: Achievement[] = [
    { slug: 'first-trade', title: 'First Steps', description: 'Complete your first trade', icon: Star, earned: metrics.totalTrades >= 1, category: 'milestones' },
    { slug: 'ten-trades', title: 'Getting Started', description: 'Complete 10 trades', icon: Trophy, earned: metrics.totalTrades >= 10, category: 'milestones' },
    { slug: 'fifty-trades', title: 'Dedicated', description: 'Complete 50 trades', icon: Trophy, earned: metrics.totalTrades >= 50, category: 'milestones' },
    { slug: 'hundred-trades', title: 'Centurion', description: 'Complete 100 trades', icon: Trophy, earned: metrics.totalTrades >= 100, category: 'milestones' },
    { slug: 'first-profit', title: 'In the Green', description: 'Make your first profitable trade', icon: TrendingUp, earned: metrics.bestTrade > 0, category: 'milestones' },
    { slug: 'win-streak-3', title: 'Hat Trick', description: 'Win 3 trades in a row', icon: Flame, earned: metrics.maxWinStreak >= 3, category: 'streaks' },
    { slug: 'win-streak-5', title: 'On Fire', description: 'Win 5 trades in a row', icon: Flame, earned: metrics.maxWinStreak >= 5, category: 'streaks' },
    { slug: 'win-streak-10', title: 'Unstoppable', description: 'Win 10 trades in a row', icon: Flame, earned: metrics.maxWinStreak >= 10, category: 'streaks' },
    { slug: 'profitable', title: 'Profitable Trader', description: 'Achieve positive total P&L', icon: Award, earned: metrics.totalPnl > 0, category: 'performance' },
    { slug: 'high-winrate', title: 'Sharp Shooter', description: 'Achieve 60%+ win rate', icon: Target, earned: metrics.winRate >= 60 && metrics.totalTrades >= 10, category: 'performance' },
    { slug: 'good-pf', title: 'Edge Found', description: 'Achieve profit factor above 2.0', icon: TrendingUp, earned: metrics.profitFactor >= 2 && metrics.totalTrades >= 10, category: 'performance' },
    { slug: 'discipline', title: 'Disciplined', description: 'Average confidence above 75%', icon: Award, earned: metrics.avgConfidence >= 75 && metrics.totalTrades >= 5, category: 'performance' },
  ];

  const earned = all.filter((a) => a.earned);
  const locked = all.filter((a) => !a.earned);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /><div><h2 className="text-lg font-semibold">Achievements</h2><p className="text-sm text-muted-foreground">{earned.length} of {all.length} unlocked</p></div></div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {all.map((a) => {
          const Icon = a.icon;
          return (
            <Card key={a.slug} className={cn('transition-all', a.earned ? 'border-warning/30 hover:border-warning/50' : 'opacity-50')}>
              <CardContent className="p-4 text-center">
                <div className={cn('grid place-items-center w-14 h-14 rounded-2xl mx-auto mb-3', a.earned ? 'bg-gradient-to-br from-warning/20 to-primary/20' : 'bg-secondary/60')}>
                  <Icon className={cn('w-7 h-7', a.earned ? 'text-warning' : 'text-muted-foreground')} />
                </div>
                <div className="text-sm font-semibold">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
                {a.earned && <div className="text-[10px] text-success font-medium mt-2">Unlocked</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
