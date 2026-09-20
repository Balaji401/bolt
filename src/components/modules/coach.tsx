'use client';
import { useState } from 'react';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Award, Lightbulb } from 'lucide-react';
import type { Trade, AiInsight } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';
import { logger } from '@/lib/logger';
import { useWorkspace } from '@/components/workspace-provider';

export function Coach({ trades, insights, onRegenerated }: { trades: Trade[]; insights: AiInsight[]; onRegenerated: () => void }) {
  const [generating, setGenerating] = useState(false);
  const { activeAccount } = useWorkspace();
  const metrics = computeMetrics(trades);

  const generateInsights = async () => {
    if (!activeAccount) return;
    setGenerating(true);
    try {
      const generated = generateLocalInsights(metrics, trades);
      for (const insight of generated) {
        await supabase.from('ai_insights').insert({ ...insight, user_id: activeAccount.user_id, workspace_id: activeAccount.workspace_id, account_id: activeAccount.id });
      }
      emit('insight:generated', { count: generated.length }, 'coach');
      onRegenerated();
    } catch (err) {
      logger.error('Coach', 'Generation failed', { error: err });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">AI Trading Coach</h2><p className="text-sm text-muted-foreground">Personalized insights from your trading data</p></div>
        <Button onClick={generateInsights} disabled={generating || trades.length === 0}>
          {generating ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-2" /> Generate Insights</>}
        </Button>
      </div>

      {trades.length === 0 ? (
        <EmptyState icon={Sparkles} title="No insights yet" description="Add trades to generate AI coaching insights." />
      ) : insights.length === 0 ? (
        <EmptyState icon={Sparkles} title="No insights generated" description="Click 'Generate Insights' to analyze your trading data." action={<Button onClick={generateInsights}><Sparkles className="w-4 h-4 mr-2" /> Generate Insights</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const Icon = insight.insight_type === 'warning' ? AlertTriangle : insight.insight_type === 'strength' ? Award : insight.insight_type === 'suggestion' ? Lightbulb : TrendingUp;
            const color = insight.severity === 'critical' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : insight.severity === 'success' ? 'text-success' : 'text-primary';
            return (
              <Card key={insight.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('grid place-items-center w-10 h-10 rounded-lg shrink-0 bg-secondary/60', color)}><Icon className="w-5 h-5" /></div>
                    <div className="min-w-0"><div className="text-sm font-semibold mb-1">{insight.title}</div><div className="text-xs text-muted-foreground leading-relaxed">{insight.body}</div></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function generateLocalInsights(metrics: ReturnType<typeof computeMetrics>, trades: Trade[]): Omit<AiInsight, 'id' | 'created_at'>[] {
  const insights: Omit<AiInsight, 'id' | 'created_at'>[] = [];
  if (metrics.winRate < 40) insights.push({ insight_type: 'warning', title: 'Low Win Rate', body: `Your win rate is ${metrics.winRate.toFixed(1)}%. Consider tightening your entry criteria or waiting for higher-quality setups.`, severity: 'warning', metric_ref: 'win_rate' });
  if (metrics.winRate >= 60) insights.push({ insight_type: 'strength', title: 'Strong Win Rate', body: `Your win rate of ${metrics.winRate.toFixed(1)}% is above average. Keep doing what you're doing.`, severity: 'success', metric_ref: 'win_rate' });
  if (metrics.profitFactor < 1) insights.push({ insight_type: 'warning', title: 'Negative Profit Factor', body: `Your profit factor is ${metrics.profitFactor.toFixed(2)}. Your losses exceed your wins. Review your risk management.`, severity: 'critical', metric_ref: 'profit_factor' });
  if (metrics.profitFactor >= 2) insights.push({ insight_type: 'strength', title: 'Excellent Profit Factor', body: `Your profit factor of ${metrics.profitFactor.toFixed(2)} indicates a strong edge.`, severity: 'success', metric_ref: 'profit_factor' });
  if (metrics.maxLossStreak >= 5) insights.push({ insight_type: 'warning', title: 'Long Losing Streak', body: `You had a ${metrics.maxLossStreak}-trade losing streak. Consider reducing position size during drawdowns.`, severity: 'warning', metric_ref: 'max_loss_streak' });
  const bestSession = Object.entries(metrics.bySession).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestSession && bestSession[1].pnl > 0) insights.push({ insight_type: 'observation', title: `Best Session: ${bestSession[0].charAt(0).toUpperCase() + bestSession[0].slice(1)}`, body: `Your most profitable session is ${bestSession[0]} with ${formatCurrency(bestSession[1].pnl)} P&L across ${bestSession[1].trades} trades.`, severity: 'info', metric_ref: 'best_session' });
  const bestInstrument = Object.entries(metrics.byInstrument).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestInstrument && bestInstrument[1].pnl > 0) insights.push({ insight_type: 'observation', title: `Best Instrument: ${bestInstrument[0]}`, body: `${bestInstrument[0]} is your most profitable instrument with ${formatCurrency(bestInstrument[1].pnl)} P&L.`, severity: 'info', metric_ref: 'best_instrument' });
  if (metrics.avgConfidence > 0 && metrics.avgConfidence < 50) insights.push({ insight_type: 'suggestion', title: 'Low Confidence Trades', body: `Your average confidence is ${metrics.avgConfidence.toFixed(0)}%. Consider only taking trades with higher conviction.`, severity: 'warning', metric_ref: 'avg_confidence' });
  insights.push({ insight_type: 'summary', title: 'Trading Summary', body: `You have ${metrics.totalTrades} trades with a total P&L of ${formatCurrency(metrics.totalPnl)}. Win rate: ${metrics.winRate.toFixed(1)}%. Profit factor: ${metrics.profitFactor.toFixed(2)}.`, severity: metrics.totalPnl >= 0 ? 'success' : 'warning', metric_ref: 'summary' });
  return insights;
}
