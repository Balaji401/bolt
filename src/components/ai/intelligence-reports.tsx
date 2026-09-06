'use client';
import { Sun, AlertTriangle, CheckCircle2, TrendingUp, Brain, Shield, Target } from 'lucide-react';
import type { DailyIntelligence, WeeklyIntelligence } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary text-muted-foreground border-border',
};

export function DailyIntelligenceCard({ data }: { data: DailyIntelligence | null }) {
  if (!data) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No daily intelligence available.</CardContent></Card>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sun className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">Your AI-generated daily trading summary with activity, mistakes, risk, psychology, and areas to improve.</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{data.date}</CardTitle>
            <Badge variant="outline" className={cn('text-[10px]', CONFIDENCE_STYLES[data.confidence])}>{data.confidence} confidence</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-medium">{data.summary}</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">Trades</div><div className="text-sm font-bold">{data.activity.trades}</div></div>
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">P&L</div><div className={cn('text-sm font-bold', data.activity.pnl >= 0 ? 'text-success' : 'text-destructive')}>{data.activity.pnl >= 0 ? '+' : ''}{data.activity.pnl.toFixed(0)}</div></div>
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">Wins</div><div className="text-sm font-bold text-success">{data.activity.wins}</div></div>
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">Losses</div><div className="text-sm font-bold text-destructive">{data.activity.losses}</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5">Risk Behavior</div><div className="text-xs">{data.risk_behavior}</div></div>
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5">Psychology</div><div className="text-xs">{data.psychology}</div></div>
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5">Strategy Execution</div><div className="text-xs">{data.strategy_execution}</div></div>
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5">Mistakes</div><div className="text-xs">{data.mistakes.length > 0 ? data.mistakes.join(', ') : 'None'}</div></div>
          </div>
          {data.positive_behaviors.length > 0 && (
            <div><div className="text-[10px] font-medium uppercase tracking-wider text-success mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Positive Behaviors</div><ul className="space-y-0.5">{data.positive_behaviors.map((b, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-success">+</span>{b}</li>)}</ul></div>
          )}
          {data.areas_to_improve.length > 0 && (
            <div><div className="text-[10px] font-medium uppercase tracking-wider text-warning mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Areas to Improve</div><ul className="space-y-0.5">{data.areas_to_improve.map((b, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-warning">!</span>{b}</li>)}</ul></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function WeeklyIntelligenceCard({ data }: { data: WeeklyIntelligence | null }) {
  if (!data) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No weekly intelligence available.</CardContent></Card>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">Your AI-generated weekly report covering performance, risk, psychology, strategy, behavior, mistakes, improvements, goals, and next-week priorities.</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{data.week}</CardTitle>
            <Badge variant="outline" className={cn('text-[10px]', CONFIDENCE_STYLES[data.confidence])}>{data.confidence} confidence</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-medium">{data.summary}</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">Trades</div><div className="text-sm font-bold">{data.performance.trades}</div></div>
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">P&L</div><div className={cn('text-sm font-bold', data.performance.pnl >= 0 ? 'text-success' : 'text-destructive')}>{data.performance.pnl >= 0 ? '+' : ''}{data.performance.pnl.toFixed(0)}</div></div>
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">Win Rate</div><div className="text-sm font-bold">{data.performance.winRate.toFixed(0)}%</div></div>
            <div className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">PF</div><div className="text-sm font-bold">{isFinite(data.performance.profitFactor) ? data.performance.profitFactor.toFixed(2) : '∞'}</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><Shield className="w-3 h-3" />Risk</div><div className="text-xs">{data.risk}</div></div>
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><Brain className="w-3 h-3" />Psychology</div><div className="text-xs">{data.psychology}</div></div>
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1"><Target className="w-3 h-3" />Strategy</div><div className="text-xs">{data.strategy_execution}</div></div>
            <div className="p-2 rounded-lg bg-secondary/30"><div className="text-[10px] text-muted-foreground mb-0.5">Mistakes</div><div className="text-xs">{data.mistakes.length > 0 ? data.mistakes.join(', ') : 'None'}</div></div>
          </div>
          {data.behavior.length > 0 && (
            <div><div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Behavior Notes</div><ul className="space-y-0.5">{data.behavior.map((b, i) => <li key={i} className="text-xs text-muted-foreground">• {b}</li>)}</ul></div>
          )}
          {data.improvements.length > 0 && (
            <div><div className="text-[10px] font-medium uppercase tracking-wider text-warning mb-1">Improvements</div><ul className="space-y-0.5">{data.improvements.map((b, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-warning">!</span>{b}</li>)}</ul></div>
          )}
          {data.goals.length > 0 && (
            <div><div className="text-[10px] font-medium uppercase tracking-wider text-primary mb-1">Goals</div><ul className="space-y-0.5">{data.goals.map((g, i) => <li key={i} className="text-xs text-muted-foreground">• {g}</li>)}</ul></div>
          )}
          {data.next_week_priorities.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-[10px] font-medium uppercase tracking-wider text-primary mb-1">Next Week Priorities</div>
              <div className="space-y-1">{data.next_week_priorities.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>{p}
                </div>
              ))}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
