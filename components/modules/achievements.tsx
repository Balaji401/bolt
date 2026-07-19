'use client';

import { useEffect, useState } from 'react';
import {
  Trophy, Star, Zap, Target, Shield, Flame, Crown, TrendingUp,
  BookOpen, BarChart3, HeartPulse, Calendar, Award, CheckCircle2,
  Lock, Sparkles,
} from 'lucide-react';
import { supabase, type Trade, type Achievement } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

// All possible achievements with unlock criteria
const ACHIEVEMENT_DEFINITIONS = [
  // Volume
  { slug: 'trades_10',   title: 'First Steps',      description: 'Log your first 10 trades',     icon: 'BookOpen',   category: 'Volume',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 10 },
  { slug: 'trades_50',   title: 'Active Trader',    description: 'Log 50 trades',                icon: 'TrendingUp', category: 'Volume',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 50 },
  { slug: 'trades_100',  title: 'Century Club',     description: 'Log 100 trades',               icon: 'Trophy',     category: 'Volume',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 100 },
  { slug: 'trades_500',  title: 'Veteran Trader',   description: 'Log 500 trades',               icon: 'Crown',      category: 'Volume',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 500 },
  { slug: 'trades_1000', title: 'Elite Journaler',  description: 'Log 1,000 trades',             icon: 'Star',       category: 'Volume',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 1000 },

  // Profitability
  { slug: 'first_win',   title: 'First Blood',      description: 'Win your first trade',          icon: 'Zap',        category: 'Profit',      requirement: (t: Trade[]) => t.some((tr) => tr.pnl > 0) },
  { slug: 'profit_100r', title: '100R Club',        description: 'Achieve 100R total profit',     icon: 'Trophy',     category: 'Profit',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalRR >= 100 },
  { slug: 'profit_500r', title: '500R Legend',      description: 'Achieve 500R total profit',     icon: 'Crown',      category: 'Profit',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalRR >= 500 },
  { slug: 'profit_pf2',  title: 'Profit Machine',   description: 'Achieve profit factor above 2', icon: 'BarChart3',  category: 'Profit',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.profitFactor >= 2 },
  { slug: 'profit_pf3',  title: 'Edge Master',      description: 'Achieve profit factor above 3', icon: 'Star',       category: 'Profit',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.profitFactor >= 3 },

  // Win Rate
  { slug: 'wr_50',       title: 'Profitable Trader','description': 'Reach 50% win rate (min 20 trades)', icon: 'Target',     category: 'Accuracy',    requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 20 && m.winRate >= 50 },
  { slug: 'wr_60',       title: 'Sharp Shooter',    description: 'Reach 60% win rate (min 30 trades)', icon: 'Zap',        category: 'Accuracy',    requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 30 && m.winRate >= 60 },
  { slug: 'wr_70',       title: 'Sniper',           description: 'Reach 70% win rate (min 50 trades)', icon: 'Award',      category: 'Accuracy',    requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 50 && m.winRate >= 70 },

  // Streaks
  { slug: 'streak_5',    title: 'Hot Streak',       description: '5 consecutive winning trades',  icon: 'Flame',      category: 'Streaks',     requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.longestWinStreak >= 5 },
  { slug: 'streak_10',   title: 'On Fire',          description: '10 consecutive winning trades', icon: 'Flame',      category: 'Streaks',     requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.longestWinStreak >= 10 },
  { slug: 'streak_20',   title: 'Unstoppable',      description: '20 consecutive winning trades', icon: 'Star',       category: 'Streaks',     requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.longestWinStreak >= 20 },

  // Risk Management
  { slug: 'rr_avg_2',    title: 'Risk Manager',     description: 'Maintain avg R:R above 2.0',   icon: 'Shield',     category: 'Risk',        requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 20 && m.avgRR >= 2 },
  { slug: 'rr_avg_3',    title: 'Risk Expert',      description: 'Maintain avg R:R above 3.0',   icon: 'Shield',     category: 'Risk',        requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 20 && m.avgRR >= 3 },
  { slug: 'low_dd',      title: 'Iron Discipline',  description: 'Keep max drawdown below 5%',   icon: 'CheckCircle2', category: 'Risk',      requirement: (t: Trade[], m: ReturnType<typeof computeMetrics>) => m.totalTrades >= 20 && m.maxDrawdown < 5 },

  // Discipline
  { slug: 'journal_30',  title: '30 Day Logger',    description: 'Log trades for 30 different days', icon: 'Calendar', category: 'Discipline',  requirement: (t: Trade[]) => new Set(t.map((tr) => tr.executed_at.split('T')[0])).size >= 30 },
  { slug: 'notes_10',    title: 'Analyst',          description: 'Add notes to 10 trades',       icon: 'BookOpen',   category: 'Discipline',  requirement: (t: Trade[]) => t.filter((tr) => tr.notes && tr.notes.length > 10).length >= 10 },
  { slug: 'tags_all',    title: 'Strategist',       description: 'Use 5 different strategy tags', icon: 'Sparkles',  category: 'Discipline',  requirement: (t: Trade[]) => new Set(t.flatMap((tr) => tr.strategy_tags)).size >= 5 },
  { slug: 'psychology',  title: 'Mind Game',        description: 'Complete 10 psychology check-ins', icon: 'HeartPulse', category: 'Discipline', requirement: () => false }, // Checked separately
] as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, Star, Zap, Target, Shield, Flame, Crown, TrendingUp,
  BookOpen, BarChart3, HeartPulse, Calendar, Award, CheckCircle2,
  Lock, Sparkles,
};

