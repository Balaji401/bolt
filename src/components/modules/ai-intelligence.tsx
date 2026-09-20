'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Brain, Sparkles, MessageSquare, Gauge, HeartPulse, Target, Lightbulb, TrendingUp, FileSearch, Activity, User, GitBranch, Clock, Sun, AlertTriangle } from 'lucide-react';
import type { Trade, Strategy, PsychologyLog, TradingGoal, Habit, Mistake, RiskRules, AiMemory, AiRecommendation } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { buildContext, type AiContext } from '@/lib/ai-context';
import { computeMetrics } from '@/lib/analytics';
import {
  detectBehaviorPatterns,
  analyzeCorrelations,
  buildTraderProfile,
  calculateCompositeScore,
  generateBehaviorTimeline,
  generateComparisons,
  generateDailyIntelligence,
  generateWeeklyIntelligence,
} from '@/lib/ai-intelligence';
import { AiDashboard } from '@/components/ai/dashboard';
import { AiCoach } from '@/components/ai/coach';
import { AiChat } from '@/components/ai/chat';
import { AiInsightsEnhanced } from '@/components/ai/insights-enhanced';
import { AiMemoryPanel } from '@/components/ai/memory';
import { AiTradeReview } from '@/components/ai/trade-review';
import { AiPsychologyReview } from '@/components/ai/psychology-review';
import { AiRecommendations } from '@/components/ai/recommendations';
import { BehaviorPatterns } from '@/components/ai/behavior-patterns';
import { Correlations } from '@/components/ai/correlations';
import { TraderProfile } from '@/components/ai/trader-profile';
import { TradingScore } from '@/components/ai/trading-score';
import { Comparisons } from '@/components/ai/comparisons';
import { BehaviorTimeline } from '@/components/ai/behavior-timeline';
import { DailyIntelligenceCard, WeeklyIntelligenceCard } from '@/components/ai/intelligence-reports';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

type AiTab =
  | 'dashboard' | 'coach' | 'chat' | 'insights' | 'memory'
  | 'trade-review' | 'psychology-review' | 'recommendations'
  | 'patterns' | 'correlations' | 'profile' | 'score' | 'comparisons'
  | 'timeline' | 'daily' | 'weekly';

const TABS: { id: AiTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Brain },
  { id: 'patterns', label: 'Patterns', icon: Activity },
  { id: 'correlations', label: 'Correlations', icon: GitBranch },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'score', label: 'Score', icon: Gauge },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'comparisons', label: 'Comparisons', icon: GitBranch },
  { id: 'daily', label: 'Daily', icon: Sun },
  { id: 'weekly', label: 'Weekly', icon: TrendingUp },
  { id: 'coach', label: 'AI Coach', icon: Sparkles },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'trade-review', label: 'Trade Review', icon: FileSearch },
  { id: 'psychology-review', label: 'Psychology', icon: HeartPulse },
  { id: 'memory', label: 'Memory', icon: Target },
];

