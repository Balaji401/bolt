'use client';
import { useState, useCallback } from 'react';
import { Brain, AlertTriangle, Award, Lightbulb, ThumbsUp, ThumbsDown, Check, X, Bookmark, EyeOff, FileSearch } from 'lucide-react';
import type { AiContext, AiInsightResult } from '@/lib/ai-context';
import { generateInsights } from '@/lib/ai-context';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary text-muted-foreground border-border',
};

function inferConfidence(ctx: AiContext, insight: AiInsightResult): 'high' | 'medium' | 'low' {
  const n = ctx.metrics.totalTrades;
  if (n >= 30) return 'high';
  if (n >= 10) return 'medium';
  return 'low';
}

export function AiInsightsEnhanced({ ctx }: { ctx: AiContext }) {
  const { workspace } = useWorkspace();
  const insights = generateInsights(ctx);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});

  const submitFeedback = useCallback(async (insightKey: string, feedback: string) => {
    setFeedbackState((prev) => ({ ...prev, [insightKey]: feedback }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('ai_insights').insert({
        user_id: user.id,
        workspace_id: workspace?.id || null,
        insight_type: 'summary',
        title: insightKey,
        body: feedback,
        severity: 'info',
        confidence: 'medium',
        feedback,
      });
      await supabase.from('ai_insight_feedback').insert({
        user_id: user.id,
        workspace_id: workspace?.id || null,
        feedback_type: feedback as 'useful' | 'not_useful' | 'correct' | 'incorrect' | 'saved' | 'dismissed' | 'ignored',
      });
    } catch { /* ignore */ }
  }, [workspace]);

  if (ctx.metrics.totalTrades === 0) {
    return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Add trades to generate AI insights from your data.</CardContent></Card>;
  }

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">Each insight includes a confidence level based on your sample size and links to supporting evidence. Your feedback improves future recommendations.</p>
      </div>
      {sections.map((section) => section.items.length > 0 && (
        <div key={section.label}>
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5', section.color)}>
            <section.icon className="w-3.5 h-3.5" />{section.label}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.items.map((insight) => {
              const confidence = inferConfidence(ctx, insight);
              const key = `${insight.type}_${insight.data_ref}`;
              const fb = feedbackState[key];
              return (
                <Card key={key} className="hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-3 items-start">
                      <section.icon className={cn('w-4 h-4 shrink-0 mt-0.5', section.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-medium">{insight.title}</span>
                          <Badge variant="outline" className={cn('text-[9px] px-1 py-0', CONFIDENCE_STYLES[confidence])}>{confidence} confidence</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{insight.body}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-[9px] text-muted-foreground mr-1">Evidence:</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                            <FileSearch className="w-2.5 h-2.5" />{insight.data_ref.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {!fb ? (
                          <div className="flex items-center gap-1 mt-2">
                            <button onClick={() => submitFeedback(key, 'useful')} className="p-1 rounded hover:bg-success/10 text-muted-foreground hover:text-success transition-colors" title="Useful"><ThumbsUp className="w-3 h-3" /></button>
                            <button onClick={() => submitFeedback(key, 'not_useful')} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Not useful"><ThumbsDown className="w-3 h-3" /></button>
                            <button onClick={() => submitFeedback(key, 'correct')} className="p-1 rounded hover:bg-success/10 text-muted-foreground hover:text-success transition-colors" title="Correct"><Check className="w-3 h-3" /></button>
                            <button onClick={() => submitFeedback(key, 'incorrect')} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Incorrect"><X className="w-3 h-3" /></button>
                            <button onClick={() => submitFeedback(key, 'saved')} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Save"><Bookmark className="w-3 h-3" /></button>
                            <button onClick={() => submitFeedback(key, 'dismissed')} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Dismiss"><EyeOff className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3 text-success" />Marked as {fb}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
