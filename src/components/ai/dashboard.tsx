'use client';
import { Brain, Gauge, HeartPulse, MessageSquare, Sparkles, Target, TrendingUp, Award, AlertTriangle, Lightbulb, Activity, User, GitBranch, Clock, Sun } from 'lucide-react';
import type { AiContext } from '@/lib/ai-context';
import { calculateTradingScore, calculatePsychologyScore, calculateDisciplineScore, generateInsights } from '@/lib/ai-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AiDashboard({ ctx, onNavigate }: { ctx: AiContext; onNavigate: (tab: string) => void }) {
  const trading = calculateTradingScore(ctx);
  const psychology = calculatePsychologyScore(ctx);
  const discipline = calculateDisciplineScore(ctx);
  const insights = generateInsights(ctx);
  const scoreCards = [
    { label: 'Trading Score', value: trading.score, icon: TrendingUp, color: trading.score >= 60 ? 'text-success' : trading.score >= 40 ? 'text-warning' : 'text-destructive' },
    { label: 'Psychology Score', value: psychology.score, icon: HeartPulse, color: psychology.score >= 60 ? 'text-success' : psychology.score >= 40 ? 'text-warning' : 'text-destructive' },
    { label: 'Discipline Score', value: discipline.score, icon: Gauge, color: discipline.score >= 60 ? 'text-success' : discipline.score >= 40 ? 'text-warning' : 'text-destructive' },
  ];
  const navCards = [
    { label: 'AI Coach', icon: Sparkles, tab: 'coach' },
    { label: 'AI Chat', icon: MessageSquare, tab: 'chat' },
    { label: 'Patterns', icon: Activity, tab: 'patterns' },
    { label: 'Correlations', icon: GitBranch, tab: 'correlations' },
    { label: 'Trader Profile', icon: User, tab: 'profile' },
    { label: 'Trading Score', icon: Gauge, tab: 'score' },
    { label: 'AI Insights', icon: Brain, tab: 'insights' },
    { label: 'AI Memory', icon: Target, tab: 'memory' },
    { label: 'Timeline', icon: Clock, tab: 'timeline' },
    { label: 'Comparisons', icon: GitBranch, tab: 'comparisons' },
    { label: 'Daily Intel', icon: Sun, tab: 'daily' },
    { label: 'Weekly Intel', icon: TrendingUp, tab: 'weekly' },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scoreCards.map((card) => (
          <Card key={card.label} className="hover:border-primary/20 transition-colors cursor-pointer" onClick={() => onNavigate('score')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between"><card.icon className={cn('w-4 h-4', card.color)} /><span className="text-2xl font-bold">{card.value}</span></div>
              <div className="text-xs text-muted-foreground mt-2">{card.label}</div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden"><div className={cn('h-full rounded-full', card.color.replace('text-', 'bg-'))} style={{ width: `${card.value}%` }} /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {navCards.map((item) => (
          <Card key={item.label} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onNavigate(item.tab)}>
            <CardContent className="p-4 flex flex-col items-center gap-2"><item.icon className="w-5 h-5 text-primary" /><span className="text-xs font-medium">{item.label}</span></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />Recent AI Insights</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {insights.length === 0 ? <p className="text-xs text-muted-foreground">No insights yet. Add trades and generate insights to see AI analysis.</p> : insights.slice(0, 5).map((insight) => {
            const Icon = insight.severity === 'critical' ? AlertTriangle : insight.severity === 'warning' ? AlertTriangle : insight.severity === 'success' ? Award : Lightbulb;
            const color = insight.severity === 'critical' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : insight.severity === 'success' ? 'text-success' : 'text-primary';
            return <div key={insight.title} className="flex gap-3 items-start"><Icon className={cn('w-4 h-4 shrink-0 mt-0.5', color)} /><div><div className="text-xs font-medium">{insight.title}</div><div className="text-[11px] text-muted-foreground">{insight.body}</div></div></div>;
          })}
        </CardContent>
      </Card>
    </div>
  );
}
