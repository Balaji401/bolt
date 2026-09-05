'use client';
import { CheckCircle2, Lightbulb, TrendingUp, X } from 'lucide-react';
import type { AiRecommendation } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

export function AiRecommendations({ recommendations, onAction, onDismiss }: { recommendations: AiRecommendation[]; onAction: (id: string) => void; onDismiss: (id: string) => void }) {
  const active = recommendations.filter((r) => !r.action_taken && !r.dismissed);
  const done = recommendations.filter((r) => r.action_taken);
  if (recommendations.length === 0) return <EmptyState icon={Lightbulb} title="No recommendations yet" description="Generate recommendations from the AI Coach to see actionable, data-backed suggestions here." />;
  const priorityColor = (p: string) => p === 'critical' ? 'text-destructive' : p === 'high' ? 'text-warning' : p === 'medium' ? 'text-primary' : 'text-muted-foreground';
  return (
    <div className="space-y-4">
      {active.length > 0 && <div><h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Active ({active.length})</h3><div className="space-y-2">{active.map((rec) => <Card key={rec.id}><CardContent className="p-4"><div className="flex gap-3 items-start"><TrendingUp className={cn('w-4 h-4 shrink-0 mt-0.5', priorityColor(rec.priority))} /><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-medium">{rec.title}</span><span className={cn('text-[9px] uppercase font-semibold', priorityColor(rec.priority))}>{rec.priority}</span><span className="text-[9px] text-muted-foreground uppercase">{rec.category}</span></div><p className="text-[11px] text-muted-foreground mt-0.5">{rec.body}</p></div><div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAction(rec.id)} title="Mark as done"><CheckCircle2 className="w-3.5 h-3.5 text-success" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDismiss(rec.id)} title="Dismiss"><X className="w-3.5 h-3.5 text-muted-foreground" /></Button></div></div></CardContent></Card>)}</div></div>}
      {done.length > 0 && <div><h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Completed ({done.length})</h3><div className="space-y-2">{done.map((rec) => <Card key={rec.id} className="opacity-60"><CardContent className="p-4"><div className="flex gap-3 items-start"><CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /><div><div className="text-xs font-medium line-through">{rec.title}</div><p className="text-[11px] text-muted-foreground mt-0.5">{rec.body}</p></div></div></CardContent></Card>)}</div></div>}
    </div>
  );
}
