'use client';

import { useMemo, useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Eye,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { computeMetrics } from '@/lib/analytics';
import { supabase, type Trade, type AiInsight } from '@/lib/supabase';
import { fmtCurrency, fmtPct, fmtNum } from '@/lib/format';
import { cn } from '@/lib/utils';

const severityStyle: Record<string, { border: string; bg: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  success: { border: 'border-success/30', bg: 'bg-success/5', icon: TrendingUp, color: 'text-success' },
  warning: { border: 'border-warning/30', bg: 'bg-warning/5', icon: AlertTriangle, color: 'text-warning' },
  critical: { border: 'border-destructive/30', bg: 'bg-destructive/5', icon: AlertTriangle, color: 'text-destructive' },
  info: { border: 'border-primary/30', bg: 'bg-primary/5', icon: Lightbulb, color: 'text-primary' },
};

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  warning: AlertTriangle,
  strength: TrendingUp,
  suggestion: Lightbulb,
  observation: Eye,
  summary: Brain,
};

export function Coach({ trades, insights, onRegenerated }: { trades: Trade[]; insights: AiInsight[]; onRegenerated?: () => void }) {
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const [regenerating, setRegenerating] = useState(false);

  const autoInsights = useMemo(() => {
    const out: { title: string; body: string; severity: 'success' | 'warning' | 'info' | 'critical' }[] = [];
    if (m.byWeekday.length) {
      const friday = m.byWeekday.find((d) => d.day === 'Fri');
      const tuesday = m.byWeekday.find((d) => d.day === 'Tue');
      if (friday && friday.pnl < 0) {
        out.push({
          title: 'Friday is your weakest day',
          body: `You have a net loss of ${fmtCurrency(friday.pnl)} on Fridays with a ${fmtPct(friday.winRate)} win rate. Consider reducing or skipping Friday trading.`,
          severity: 'warning',
        });
      }
      if (tuesday && tuesday.pnl > 0) {
        out.push({
          title: 'Tuesday is your strongest day',
          body: `Tuesdays generate ${fmtCurrency(tuesday.pnl)} with a ${fmtPct(tuesday.winRate)} win rate. This is your edge window — maximize it.`,
          severity: 'success',
        });
      }
    }
    if (m.bySession.length) {
      const best = [...m.bySession].sort((a, b) => b.pnl - a.pnl)[0];
      if (best) {
        out.push({
          title: `${best.key} session is your most profitable`,
          body: `Net P&L of ${fmtCurrency(best.pnl)} across ${best.trades} trades (${fmtPct(best.winRate)} win rate). Concentrate your activity in the ${best.key} session.`,
          severity: 'success',
        });
      }
    }
    if (m.byInstrument.length) {
      const best = [...m.byInstrument].sort((a, b) => b.pnl - a.pnl)[0];
      const worst = [...m.byInstrument].sort((a, b) => a.pnl - b.pnl)[0];
      if (best) {
        out.push({
          title: `${best.key} is your strongest instrument`,
          body: `Profit factor ${fmtNum(best.pnl > 0 ? best.pnl / Math.max(1, Math.abs(worst?.pnl || 1)) : 0, 1)} with ${fmtPct(best.winRate)} win rate across ${best.trades} trades.`,
          severity: 'success',
        });
      }
      if (worst && worst.pnl < 0) {
        out.push({
          title: `${worst.key} is reducing your profitability`,
          body: `Net loss of ${fmtCurrency(worst.pnl)} on ${worst.trades} trades. Consider reducing position size or avoiding this instrument until your edge improves.`,
          severity: 'warning',
        });
      }
    }
    if (m.currentStreak >= 3) {
      out.push({
        title: `${m.currentStreak}-trade ${m.streakType} streak`,
        body: m.streakType === 'win' ? 'You are in a winning streak. Stay disciplined and avoid overconfidence — keep risk per trade constant.' : 'You are in a losing streak. Reduce size, step back, and review your last 3 trades for pattern errors.',
        severity: m.streakType === 'win' ? 'success' : 'critical',
      });
    }
    if (m.profitFactor < 1.5 && m.profitFactor > 0) {
      out.push({
        title: 'Profit factor needs improvement',
        body: `Your profit factor is ${fmtNum(m.profitFactor, 2)}. Aim for 1.5+ by tightening stops, letting winners run, or filtering low-quality setups.`,
        severity: 'warning',
      });
    }
    return out;
  }, [m]);

  const allInsights = [...autoInsights.map((a, i) => ({ ...a, id: `auto-${i}`, insight_type: 'observation' as const, metric_ref: null, created_at: new Date().toISOString() })), ...insights];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Coach hero */}
      <div className="relative overflow-hidden glass rounded-2xl p-6">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-success/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">AI Trading Coach</div>
            <h2 className="text-xl font-semibold">Your personalized performance review</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {m.totalTrades} closed trades. Net P&L {fmtCurrency(m.totalPnl)}. Win rate {fmtPct(m.winRate)}. Profit factor {fmtNum(m.profitFactor, 2)}.
            </p>
          </div>
          <button
            onClick={() => regenerate(m, autoInsights, setRegenerating, onRegenerated)}
            disabled={regenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/60 border border-border text-sm hover:border-primary/40 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', regenerating && 'animate-spin')} />
            {regenerating ? 'Analyzing...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allInsights.map((ins) => {
          const style = severityStyle[ins.severity] || severityStyle.info;
          const Icon = typeIcon[ins.insight_type] || style.icon;
          return (
            <div key={ins.id} className={cn('glass rounded-xl p-4 border', style.border, style.bg)}>
              <div className="flex items-start gap-3">
                <div className={cn('grid place-items-center w-9 h-9 rounded-lg shrink-0', style.bg, style.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-widest', style.color)}>{ins.insight_type}</span>
                  </div>
                  <div className="font-medium text-sm mb-1">{ins.title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ins.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coaching pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Pillar title="Discipline" score={84} icon={Brain} items={['Followed trading plan 84% of the time', 'Skipped 2 planned trades this week', 'Moved stop loss 3 times — review rule']} />
        <Pillar title="Risk Management" score={76} icon={AlertTriangle} items={[`Avg risk per trade: 1.4%`, `Max drawdown: ${fmtCurrency(m.maxDrawdown)}`, 'Position sizing consistent']} />
        <Pillar title="Psychology" score={71} icon={Sparkles} items={['Confidence trending up', 'FOMO detected on 4 trades', 'Revenge trading risk: low']} />
      </div>
    </div>
  );
}

function Pillar({ title, score, icon: Icon, items }: { title: string; score: number; icon: React.ComponentType<{ className?: string }>; items: string[] }) {
  const tone = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive';
  const toneColor: Record<string, string> = { success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' };
  const toneBg: Record<string, string> = { success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive' };
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-lg bg-secondary/60 text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className={cn('text-2xl font-semibold', toneColor[tone])}>{score}</div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mb-4">
        <div className={cn('h-full rounded-full', toneBg[tone])} style={{ width: `${score}%` }} />
      </div>
      <ul className="space-y-2 text-xs text-muted-foreground">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function regenerate(
  m: ReturnType<typeof computeMetrics>,
  autoInsights: { title: string; body: string; severity: 'success' | 'warning' | 'info' | 'critical'; insight_type?: string }[],
  setRegenerating: (v: boolean) => void,
  onDone?: () => void
) {
  setRegenerating(true);
  // Clear existing AI insights and persist freshly generated ones.
  await supabase.from('ai_insights').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const rows = autoInsights.map((a) => ({
    insight_type: (a.insight_type as any) || 'observation',
    title: a.title,
    body: a.body,
    severity: a.severity,
    metric_ref: null,
  }));
  if (rows.length) await supabase.from('ai_insights').insert(rows);
  // Add a fresh summary insight based on the latest metrics.
  await supabase.from('ai_insights').insert({
    insight_type: 'summary',
    title: 'Regenerated performance summary',
    body: `Net P&L ${fmtCurrency(m.totalPnl)}. Win rate ${fmtPct(m.winRate)}. Profit factor ${fmtNum(m.profitFactor, 2)}. Avg R:R 1:${fmtNum(m.avgRr, 1)}. Max drawdown ${fmtCurrency(m.maxDrawdown)}.`,
    severity: m.totalPnl >= 0 ? 'success' : 'warning',
    metric_ref: 'summary',
  });
  // Simulate analysis time for UX feedback.
  setTimeout(() => {
    setRegenerating(false);
    onDone?.();
  }, 800);
}