const CATEGORY_COLORS: Record<string, string> = {
  Volume: 'text-primary',
  Profit: 'text-success',
  Accuracy: 'text-warning',
  Streaks: 'text-chart-5',
  Risk: 'text-chart-4',
  Discipline: 'text-chart-3',
};

export function Achievements({ trades }: { trades: Trade[] }) {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const metrics = computeMetrics(trades);

  // Check which achievements are unlocked
  const unlockedSlugs = new Set(
    ACHIEVEMENT_DEFINITIONS
      .filter((def) => {
        try { return def.requirement(trades, metrics); } catch { return false; }
      })
      .map((d) => d.slug)
  );

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .order('earned_at', { ascending: false });
      setEarned((data || []) as Achievement[]);
      setLoading(false);

      // Award any newly unlocked achievements
      const existing = new Set((data || []).map((a) => a.slug));
      const toAward = ACHIEVEMENT_DEFINITIONS.filter(
        (def) => unlockedSlugs.has(def.slug) && !existing.has(def.slug)
      );
      if (toAward.length > 0) {
        await supabase.from('achievements').insert(
          toAward.map((a) => ({
            slug: a.slug,
            title: a.title,
            description: a.description,
            icon: a.icon,
            category: a.category,
          }))
        );
        // Reload
        const { data: refreshed } = await supabase
          .from('achievements')
          .select('*')
          .order('earned_at', { ascending: false });
        setEarned((refreshed || []) as Achievement[]);
      }
    };
    load();
  }, [trades.length]);

  const earnedSlugs = new Set(earned.map((a) => a.slug));
  const categories = ['All', ...Array.from(new Set(ACHIEVEMENT_DEFINITIONS.map((d) => d.category)))];
  const filtered = ACHIEVEMENT_DEFINITIONS.filter((d) =>
    activeCategory === 'All' || d.category === activeCategory
  );

  const earnedCount = ACHIEVEMENT_DEFINITIONS.filter((d) => earnedSlugs.has(d.slug)).length;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;
  const pct = Math.round((earnedCount / totalCount) * 100);

  if (loading) {
    return (
      <div className="grid place-items-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading achievements…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-semibold gradient-text">{earnedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Achievements earned</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-semibold gradient-text">{totalCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Total available</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-semibold gradient-text">{pct}%</div>
          <div className="text-xs text-muted-foreground mt-1">Completion rate</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-semibold gradient-text">{totalCount - earnedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Still to unlock</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold">Overall Progress</span>
          </div>
          <span className="text-sm font-semibold gradient-text">{pct}%</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {earnedCount} of {totalCount} achievements unlocked
        </p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              activeCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((def) => {
          const isEarned = earnedSlugs.has(def.slug);
          const isUnlocked = unlockedSlugs.has(def.slug);
          const Icon = ICON_MAP[def.icon] || Trophy;
          const colorClass = CATEGORY_COLORS[def.category] || 'text-primary';
          const earnedAch = earned.find((a) => a.slug === def.slug);

          return (
            <div
              key={def.slug}
              className={cn(
                'glass rounded-xl p-5 transition-all duration-300 relative overflow-hidden group',
                isEarned ? 'border-primary/40 shadow-lg shadow-primary/5' : 'opacity-60 hover:opacity-80'
              )}
            >
              {isEarned && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              )}
              {!isEarned && !isUnlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
              {!isEarned && isUnlocked && (
                <div className="absolute top-2 right-2">
                  <Zap className="w-3.5 h-3.5 text-warning animate-pulse-soft" />
                </div>
              )}

              <div className={cn(
                'grid place-items-center w-12 h-12 rounded-xl mb-3 transition-transform group-hover:scale-110',
                isEarned ? 'bg-primary/15' : 'bg-secondary'
              )}>
                <Icon className={cn('w-6 h-6', isEarned ? colorClass : 'text-muted-foreground')} />
              </div>

              <div className="text-sm font-semibold mb-1">{def.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed mb-3">{def.description}</div>

              <div className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                isEarned ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'
              )}>
                {isEarned ? (
                  <><CheckCircle2 className="w-2.5 h-2.5" /> Earned</>
                ) : isUnlocked ? (
                  <><Zap className="w-2.5 h-2.5 text-warning" /> <span className="text-warning">Ready to claim</span></>
                ) : (
                  <><Lock className="w-2.5 h-2.5" /> Locked</>
                )}
              </div>

              {isEarned && earnedAch && (
                <div className="text-[10px] text-muted-foreground mt-1.5">
                  {new Date(earnedAch.earned_at).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
