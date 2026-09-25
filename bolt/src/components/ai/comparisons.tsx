'use client';
import { GitBranch, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { ComparisonResult } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary text-muted-foreground border-border',
};

export function Comparisons({ comparisons }: { comparisons: ComparisonResult[] }) {
  if (comparisons.length === 0) {
    return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Not enough data for comparisons. Add more trades to unlock comparative analysis.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">Compare periods, strategies, sessions, directions, and outcomes side by side.</p>
      </div>
      {comparisons.map((c, i) => {
        const aWins = c.a.pnl > c.b.pnl;
        return (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{c.label}</CardTitle>
                <Badge variant="outline" className={cn('text-[10px]', CONFIDENCE_STYLES[c.confidence])}>{c.confidence} confidence</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { data: c.a, isWinner: aWins, label: c.a.key },
                  { data: c.b, isWinner: !aWins, label: c.b.key },
                ].map((side) => (
                  <div key={side.label} className={cn('p-3 rounded-lg border', side.isWinner ? 'border-success/30 bg-success/5' : 'border-border bg-secondary/30')}>
                    <div className="text-xs font-medium mb-2">{side.label}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Trades</span><span className="font-medium">{side.data.trades}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">P&L</span><span className={cn('font-medium', side.data.pnl >= 0 ? 'text-success' : 'text-destructive')}>{side.data.pnl >= 0 ? '+' : ''}{side.data.pnl.toFixed(0)}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Win Rate</span><span className="font-medium">{side.data.winRate.toFixed(0)}%</span></div>
                      {isFinite(side.data.profitFactor) && side.data.profitFactor > 0 && (
                        <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">PF</span><span className="font-medium">{side.data.profitFactor.toFixed(2)}</span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{c.finding}</p>
              </div>
              {c.evidence.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.evidence.slice(0, 3).map((e, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground truncate max-w-[200px]">{e.label}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
