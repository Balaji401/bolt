'use client';
import { useState, useEffect, useCallback } from 'react';
import { GitBranch, BookOpen, CalendarRange, CalendarDays, ClipboardCheck, Target, Repeat, AlertTriangle, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

type TimelineEntry = {
  id: string;
  date: string;
  type: 'daily_journal' | 'weekly_review' | 'monthly_review' | 'trade_review' | 'goal' | 'habit_log' | 'mistake';
  title: string;
  subtitle?: string;
};

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  daily_journal: { icon: BookOpen, color: 'text-primary bg-primary/10', label: 'Daily Journal' },
  weekly_review: { icon: CalendarRange, color: 'text-chart-2 bg-chart-2/10', label: 'Weekly Review' },
  monthly_review: { icon: CalendarDays, color: 'text-chart-3 bg-chart-3/10', label: 'Monthly Review' },
  trade_review: { icon: ClipboardCheck, color: 'text-success bg-success/10', label: 'Trade Review' },
  goal: { icon: Target, color: 'text-warning bg-warning/10', label: 'Goal' },
  habit_log: { icon: Repeat, color: 'text-chart-4 bg-chart-4/10', label: 'Habit' },
  mistake: { icon: AlertTriangle, color: 'text-destructive bg-destructive/10', label: 'Mistake' },
};

export function JournalTimeline({ trades }: { trades: any[] }) {
  const { workspace } = useWorkspace();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!workspace) return;
    const [dj, wr, mr, tr, goals, mistakes] = await Promise.all([
      supabase.from('daily_journals').select('*').eq('workspace_id', workspace.id).order('journal_date', { ascending: false }).limit(50),
      supabase.from('weekly_reviews').select('*').eq('workspace_id', workspace.id).order('week_start', { ascending: false }).limit(20),
      supabase.from('monthly_reviews').select('*').eq('workspace_id', workspace.id).order('month_year', { ascending: false }).limit(12),
      supabase.from('trade_reviews').select('*,trade_id').order('created_at', { ascending: false }).limit(50),
      supabase.from('trading_goals').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('mistakes').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(20),
    ]);

    const all: TimelineEntry[] = [
      ...((dj.data || []) as any[]).map((j: any) => ({ id: j.id, date: j.journal_date, type: 'daily_journal' as const, title: j.emotional_state_pre || j.overall_mood || 'Journal Entry', subtitle: j.goals_today || undefined })),
      ...((wr.data || []) as any[]).map((r: any) => ({ id: r.id, date: r.week_start, type: 'weekly_review' as const, title: `Week of ${formatDate(r.week_start)}`, subtitle: `${r.trades_taken} trades · ${Number(r.win_rate).toFixed(0)}% win` })),
      ...((mr.data || []) as any[]).map((r: any) => ({ id: r.id, date: r.created_at, type: 'monthly_review' as const, title: r.month_year, subtitle: r.performance_summary || undefined })),
      ...((tr.data || []) as any[]).map((r: any) => {
        const trade = trades.find((t) => t.id === r.trade_id);
        return { id: r.id, date: r.created_at, type: 'trade_review' as const, title: `Review: ${trade?.instrument || 'Trade'}`, subtitle: r.rating ? `Rating: ${r.rating}/10` : undefined };
      }),
      ...((goals.data || []) as any[]).map((g: any) => ({ id: g.id, date: g.created_at, type: 'goal' as const, title: g.title, subtitle: g.completed ? 'Completed' : 'In progress' })),
      ...((mistakes.data || []) as any[]).map((m: any) => ({ id: m.id, date: m.created_at, type: 'mistake' as const, title: m.name, subtitle: m.category })),
    ];

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(all);
    setLoading(false);
  }, [workspace, trades]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter);

  if (loading) return <div className="grid place-items-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Journal Timeline</h3>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="daily_journal">Daily Journals</SelectItem>
            <SelectItem value="weekly_review">Weekly Reviews</SelectItem>
            <SelectItem value="monthly_review">Monthly Reviews</SelectItem>
            <SelectItem value="trade_review">Trade Reviews</SelectItem>
            <SelectItem value="goal">Goals</SelectItem>
            <SelectItem value="mistake">Mistakes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GitBranch} title="No timeline entries" description="Your journal entries, reviews, goals, and habits will appear here in chronological order." />
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {filtered.slice(0, 50).map((entry) => {
              const meta = TYPE_META[entry.type];
              return (
                <div key={`${entry.type}-${entry.id}`} className="relative flex items-start gap-3 pl-0">
                  <div className={cn('grid place-items-center w-8 h-8 rounded-full shrink-0 z-10 border-2 border-background', meta.color)}>
                    <meta.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{entry.title}</span>
                      <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                    </div>
                    {entry.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.subtitle}</p>}
                    <span className="text-[10px] text-muted-foreground/70">{formatDate(entry.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
