'use client';
import { useState } from 'react';
import { Award, AlertTriangle, Lightbulb, TrendingUp, Target } from 'lucide-react';
import type { AiContext } from '@/lib/ai-context';
import { reviewTrade } from '@/lib/ai-context';
import type { Trade } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

export function AiTradeReview({ ctx }: { ctx: AiContext }) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const closedTrades = ctx.recentTrades.filter((t) => t.status === 'closed');
  const trade = closedTrades.find((t) => t.id === selectedTradeId) || null;
  const review = trade ? reviewTrade(trade, ctx) : null;

  if (closedTrades.length === 0) return <EmptyState icon={Target} title="No closed trades to review" description="Close some trades in your journal to get AI trade reviews." />;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <span className="text-xs font-medium">Select a trade to review:</span>
            <Select value={selectedTradeId || ''} onValueChange={(v) => { setSelectedTradeId(v); setReviewed(false); }}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Choose a trade…" /></SelectTrigger>
              <SelectContent>{closedTrades.map((t) => <SelectItem key={t.id} value={t.id}>{t.instrument} {t.direction} · {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)} · {new Date(t.closed_at || t.executed_at).toLocaleDateString()}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={() => setReviewed(true)} disabled={!trade}>Review Trade</Button>
          </div>
        </CardContent>
      </Card>
      {trade && review && reviewed && (
        <div className="space-y-3">
          <Card><CardContent className="p-4"><div className="text-sm font-semibold mb-2">Trade Summary</div><p className="text-xs text-muted-foreground">{review.summary}</p><div className="mt-3 flex items-center gap-2"><span className="text-xs text-muted-foreground">AI Rating:</span><div className="flex gap-0.5">{[...Array(10)].map((_, i) => <div key={i} className={cn('w-4 h-1.5 rounded-full', i < review.rating ? 'bg-primary' : 'bg-secondary')} />)}</div><span className="text-xs font-medium">{review.rating}/10</span></div></CardContent></Card>
          {review.strengths.length > 0 && <ReviewSection title="Strengths" items={review.strengths} icon={Award} color="text-success" />}
          {review.weaknesses.length > 0 && <ReviewSection title="Weaknesses" items={review.weaknesses} icon={AlertTriangle} color="text-warning" />}
          {review.recommendations.length > 0 && <ReviewSection title="Recommendations" items={review.recommendations} icon={Lightbulb} color="text-primary" />}
        </div>
      )}
    </div>
  );
}

function ReviewSection({ title, items, icon: Icon, color }: { title: string; items: string[]; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return <Card><CardContent className="p-4"><div className={cn('text-xs font-semibold mb-2 flex items-center gap-1.5', color)}><Icon className="w-3.5 h-3.5" />{title}</div><div className="space-y-1.5">{items.map((item, i) => <div key={i} className="flex gap-2 text-xs"><span className={cn('shrink-0', color)}>•</span><span>{item}</span></div>)}</div></CardContent></Card>;
}
