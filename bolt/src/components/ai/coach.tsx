'use client';
import { useState } from 'react';
import { Award, Brain, CalendarDays, CheckCircle2, Gauge, HeartPulse, Lightbulb, RefreshCw, Shield, Sparkles, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import type { AiContext, AiInsightResult } from '@/lib/ai-context';
import { generateInsights, generateRecommendations, reviewPsychology, reviewGoals, calculateTradingScore, calculatePsychologyScore, calculateDisciplineScore } from '@/lib/ai-context';
import type { AiRecommendation } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COACH_TABS = [
  { id: 'daily', label: 'Daily', icon: CalendarDays },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays },
  { id: 'risk', label: 'Risk', icon: Shield },
  { id: 'psychology', label: 'Psychology', icon: HeartPulse },
  { id: 'discipline', label: 'Discipline', icon: Gauge },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'habits', label: 'Habits', icon: CheckCircle2 },
] as const;

export function AiCoach({ ctx, workspaceId }: { ctx: AiContext; workspaceId: string | null }) {
  const [tab, setTab] = useState<string>('daily');
  const [generating, setGenerating] = useState(false);
  const insights = generateInsights(ctx);
  const recommendations = generateRecommendations(ctx);
  const psychReview = reviewPsychology(ctx);
  const goalReview = reviewGoals(ctx);
  const tradingScore = calculateTradingScore(ctx);
  const psychScore = calculatePsychologyScore(ctx);
  const disciplineScore = calculateDisciplineScore(ctx);

  const generateRecs = async () => {
    setGenerating(true);
    const recs = generateRecommendations(ctx);
    for (const rec of recs) {
      await supabase.from('ai_recommendations').insert({ ...rec, workspace_id: workspaceId });
    }
    setGenerating(false);
  };

  const renderTab = () => {
    switch (tab) {
      case 'daily': return <DailyCoaching ctx={ctx} insights={insights} />;
      case 'weekly': return <WeeklyCoaching ctx={ctx} insights={insights} />;
      case 'risk': return <RiskCoaching ctx={ctx} recommendations={recommendations} />;
      case 'psychology': return <PsychologyCoaching review={psychReview} score={psychScore} />;
      case 'discipline': return <DisciplineCoaching ctx={ctx} score={disciplineScore} />;
      case 'strategy': return <StrategyCoaching ctx={ctx} />;
      case 'habits': return <HabitCoaching ctx={ctx} />;
      default: return null;
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI Coach</h3><p className="text-xs text-muted-foreground mt-1">Personalized coaching based on your trading data.</p></div>
        <Button size="sm" variant="outline" onClick={generateRecs} disabled={generating}>{generating ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <><RefreshCw className="w-3.5 h-3.5 mr-1" />Save Recommendations</>}</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">{COACH_TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', tab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}><item.icon className="w-3.5 h-3.5" />{item.label}</button>)}</div>
      {renderTab()}
    </div>
  );
}

function DailyCoaching({ ctx, insights }: { ctx: AiContext; insights: AiInsightResult[] }) {
  const m = ctx.metrics;
  const today = new Date().toISOString().split('T')[0];
  const todayTrades = ctx.recentTrades.filter((t) => (t.closed_at || t.executed_at).split('T')[0] === today);
  return <div className="space-y-3">
    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground mb-1">Today's Snapshot</div><div className="text-sm font-medium">{todayTrades.length} trades today | {m.totalTrades} total trades | Win rate {m.winRate.toFixed(1)}%</div></CardContent></Card>
    {insights.filter((i) => i.severity === 'critical' || i.severity === 'warning').slice(0, 3).map((insight) => <InsightCard key={insight.title} insight={insight} />)}
    <Card><CardContent className="p-4"><div className="flex gap-3 items-start"><Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" /><div className="text-xs"><span className="font-medium">Today's focus:</span> {m.currentStreak < 0 ? `You are on a ${Math.abs(m.currentStreak)}-trade losing streak — focus on risk management and trade quality.` : m.winRate < 50 ? 'Focus on taking only A+ setups that fully meet your checklist.' : 'Keep executing your plan consistently — you are on track.'}</div></div></CardContent></Card>
  </div>;
}

function WeeklyCoaching({ ctx, insights }: { ctx: AiContext; insights: AiInsightResult[] }) {
  const m = ctx.metrics;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekTrades = ctx.recentTrades.filter((t) => (t.closed_at || t.executed_at) >= weekAgo);
  return <div className="space-y-3">
    <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground mb-1">This Week</div><div className="text-sm font-medium">{weekTrades.length} trades this week | Net P&L: {m.totalPnl >= 0 ? '+' : ''}{m.totalPnl.toFixed(2)}</div></CardContent></Card>
    {insights.slice(0, 5).map((insight) => <InsightCard key={insight.title} insight={insight} />)}
  </div>;
}

function RiskCoaching({ ctx, recommendations }: { ctx: AiContext; recommendations: Omit<AiRecommendation, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'action_taken' | 'dismissed'>[] }) {
  const m = ctx.metrics;
  return <div className="space-y-3">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Profit Factor" value={m.profitFactor.toFixed(2)} good={m.profitFactor >= 1.5} />
      <MetricCard label="Avg R:R" value={m.avgRr.toFixed(2)} good={m.avgRr >= 2} />
      <MetricCard label="Max Loss Streak" value={`${m.maxLossStreak}`} good={m.maxLossStreak <= 3} />
      <MetricCard label="Avg Loss" value={m.avgLoss.toFixed(2)} good={m.avgLoss < m.avgWin} />
    </div>
    {recommendations.filter((r) => r.category === 'risk').map((rec) => <RecommendationCard key={rec.title} rec={rec} />)}
  </div>;
}

function PsychologyCoaching({ review, score }: { review: ReturnType<typeof reviewPsychology>; score: { score: number; breakdown: Record<string, number> } }) {
  return <div className="space-y-3">
    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Psychology Score</span><span className={cn('text-lg font-bold', score.score >= 60 ? 'text-success' : score.score >= 40 ? 'text-warning' : 'text-destructive')}>{score.score}/100</span></div></CardContent></Card>
    <ReviewCard title="Psychology Review" review={review} />
  </div>;
}

function DisciplineCoaching({ ctx, score }: { ctx: AiContext; score: { score: number; breakdown: Record<string, number> } }) {
  return <div className="space-y-3">
    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Discipline Score</span><span className={cn('text-lg font-bold', score.score >= 60 ? 'text-success' : score.score >= 40 ? 'text-warning' : 'text-destructive')}>{score.score}/100</span></div>{Object.keys(score.breakdown).length > 0 && <div className="mt-3 space-y-1">{Object.entries(score.breakdown).map(([k, v]) => <div key={k} className="flex justify-between text-[11px]"><span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span><span>{v}</span></div>)}</div>}</CardContent></Card>
    {ctx.mistakes.length > 0 && <Card><CardContent className="p-4"><div className="text-xs font-medium mb-2">Your Mistake Library</div>{ctx.mistakes.sort((a, b) => b.frequency - a.frequency).slice(0, 5).map((mst) => <div key={mst.id} className="flex justify-between text-xs py-1"><span>{mst.name}</span><span className="text-muted-foreground">{mst.frequency}x</span></div>)}</CardContent></Card>}
  </div>;
}

function StrategyCoaching({ ctx }: { ctx: AiContext }) {
  if (ctx.strategies.length === 0) return <Card><CardContent className="p-4 text-xs text-muted-foreground">No strategies yet. Create strategies in the Strategy Management module to get AI strategy coaching.</CardContent></Card>;
  return <div className="space-y-3">{ctx.strategies.map((s) => <Card key={s.id}><CardContent className="p-4"><div className="flex justify-between"><div><div className="text-sm font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.category} · {s.status}</div></div></div>{s.description && <p className="text-xs text-muted-foreground mt-2">{s.description}</p>}</CardContent></Card>)}</div>;
}

function HabitCoaching({ ctx }: { ctx: AiContext }) {
  if (ctx.habits.length === 0) return <Card><CardContent className="p-4 text-xs text-muted-foreground">No habits tracked yet. Create habits in the Psychology module to get AI habit coaching.</CardContent></Card>;
  return <div className="space-y-3">{ctx.habits.map((h) => <Card key={h.id}><CardContent className="p-4"><div className="flex justify-between items-center"><div><div className="text-sm font-medium">{h.name}</div><div className="text-xs text-muted-foreground">{h.frequency} · {h.active ? 'Active' : 'Inactive'}</div></div><CheckCircle2 className={cn('w-4 h-4', h.active ? 'text-success' : 'text-muted-foreground')} /></div></CardContent></Card>)}</div>;
}

function InsightCard({ insight }: { insight: AiInsightResult }) {
  const Icon = insight.severity === 'critical' ? AlertTriangle : insight.severity === 'warning' ? AlertTriangle : insight.severity === 'success' ? Award : Lightbulb;
  const color = insight.severity === 'critical' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : insight.severity === 'success' ? 'text-success' : 'text-primary';
  return <Card><CardContent className="p-4"><div className="flex gap-3 items-start"><Icon className={cn('w-4 h-4 shrink-0 mt-0.5', color)} /><div><div className="text-xs font-medium">{insight.title}</div><div className="text-[11px] text-muted-foreground mt-0.5">{insight.body}</div></div></div></CardContent></Card>;
}

function RecommendationCard({ rec }: { rec: Omit<AiRecommendation, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'action_taken' | 'dismissed'> }) {
  const priorityColor = rec.priority === 'critical' ? 'text-destructive' : rec.priority === 'high' ? 'text-warning' : rec.priority === 'medium' ? 'text-primary' : 'text-muted-foreground';
  return <Card><CardContent className="p-4"><div className="flex gap-3 items-start"><TrendingUp className={cn('w-4 h-4 shrink-0 mt-0.5', priorityColor)} /><div><div className="flex items-center gap-2"><span className="text-xs font-medium">{rec.title}</span><span className={cn('text-[9px] uppercase font-semibold', priorityColor)}>{rec.priority}</span></div><div className="text-[11px] text-muted-foreground mt-0.5">{rec.body}</div></div></div></CardContent></Card>;
}

function MetricCard({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <Card><CardContent className="p-3"><div className={cn('text-sm font-semibold', good ? 'text-success' : 'text-destructive')}>{value}</div><div className="text-[10px] text-muted-foreground mt-1">{label}</div></CardContent></Card>;
}

function ReviewCard({ title, review }: { title: string; review: { summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[] } }) {
  return <Card><CardContent className="p-4 space-y-3"><div className="text-sm font-semibold">{title}</div><p className="text-xs text-muted-foreground">{review.summary}</p>{review.strengths.length > 0 && <div className="space-y-1">{review.strengths.map((s) => <div key={s} className="flex gap-2 text-xs"><Award className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" /><span>{s}</span></div>)}</div>}{review.weaknesses.length > 0 && <div className="space-y-1">{review.weaknesses.map((w) => <div key={w} className="flex gap-2 text-xs"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" /><span>{w}</span></div>)}</div>}{review.recommendations.length > 0 && <div className="space-y-1">{review.recommendations.map((r) => <div key={r} className="flex gap-2 text-xs"><Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /><span>{r}</span></div>)}</div>}</CardContent></Card>;
}
