'use client';
import { Award, AlertTriangle, Lightbulb, HeartPulse, Target } from 'lucide-react';
import type { AiContext } from '@/lib/ai-context';
import { reviewPsychology, reviewGoals, calculatePsychologyScore, calculateDisciplineScore } from '@/lib/ai-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

export function AiPsychologyReview({ ctx }: { ctx: AiContext }) {
  const psychReview = reviewPsychology(ctx);
  const goalReview = reviewGoals(ctx);
  const psychScore = calculatePsychologyScore(ctx);
  const discScore = calculateDisciplineScore(ctx);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Psychology Score</span><span className={cn('text-lg font-bold', psychScore.score >= 60 ? 'text-success' : psychScore.score >= 40 ? 'text-warning' : 'text-destructive')}>{psychScore.score}/100</span></div>{Object.keys(psychScore.breakdown).length > 0 && <div className="mt-3 space-y-1">{Object.entries(psychScore.breakdown).map(([k, v]) => <div key={k} className="flex justify-between text-[11px]"><span className="text-muted-foreground capitalize">{k}</span><span>{v}</span></div>)}</div>}</CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Discipline Score</span><span className={cn('text-lg font-bold', discScore.score >= 60 ? 'text-success' : discScore.score >= 40 ? 'text-warning' : 'text-destructive')}>{discScore.score}/100</span></div>{Object.keys(discScore.breakdown).length > 0 && <div className="mt-3 space-y-1">{Object.entries(discScore.breakdown).map(([k, v]) => <div key={k} className="flex justify-between text-[11px]"><span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span><span>{v}</span></div>)}</div>}</CardContent></Card>
      </div>
      <ReviewCard title="Psychology Review" review={psychReview} icon={HeartPulse} />
      <ReviewCard title="Goal Coach" review={goalReview} icon={Target} />
    </div>
  );
}

function ReviewCard({ title, review, icon: Icon }: { title: string; review: { summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[] }; icon: React.ComponentType<{ className?: string }> }) {
  return <Card><CardContent className="p-4 space-y-3"><div className="text-sm font-semibold flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</div><p className="text-xs text-muted-foreground">{review.summary}</p>{review.strengths.length > 0 && <div className="space-y-1">{review.strengths.map((s) => <div key={s} className="flex gap-2 text-xs"><Award className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" /><span>{s}</span></div>)}</div>}{review.weaknesses.length > 0 && <div className="space-y-1">{review.weaknesses.map((w) => <div key={w} className="flex gap-2 text-xs"><AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" /><span>{w}</span></div>)}</div>}{review.recommendations.length > 0 && <div className="space-y-1">{review.recommendations.map((r) => <div key={r} className="flex gap-2 text-xs"><Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /><span>{r}</span></div>)}</div>}</CardContent></Card>;
}