export function AiIntelligence({ trades }: { trades: Trade[] }) {
  const { workspace, activeAccount } = useWorkspace();
  const [tab, setTab] = useState<AiTab>('dashboard');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [psychologyLogs, setPsychologyLogs] = useState<PsychologyLog[]>([]);
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [riskRules, setRiskRules] = useState<RiskRules | null>(null);
  const [memory, setMemory] = useState<AiMemory[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true); setError(false);
    try {
      const [stratRes, psychRes, goalRes, habitRes, mistakeRes, riskRes, memRes, recRes] = await Promise.all([
        supabase.from('strategies').select('*').eq('workspace_id', workspace.id),
        supabase.from('psychology_logs').select('*').eq('user_id', activeAccount?.user_id || '__no_user__').eq('workspace_id', workspace.id).order('log_date', { ascending: false }).limit(30),
        supabase.from('trading_goals').select('*').eq('user_id', activeAccount?.user_id || '__no_user__').eq('account_id', activeAccount?.id || '__no_active_account__').order('created_at', { ascending: false }),
        supabase.from('habits').select('*').eq('workspace_id', workspace.id),
        supabase.from('mistakes').select('*').eq('workspace_id', workspace.id),
        supabase.from('risk_rules').select('*').eq('workspace_id', workspace.id).eq('account_id', activeAccount?.id || '__no_active_account__').maybeSingle(),
        supabase.from('ai_memory').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
        supabase.from('ai_recommendations').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
      ]);
      setStrategies((stratRes.data || []) as Strategy[]);
      setPsychologyLogs((psychRes.data || []) as PsychologyLog[]);
      setGoals((goalRes.data || []) as TradingGoal[]);
      setHabits((habitRes.data || []) as Habit[]);
      setMistakes((mistakeRes.data || []) as Mistake[]);
      setRiskRules(riskRes.data as RiskRules | null);
      setMemory((memRes.data || []) as AiMemory[]);
      setRecommendations((recRes.data || []) as AiRecommendation[]);
      setLoading(false);
    } catch {
      setError(true); setLoading(false);
    }
  }, [workspace, activeAccount?.id]);

  useEffect(() => { load(); }, [load]);

  const ctx: AiContext = useMemo(() => buildContext({
    workspace: workspace ? { id: workspace.id, name: workspace.name, default_currency: workspace.default_currency } : null,
    account: activeAccount ? { account_name: activeAccount.account_name, current_balance: Number(activeAccount.current_balance), base_currency: activeAccount.base_currency } : null,
    trades,
    strategies,
    psychologyLogs,
    goals,
    habits,
    mistakes,
    riskRules,
    memory,
  }), [workspace, activeAccount, trades, strategies, psychologyLogs, goals, habits, mistakes, riskRules, memory]);

  const metrics = useMemo(() => computeMetrics(trades), [trades]);

  const patterns = useMemo(() => detectBehaviorPatterns(trades, psychologyLogs, mistakes, riskRules), [trades, psychologyLogs, mistakes, riskRules]);
  const correlations = useMemo(() => analyzeCorrelations(trades, strategies, psychologyLogs), [trades, strategies, psychologyLogs]);
  const profile = useMemo(() => buildTraderProfile(trades, strategies, psychologyLogs, mistakes, metrics), [trades, strategies, psychologyLogs, mistakes, metrics]);
  const score = useMemo(() => calculateCompositeScore(trades, psychologyLogs, mistakes, goals, habits, metrics), [trades, psychologyLogs, mistakes, goals, habits, metrics]);
  const timeline = useMemo(() => generateBehaviorTimeline(trades, psychologyLogs, metrics), [trades, psychologyLogs, metrics]);
  const comparisons = useMemo(() => generateComparisons(trades, metrics), [trades, metrics]);
  const dailyIntel = useMemo(() => generateDailyIntelligence(trades, psychologyLogs, mistakes), [trades, psychologyLogs, mistakes]);
  const weeklyIntel = useMemo(() => generateWeeklyIntelligence(trades, psychologyLogs, mistakes, goals, metrics), [trades, psychologyLogs, mistakes, goals, metrics]);

  const updateRec = async (id: string, updates: Partial<AiRecommendation>) => {
    await supabase.from('ai_recommendations').update(updates).eq('id', id);
    setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
  };

  if (loading) return <LoadingState label="Loading AI intelligence…" />;
  if (error) return <ErrorState title="Could not load AI data" description="Your AI workspace could not be loaded." onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">AI Intelligence</h2>
          <p className="text-sm text-muted-foreground">Your personal trading mentor — powered by your own data.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-px">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors', tab === item.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
            <item.icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>
      {trades.length === 0 && tab !== 'chat' && tab !== 'memory' ? (
        <EmptyState icon={Sparkles} title="No trading data yet" description="Add trades to your journal to unlock AI coaching, insights, and reviews." />
      ) : (
        <>
          {tab === 'dashboard' && <AiDashboard ctx={ctx} onNavigate={(t) => setTab(t as AiTab)} />}
          {tab === 'patterns' && <BehaviorPatterns patterns={patterns} />}
          {tab === 'correlations' && <Correlations correlations={correlations} />}
          {tab === 'profile' && <TraderProfile profile={profile} />}
          {tab === 'score' && <TradingScore result={score} />}
          {tab === 'insights' && <AiInsightsEnhanced ctx={ctx} />}
          {tab === 'recommendations' && <AiRecommendations recommendations={recommendations} onAction={(id) => updateRec(id, { action_taken: true })} onDismiss={(id) => updateRec(id, { dismissed: true })} />}
          {tab === 'timeline' && <BehaviorTimeline events={timeline} />}
          {tab === 'comparisons' && <Comparisons comparisons={comparisons} />}
          {tab === 'daily' && <DailyIntelligenceCard data={dailyIntel} />}
          {tab === 'weekly' && <WeeklyIntelligenceCard data={weeklyIntel} />}
          {tab === 'coach' && <AiCoach ctx={ctx} workspaceId={workspace?.id || null} />}
          {tab === 'chat' && <AiChat ctx={ctx} workspaceId={workspace?.id || null} />}
          {tab === 'trade-review' && <AiTradeReview ctx={ctx} />}
          {tab === 'psychology-review' && <AiPsychologyReview ctx={ctx} />}
          {tab === 'memory' && <AiMemoryPanel memory={memory} workspaceId={workspace?.id || null} onRefresh={load} />}
        </>
      )}
    </div>
  );
}
