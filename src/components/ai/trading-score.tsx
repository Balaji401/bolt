'use client';
import { Gauge, TrendingUp, Shield, Brain, Repeat, BookOpen, Scale } from 'lucide-react';
import type { TradingScoreResult } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Risk Management': Shield,
  'Discipline': Scale,
  'Strategy Execution': TrendingUp,
  'Psychology': Brain,
  'Consistency': Repeat,
  'Journal Completion': BookOpen,
  'Rule Following': Scale,
};

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary text-muted-foreground border-border',
};

export function TradingScore({ result }: { result: TradingScoreResult }) {
  if (result.overall === 0 && result.components.length === 0) {
    return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No trades to score yet. Add trades to get your AI Trading Score.</CardContent></Card>;
  }

  const scoreColor = result.overall >= 70 ? 'text-success' : result.overall >= 50 ? 'text-warning' : 'text-destructive';
  const scoreBg = result.overall >= 70 ? 'bg-success' : result.overall >= 50 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          Your AI Trading Score is a composite of 7 components. It reflects your trading quality — not a prediction of profitability.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Overall Score</div>
              <div className={cn('text-4xl font-bold', scoreColor)}>{result.overall}<span className="text-lg text-muted-foreground">/100</span></div>
            </div>
            <Badge variant="outline" className={cn('text-xs', CONFIDENCE_STYLES[result.confidence])}>
              {result.confidence} confidence
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
            <div className={cn('h-full rounded-full transition-all', scoreBg)} style={{ width: `${result.overall}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{result.explanation}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {result.components.map((c) => {
          const Icon = COMPONENT_ICONS[c.label] || Gauge;
          const color = c.score >= 70 ? 'text-success' : c.score >= 50 ? 'text-warning' : 'text-destructive';
          const bg = c.score >= 70 ? 'bg-success' : c.score >= 50 ? 'bg-warning' : 'bg-destructive';
          return (
            <Card key={c.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('w-3.5 h-3.5', color)} />
                  <span className="text-xs font-medium flex-1">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground">{(c.weight * 100).toFixed(0)}%</span>
                  <span className={cn('text-sm font-bold', color)}>{c.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
                  <div className={cn('h-full rounded-full', bg)} style={{ width: `${c.score}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{c.explanation}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
