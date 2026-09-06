'use client';
import { BarChart3, Link2, TrendingUp } from 'lucide-react';
import type { CorrelationResult } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary text-muted-foreground border-border',
};

export function Correlations({ correlations }: { correlations: CorrelationResult[] }) {
  if (correlations.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Not enough data for correlation analysis. Continue trading to unlock multi-dimensional insights.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          AI compares different dimensions of your trading (strategy, session, instrument, risk, emotion, day, timeframe) to find meaningful relationships.
        </p>
      </div>
      {correlations.map((c, i) => (
        <Card key={i} className="hover:border-primary/20 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                {c.label}
              </CardTitle>
              <Badge variant="outline" className={cn('text-[10px]', CONFIDENCE_STYLES[c.confidence])}>
                {c.confidence} confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{c.finding}</p>
            {c.data.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {c.data.slice(0, 6).map((d) => (
                  <div key={d.key} className="p-2 rounded-lg bg-secondary/50">
                    <div className="text-[10px] font-medium truncate">{d.key}</div>
                    <div className={cn('text-xs font-bold', d.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                      {d.pnl >= 0 ? '+' : ''}{d.pnl.toFixed(0)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{d.trades}t | {d.winRate.toFixed(0)}% WR</div>
                  </div>
                ))}
              </div>
            )}
            {c.evidence.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <TrendingUp className="w-3 h-3 text-muted-foreground shrink-0" />
                {c.evidence.slice(0, 3).map((e, j) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground truncate max-w-[200px]">
                    {e.label}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
