'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { HeartPulse, LayoutDashboard, BookOpen, ClipboardCheck, Heart, Shield, Target, Repeat, CalendarRange, CalendarDays, AlertTriangle, GitBranch, Sparkles } from 'lucide-react';
import type { Trade, PsychologyLog } from '@/lib/supabase';
import { supabase, getSupabaseSchemaMessage, isMissingSupabaseTableError } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { computePsychologyMetrics } from '@/lib/psychology';
import { computeMetrics } from '@/lib/analytics';
import { LoadingState } from '@/components/feedback/state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PsychologyDashboard } from '@/components/psychology/psych-dashboard';
import { DailyJournal } from '@/components/psychology/daily-journal';
import { TradeReviewEditor } from '@/components/psychology/trade-review';
import { EmotionTracker } from '@/components/psychology/emotion-tracker';
import { DisciplineTracker } from '@/components/psychology/discipline-tracker';
import { GoalManager } from '@/components/psychology/goal-manager';
import { HabitTracker } from '@/components/psychology/habit-tracker';
import { WeeklyReviewEditor } from '@/components/psychology/weekly-review';
import { MonthlyReviewEditor } from '@/components/psychology/monthly-review';
import { MistakeLibrary } from '@/components/psychology/mistake-library';
import { JournalTimeline } from '@/components/psychology/journal-timeline';
import { PsychologyAIPlaceholders } from '@/components/psychology/ai-placeholders';

type Tab = 'dashboard' | 'journal' | 'trade-review' | 'emotions' | 'discipline' | 'goals' | 'habits' | 'weekly' | 'monthly' | 'mistakes' | 'timeline' | 'ai';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'journal', label: 'Daily Journal', icon: BookOpen },
  { id: 'trade-review', label: 'Trade Review', icon: ClipboardCheck },
  { id: 'emotions', label: 'Emotions', icon: Heart },
  { id: 'discipline', label: 'Discipline', icon: Shield },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'habits', label: 'Habits', icon: Repeat },
  { id: 'weekly', label: 'Weekly Review', icon: CalendarRange },
  { id: 'monthly', label: 'Monthly Review', icon: CalendarDays },
  { id: 'mistakes', label: 'Mistake Library', icon: AlertTriangle },
  { id: 'timeline', label: 'Timeline', icon: GitBranch },
  { id: 'ai', label: 'AI Features', icon: Sparkles },
];

export function Psychology({ trades }: { trades: Trade[] }) {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [psychLogs, setPsychLogs] = useState<PsychologyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    const { data, error } = await supabase.from('psychology_logs').select('*').order('log_date', { ascending: false }).limit(30);
    if (error) {
      setErrorMessage(isMissingSupabaseTableError(error) ? getSupabaseSchemaMessage(error) : 'Failed to load psychology data.');
      setLoading(false);
      return;
    }
    setPsychLogs((data || []) as PsychologyLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const m = computeMetrics(trades);
    return computePsychologyMetrics(trades, psychLogs, m);
  }, [trades, psychLogs]);

  if (loading) return <LoadingState label="Loading psychology data..." />;
  if (errorMessage) return (
    <div className="grid place-items-center h-64 text-center">
      <div className="space-y-3 max-w-md">
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <Button onClick={load} variant="outline" size="sm">Retry</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HeartPulse className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Trading Psychology</h2>
          <p className="text-sm text-muted-foreground">Understand your emotions, discipline, habits, and decision-making</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all border-b-2 -mb-px',
              tab === t.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'dashboard' && <PsychologyDashboard metrics={metrics} />}
        {tab === 'journal' && <DailyJournal />}
        {tab === 'trade-review' && <TradeReviewTab trades={trades} selectedTradeId={selectedTradeId} setSelectedTradeId={setSelectedTradeId} />}
        {tab === 'emotions' && <EmotionTracker emotionFrequency={metrics.emotionFrequency} />}
        {tab === 'discipline' && <DisciplineTracker metrics={metrics} />}
        {tab === 'goals' && <GoalManager />}
        {tab === 'habits' && <HabitTracker />}
        {tab === 'weekly' && <WeeklyReviewEditor trades={trades} />}
        {tab === 'monthly' && <MonthlyReviewEditor trades={trades} />}
        {tab === 'mistakes' && <MistakeLibrary />}
        {tab === 'timeline' && <JournalTimeline trades={trades} />}
        {tab === 'ai' && <PsychologyAIPlaceholders />}
      </div>
    </div>
  );
}

function TradeReviewTab({ trades, selectedTradeId, setSelectedTradeId }: { trades: Trade[]; selectedTradeId: string | null; setSelectedTradeId: (id: string | null) => void }) {
  const closedTrades = trades.filter((t) => t.status === 'closed' && !t.archived).slice(0, 20);

  if (closedTrades.length === 0) {
    return (
      <div className="grid place-items-center h-48 text-center">
        <div className="space-y-2">
          <ClipboardCheck className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No closed trades to review yet.</p>
        </div>
      </div>
    );
  }

  const selectedTrade = closedTrades.find((t) => t.id === selectedTradeId) || closedTrades[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {closedTrades.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTradeId(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              selectedTrade.id === t.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30 text-muted-foreground'
            )}
          >
            <span>{t.instrument}</span>
            <span className={cn('font-semibold', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
              {Number(t.pnl) >= 0 ? '+' : ''}{Number(t.pnl).toFixed(0)}
            </span>
          </button>
        ))}
      </div>
      <TradeReviewEditor trade={selectedTrade} />
    </div>
  );
}
