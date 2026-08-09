'use client';
import { Brain, Heart, Activity, Target, Clock, Zap, AlertTriangle, TrendingUp, CheckCircle2, Flame } from 'lucide-react';
import type { PsychologyMetrics } from '@/lib/psychology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/charts';
import { cn } from '@/lib/utils';

export function PsychologyDashboard({ metrics }: { metrics: PsychologyMetrics }) {
  const cards = [
    { label: 'Discipline Score', value: metrics.disciplineScore.toFixed(0), icon: CheckCircle2, accent: metrics.disciplineScore >= 70 ? 'success' : metrics.disciplineScore >= 50 ? 'warning' : 'destructive' },
    { label: 'Emotional Score', value: metrics.emotionalScore.toFixed(0), icon: Heart, accent: metrics.emotionalScore >= 70 ? 'success' : metrics.emotionalScore >= 50 ? 'warning' : 'destructive' },
    { label: 'Consistency Score', value: metrics.consistencyScore.toFixed(0), icon: Activity, accent: metrics.consistencyScore >= 70 ? 'success' : metrics.consistencyScore >= 50 ? 'warning' : 'destructive' },
    { label: 'Confidence Score', value: metrics.confidenceScore.toFixed(0), icon: Zap, accent: metrics.confidenceScore >= 70 ? 'success' : metrics.confidenceScore >= 50 ? 'warning' : 'destructive' },
    { label: 'Patience Score', value: metrics.patienceScore.toFixed(0), icon: Clock, accent: metrics.patienceScore >= 70 ? 'success' : metrics.patienceScore >= 50 ? 'warning' : 'destructive' },
    { label: 'Rule Following', value: `${metrics.ruleFollowingPct.toFixed(0)}%`, icon: Target, accent: metrics.ruleFollowingPct >= 80 ? 'success' : metrics.ruleFollowingPct >= 60 ? 'warning' : 'destructive' },
    { label: 'Revenge Trades', value: String(metrics.revengeTradingCount), icon: AlertTriangle, accent: metrics.revengeTradingCount === 0 ? 'success' : 'destructive' },
    { label: 'FOMO Trades', value: String(metrics.fomoTrades), icon: AlertTriangle, accent: metrics.fomoTrades === 0 ? 'success' : 'warning' },
    { label: 'Overtrading Score', value: metrics.overtradingScore.toFixed(0), icon: TrendingUp, accent: metrics.overtradingScore < 20 ? 'success' : metrics.overtradingScore < 50 ? 'warning' : 'destructive' },
    { label: 'Missed Trades', value: String(metrics.missedTrades), icon: AlertTriangle, accent: metrics.missedTrades === 0 ? 'success' : 'warning' },
    { label: 'Trading Streak', value: metrics.tradingStreak > 0 ? `${metrics.tradingStreak}W` : metrics.tradingStreak < 0 ? `${Math.abs(metrics.tradingStreak)}L` : '—', icon: Flame, accent: metrics.tradingStreak > 0 ? 'success' : metrics.tradingStreak < 0 ? 'destructive' : 'primary' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <PsychCard key={c.label} {...c} />
        ))}
      </div>

      {metrics.disciplineTrend.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Psychology Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart
              data={metrics.disciplineTrend}
              xKey="date"
              lines={[
                { key: 'discipline', name: 'Discipline', color: 'hsl(var(--chart-1))' },
                { key: 'patience', name: 'Patience', color: 'hsl(var(--chart-2))' },
                { key: 'confidence', name: 'Confidence', color: 'hsl(var(--chart-3))' },
              ]}
              height={240}
              formatX={(v) => { const d = new Date(v); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PsychCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  accent: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn('grid place-items-center w-7 h-7 rounded-lg', colors[accent])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
