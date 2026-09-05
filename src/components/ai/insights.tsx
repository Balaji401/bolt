'use client';
import { Brain, Trash2, Target, Lightbulb, AlertTriangle, Award, TrendingUp } from 'lucide-react';
import type { AiContext } from '@/lib/ai-context';
import { generateInsights } from '@/lib/ai-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AiInsights({ ctx }: { ctx: AiContext }) {
  const insights = generateInsights(ctx);
  if (ctx.metrics.totalTrades === 0) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Add trades to generate AI insights from your data.</CardContent></Card>;
  const grouped = {
    critical: insights.filter((i) => i.severity === 'critical'),
    warning: insights.filter((i) => i.severity === 'warning'),
    success: insights.filter((i) => i.severity === 'success'),
    info: insights.filter((i) => i.severity === 'info'),
  };
  const sections = [
    { label: 'Critical', items: grouped.critical, color: 'text-destructive', icon: AlertTriangle },
    { label: 'Warnings', items: grouped.warning, color: 'text-warning', icon: AlertTriangle },
    { label: 'Strengths', items: grouped.success, color: 'text-success', icon: Award },
    { label: 'Observations', items: grouped.info, color: 'text-primary', icon: Lightbulb },
  ];
  return <div className="space-y-4">{sections.map((section) => section.items.length > 0 && <div key={section.label}><h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5', section.color)}><section.icon className="w-3.5 h-3.5" />{section.label}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{section.items.map((insight) => <Card key={insight.title} className="hover:border-primary/20 transition-colors"><CardContent className="p-4"><div className="flex gap-3 items-start"><section.icon className={cn('w-4 h-4 shrink-0 mt-0.5', section.color)} /><div><div className="text-xs font-medium">{insight.title}</div><div className="text-[11px] text-muted-foreground mt-0.5">{insight.body}</div></div></div></CardContent></Card>)}</div></div>)}</div>;
}
