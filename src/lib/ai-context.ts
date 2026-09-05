import type { Trade, Strategy, PsychologyLog, TradingGoal, Habit, Mistake, RiskRules, AiMemory } from '@/lib/supabase';
import { computeMetrics, type Metrics } from '@/lib/analytics';
import { formatCurrency } from '@/lib/format';

export type AiContext = {
  workspace: { id: string; name: string; currency: string } | null;
  account: { name: string; balance: number; currency: string } | null;
  metrics: Metrics;
  recentTrades: Trade[];
  strategies: Strategy[];
  psychologyLogs: PsychologyLog[];
  goals: TradingGoal[];
  habits: Habit[];
  mistakes: Mistake[];
  riskRules: RiskRules | null;
  memory: AiMemory[];
};

export function buildContext(params: {
  workspace: { id: string; name: string; default_currency: string } | null;
  account: { account_name: string; current_balance: number; base_currency: string } | null;
  trades: Trade[];
  strategies: Strategy[];
  psychologyLogs: PsychologyLog[];
  goals: TradingGoal[];
  habits: Habit[];
  mistakes: Mistake[];
  riskRules: RiskRules | null;
  memory: AiMemory[];
}): AiContext {
  const metrics = computeMetrics(params.trades);
  return {
    workspace: params.workspace ? { id: params.workspace.id, name: params.workspace.name, currency: params.workspace.default_currency } : null,
    account: params.account ? { name: params.account.account_name, balance: Number(params.account.current_balance), currency: params.account.base_currency } : null,
    metrics,
    recentTrades: params.trades.slice(0, 20),
    strategies: params.strategies,
    psychologyLogs: params.psychologyLogs,
    goals: params.goals,
    habits: params.habits,
    mistakes: params.mistakes,
    riskRules: params.riskRules,
    memory: params.memory,
  };
}

export function contextToPrompt(ctx: AiContext): string {
  const m = ctx.metrics;
  const lines: string[] = [];
  lines.push(`Workspace: ${ctx.workspace?.name || 'Default'}`);
  lines.push(`Account: ${ctx.account?.name || 'Default'} | Balance: ${ctx.account ? formatCurrency(ctx.account.balance, ctx.account.currency) : 'N/A'}`);
  lines.push(`Total Trades: ${m.totalTrades} | Win Rate: ${m.winRate.toFixed(1)}% | Net P&L: ${formatCurrency(m.totalPnl)} | Profit Factor: ${m.profitFactor.toFixed(2)} | Avg RR: ${m.avgRr.toFixed(2)}`);
  lines.push(`Current Streak: ${m.currentStreak > 0 ? `${m.currentStreak} wins` : m.currentStreak < 0 ? `${Math.abs(m.currentStreak)} losses` : 'none'} | Max Drawdown: N/A`);
  const bestSession = Object.entries(m.bySession).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worstSession = Object.entries(m.bySession).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  const bestInstrument = Object.entries(m.byInstrument).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worstInstrument = Object.entries(m.byInstrument).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (bestSession) lines.push(`Best Session: ${bestSession[0]} (${formatCurrency(bestSession[1].pnl)})`);
  if (worstSession) lines.push(`Worst Session: ${worstSession[0]} (${formatCurrency(worstSession[1].pnl)})`);
  if (bestInstrument) lines.push(`Best Instrument: ${bestInstrument[0]} (${formatCurrency(bestInstrument[1].pnl)})`);
  if (worstInstrument) lines.push(`Worst Instrument: ${worstInstrument[0]} (${formatCurrency(worstInstrument[1].pnl)})`);
  if (ctx.strategies.length > 0) lines.push(`Strategies: ${ctx.strategies.map((s) => `${s.name} (${s.status})`).join(', ')}`);
  if (ctx.goals.length > 0) lines.push(`Goals: ${ctx.goals.map((g) => `${g.title} (${g.completed ? 'done' : `${g.current_value}/${g.target_value}`})`).join(', ')}`);
  if (ctx.habits.length > 0) lines.push(`Active Habits: ${ctx.habits.filter((h) => h.active).length}`);
  if (ctx.mistakes.length > 0) lines.push(`Top Mistake: ${ctx.mistakes.sort((a, b) => b.frequency - a.frequency)[0]?.name || 'N/A'}`);
  if (ctx.psychologyLogs.length > 0) {
    const latest = ctx.psychologyLogs[0];
    lines.push(`Latest Psychology: confidence ${latest.confidence}/10, discipline ${latest.discipline || 'N/A'}/10, stress ${latest.stress_level || 'N/A'}/10`);
  }
  if (ctx.riskRules) lines.push(`Risk Rules: max ${ctx.riskRules.max_risk_per_trade_pct}% per trade, max ${ctx.riskRules.max_daily_loss_pct}% daily loss`);
  if (ctx.memory.length > 0) lines.push(`Memory: ${ctx.memory.slice(0, 10).map((mem) => `${mem.key}: ${mem.value}`).join('; ')}`);
  return lines.join('\n');
}

export type AiInsightResult = {
  type: 'mistake' | 'strength' | 'session' | 'instrument' | 'psychology' | 'discipline' | 'goal' | 'habit' | 'summary';
  title: string;
  body: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  dataRef: string;
};

export function generateInsights(ctx: AiContext): AiInsightResult[] {
  const insights: AiInsightResult[] = [];
  const m = ctx.metrics;
  if (m.totalTrades === 0) return insights;

  if (m.winRate < 40) insights.push({ type: 'mistake', title: 'Low Win Rate', body: `Your win rate is ${m.winRate.toFixed(1)}% across ${m.totalTrades} trades. Consider tightening entry criteria and only taking A+ setups.`, severity: 'warning', dataRef: 'win_rate' });
  if (m.winRate >= 60) insights.push({ type: 'strength', title: 'Strong Win Rate', body: `Your ${m.winRate.toFixed(1)}% win rate is above average. Keep executing your plan consistently.`, severity: 'success', dataRef: 'win_rate' });
  if (m.profitFactor < 1) insights.push({ type: 'mistake', title: 'Negative Profit Factor', body: `Profit factor is ${m.profitFactor.toFixed(2)} — losses exceed wins. Review risk management and position sizing.`, severity: 'critical', dataRef: 'profit_factor' });
  if (m.profitFactor >= 2) insights.push({ type: 'strength', title: 'Excellent Profit Factor', body: `Profit factor of ${m.profitFactor.toFixed(2)} indicates a strong, repeatable edge.`, severity: 'success', dataRef: 'profit_factor' });

  const bestSession = Object.entries(m.bySession).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestSession && bestSession[1].pnl > 0) insights.push({ type: 'session', title: `Best Session: ${bestSession[0]}`, body: `${bestSession[0]} session is your most profitable with ${formatCurrency(bestSession[1].pnl)} across ${bestSession[1].trades} trades.`, severity: 'info', dataRef: 'best_session' });
  const worstSession = Object.entries(m.bySession).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (worstSession && worstSession[1].pnl < 0) insights.push({ type: 'session', title: `Worst Session: ${worstSession[0]}`, body: `${worstSession[0]} session has cost you ${formatCurrency(worstSession[1].pnl)}. Consider avoiding it or reviewing your trades there.`, severity: 'warning', dataRef: 'worst_session' });

  const bestInstrument = Object.entries(m.byInstrument).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestInstrument && bestInstrument[1].pnl > 0) insights.push({ type: 'instrument', title: `Best Instrument: ${bestInstrument[0]}`, body: `${bestInstrument[0]} is your most profitable instrument with ${formatCurrency(bestInstrument[1].pnl)} P&L.`, severity: 'info', dataRef: 'best_instrument' });
  const worstInstrument = Object.entries(m.byInstrument).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (worstInstrument && worstInstrument[1].pnl < 0) insights.push({ type: 'instrument', title: `Worst Instrument: ${worstInstrument[0]}`, body: `${worstInstrument[0]} has lost you ${formatCurrency(worstInstrument[1].pnl)}. Review or reduce trading this instrument.`, severity: 'warning', dataRef: 'worst_instrument' });

  if (m.maxLossStreak >= 5) insights.push({ type: 'discipline', title: 'Long Losing Streak', body: `You had a ${m.maxLossStreak}-trade losing streak. Consider reducing position size during drawdowns and taking breaks.`, severity: 'warning', dataRef: 'max_loss_streak' });

  if (ctx.mistakes.length > 0) {
    const topMistake = ctx.mistakes.sort((a, b) => b.frequency - a.frequency)[0];
    insights.push({ type: 'mistake', title: `Most Common Mistake: ${topMistake.name}`, body: `"${topMistake.name}" has occurred ${topMistake.frequency} times. ${topMistake.solution ? `Suggested fix: ${topMistake.solution}` : 'Review and add a prevention strategy.'}`, severity: topMistake.severity === 'critical' ? 'critical' : 'warning', dataRef: 'top_mistake' });
  }

  if (ctx.psychologyLogs.length > 0) {
    const latest = ctx.psychologyLogs[0];
    if (latest.discipline != null && latest.discipline < 5) insights.push({ type: 'psychology', title: 'Low Discipline Score', body: `Your latest discipline self-rating is ${latest.discipline}/10. Focus on following your trading plan and checklist before every trade.`, severity: 'warning', dataRef: 'discipline' });
    if (latest.fomo != null && latest.fomo > 6) insights.push({ type: 'psychology', title: 'High FOMO Detected', body: `Your latest FOMO rating is ${latest.fomo}/10. Wait for your setups to come to you — don't chase moves.`, severity: 'warning', dataRef: 'fomo' });
    if (latest.confidence >= 7) insights.push({ type: 'psychology', title: 'Strong Confidence', body: `Your confidence is at ${latest.confidence}/10. Use it to execute your plan, but stay disciplined.`, severity: 'success', dataRef: 'confidence' });
  }

  if (ctx.goals.length > 0) {
    const incomplete = ctx.goals.filter((g) => !g.completed);
    if (incomplete.length > 0) insights.push({ type: 'goal', title: `${incomplete.length} Goals In Progress`, body: `You have ${incomplete.length} incomplete goals. ${incomplete.map((g) => `${g.title} (${((g.current_value / g.target_value) * 100).toFixed(0)}%)`).join(', ')}.`, severity: 'info', dataRef: 'goals' });
  }

  if (ctx.habits.length > 0) {
    const active = ctx.habits.filter((h) => h.active);
    if (active.length > 0) insights.push({ type: 'habit', title: `${active.length} Active Habits`, body: `You're tracking ${active.length} habits: ${active.map((h) => h.name).join(', ')}.`, severity: 'info', dataRef: 'habits' });
  }

  insights.push({ type: 'summary', title: 'Trading Summary', body: `${m.totalTrades} trades | ${m.winRate.toFixed(1)}% win rate | ${formatCurrency(m.totalPnl)} P&L | PF ${m.profitFactor.toFixed(2)} | Avg RR ${m.avgRr.toFixed(2)}`, severity: m.totalPnl >= 0 ? 'success' : 'warning', dataRef: 'summary' });
  return insights;
}

export type AiScoreResult = { score: number; breakdown: Record<string, number> };

export function calculateTradingScore(ctx: AiContext): AiScoreResult {
  const m = ctx.metrics;
  if (m.totalTrades === 0) return { score: 0, breakdown: {} };
  const winRateScore = Math.min(m.winRate, 100);
  const profitFactorScore = Math.min(m.profitFactor * 40, 100);
  const pnlScore = m.totalPnl > 0 ? Math.min(60 + (m.totalPnl / 100), 100) : Math.max(40 + (m.totalPnl / 100), 0);
  const consistencyScore = m.maxLossStreak <= 3 ? 80 : Math.max(100 - m.maxLossStreak * 10, 20);
  const rrScore = Math.min(m.avgRr * 30, 100);
  const score = Math.round((winRateScore * 0.3 + profitFactorScore * 0.25 + pnlScore * 0.2 + consistencyScore * 0.15 + rrScore * 0.1));
  return { score, breakdown: { winRate: Math.round(winRateScore), profitFactor: Math.round(profitFactorScore), pnl: Math.round(pnlScore), consistency: Math.round(consistencyScore), rr: Math.round(rrScore) } };
}

export function calculatePsychologyScore(ctx: AiContext): AiScoreResult {
  if (ctx.psychologyLogs.length === 0) return { score: 0, breakdown: {} };
  const avg = (key: keyof PsychologyLog) => {
    const vals = ctx.psychologyLogs.map((l) => l[key]).filter((v): v is number => v != null) as number[];
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const confidence = avg('confidence');
  const discipline = avg('discipline');
  const stress = avg('stress_level');
  const fomo = avg('fomo');
  const patience = avg('patience');
  const score = Math.round(Math.max(0, Math.min(100, (confidence * 10 + (discipline || 5) * 10 + (patience || 5) * 10 - (stress || 3) * 5 - (fomo || 3) * 5) / 3)));
  return { score, breakdown: { confidence: Math.round(confidence * 10), discipline: Math.round((discipline || 5) * 10), stress: Math.round((stress || 3) * 10), fomo: Math.round((fomo || 3) * 10), patience: Math.round((patience || 5) * 10) } };
}

export function calculateDisciplineScore(ctx: AiContext): AiScoreResult {
  const m = ctx.metrics;
  let score = 50;
  const breakdown: Record<string, number> = {};
  if (m.maxLossStreak <= 3) { score += 20; breakdown['streakControl'] = 80; } else { score -= m.maxLossStreak * 3; breakdown['streakControl'] = Math.max(20, 80 - m.maxLossStreak * 10); }
  if (ctx.psychologyLogs.length > 0) {
    const avgDiscipline = ctx.psychologyLogs.reduce((s, l) => s + (l.discipline || 5), 0) / ctx.psychologyLogs.length;
    breakdown['selfDiscipline'] = Math.round(avgDiscipline * 10);
    score = (score + avgDiscipline * 10) / 2;
  }
  if (ctx.mistakes.length > 0) {
    const totalFreq = ctx.mistakes.reduce((s, mst) => s + mst.frequency, 0);
    breakdown['mistakeFrequency'] = Math.max(10, 100 - totalFreq * 5);
    score = (score + breakdown['mistakeFrequency']) / 2;
  }
  if (ctx.habits.length > 0) {
    const active = ctx.habits.filter((h) => h.active).length;
    breakdown['habitTracking'] = Math.min(active * 20, 100);
    score = (score + breakdown['habitTracking']) / 2;
  }
  return { score: Math.round(Math.max(0, Math.min(100, score))), breakdown };
}

export function generateRecommendations(ctx: AiContext): Omit<import('@/lib/supabase').AiRecommendation, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'action_taken' | 'dismissed'>[] {
  const recs: Omit<import('@/lib/supabase').AiRecommendation, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'action_taken' | 'dismissed'>[] = [];
  const m = ctx.metrics;
  if (m.totalTrades === 0) return recs;

  const worstSession = Object.entries(m.bySession).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (worstSession && worstSession[1].pnl < 0) recs.push({ category: 'risk', priority: 'high', title: `Avoid ${worstSession[0]} session`, body: `You've lost ${formatCurrency(worstSession[1].pnl)} in the ${worstSession[0]} session across ${worstSession[1].trades} trades. Consider reducing activity or avoiding this session entirely.`, dataRef: 'worst_session' });

  const worstInstrument = Object.entries(m.byInstrument).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (worstInstrument && worstInstrument[1].pnl < 0) recs.push({ category: 'strategy', priority: 'medium', title: `Review ${worstInstrument[0]} trades`, body: `${worstInstrument[0]} has lost you ${formatCurrency(worstInstrument[1].pnl)}. Review your last 5 trades on this instrument for patterns.`, dataRef: 'worst_instrument' });

  if (m.profitFactor < 1) recs.push({ category: 'risk', priority: 'critical', title: 'Improve risk-reward ratio', body: `Your profit factor is ${m.profitFactor.toFixed(2)}. Focus on cutting losses quickly and letting winners run to improve this above 1.5.`, dataRef: 'profit_factor' });

  if (m.avgRr < 1.5) recs.push({ category: 'risk', priority: 'medium', title: 'Target higher R:R', body: `Your average R:R is ${m.avgRr.toFixed(2)}. Aim for at least 1:2 by adjusting your take profit levels or being more selective with entries.`, dataRef: 'avg_rr' });

  if (ctx.psychologyLogs.length > 0) {
    const latest = ctx.psychologyLogs[0];
    if (latest.fomo != null && latest.fomo > 6) recs.push({ category: 'psychology', priority: 'high', title: 'Manage FOMO', body: `Your latest FOMO rating is ${latest.fomo}/10. Before entering a trade, confirm it meets your full checklist — don't chase price.`, dataRef: 'fomo' });
    if (latest.discipline != null && latest.discipline < 5) recs.push({ category: 'discipline', priority: 'high', title: 'Strengthen discipline', body: `Your discipline rating is ${latest.discipline}/10. Re-commit to your trading plan and use your pre-trade checklist on every trade.`, dataRef: 'discipline' });
  }

  if (ctx.mistakes.length > 0) {
    const top = ctx.mistakes.sort((a, b) => b.frequency - a.frequency)[0];
    recs.push({ category: 'discipline', priority: top.severity === 'critical' ? 'critical' : 'medium', title: `Fix: ${top.name}`, body: `"${top.name}" has occurred ${top.frequency} times. ${top.solution || 'Add this mistake to your pre-trade checklist to prevent it.'}`, dataRef: 'top_mistake' });
  }

  const incompleteGoals = ctx.goals.filter((g) => !g.completed);
  if (incompleteGoals.length > 0) recs.push({ category: 'goal', priority: 'low', title: `${incompleteGoals.length} goals need attention`, body: `Goals in progress: ${incompleteGoals.map((g) => g.title).join(', ')}. Review progress and adjust if needed.`, dataRef: 'goals' });

  if (m.maxLossStreak >= 4) recs.push({ category: 'psychology', priority: 'high', title: 'Take a break after losing streaks', body: `Your longest losing streak is ${m.maxLossStreak} trades. After 3 consecutive losses, step away for 24 hours to reset mentally.`, dataRef: 'max_loss_streak' });

  return recs;
}

export function reviewTrade(trade: Trade, ctx: AiContext): { summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[]; rating: number } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  const pnl = Number(trade.pnl);
  const rr = Number(trade.rr);
  if (pnl > 0) strengths.push(`Profitable trade with ${formatCurrency(pnl)} gain`);
  else weaknesses.push(`Lost ${formatCurrency(Math.abs(pnl))} on this trade`);
  if (rr >= 2) strengths.push(`Good risk-reward ratio of ${rr.toFixed(2)}`);
  else if (rr < 1 && rr > 0) weaknesses.push(`Low R:R of ${rr.toFixed(2)} — consider wider targets or tighter stops`);
  if (trade.confidence && trade.confidence >= 7) strengths.push(`High confidence (${trade.confidence}/10) entry`);
  if (trade.confidence && trade.confidence < 4) weaknesses.push(`Low confidence (${trade.confidence}/10) — consider only high-conviction setups`);
  if (trade.mistakes && trade.mistakes.length > 0) weaknesses.push(`Mistakes logged: ${trade.mistakes.join(', ')}`);
  if (trade.before_notes && trade.during_notes && trade.after_notes) strengths.push('Thoroughly journaled (before, during, and after notes)');
  else recommendations.push('Add before, during, and after notes to improve your journaling');
  if (trade.strategy_tags && trade.strategy_tags.length > 0) strengths.push(`Tagged with strategy: ${trade.strategy_tags.join(', ')}`);
  else recommendations.push('Tag this trade with a strategy to track performance by setup');
  if (trade.setup_type) strengths.push(`Setup type: ${trade.setup_type}`);
  if (trade.lessons_learned) strengths.push(`Lessons captured: ${trade.lessons_learned}`);
  if (pnl > 0 && rr >= 2) recommendations.push('This is your A+ setup pattern — look for more of these');
  if (pnl < 0) recommendations.push('Review what was different about this trade vs your winning trades');
  const rating = Math.max(1, Math.min(10, Math.round((pnl > 0 ? 6 : 3) + (rr >= 2 ? 2 : 0) + (trade.confidence && trade.confidence >= 7 ? 1 : 0) + (trade.mistakes && trade.mistakes.length === 0 ? 1 : 0))));
  const summary = `${trade.instrument} ${trade.direction} | ${trade.status} | P&L: ${formatCurrency(pnl)} | RR: ${rr.toFixed(2)} | ${trade.session || 'N/A'} session`;
  return { summary, strengths, weaknesses, recommendations, rating };
}

export function reviewPsychology(ctx: AiContext): { summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  if (ctx.psychologyLogs.length === 0) return { summary: 'No psychology logs yet. Start journaling your emotions to get AI psychology reviews.', strengths, weaknesses, recommendations };
  const avg = (key: keyof PsychologyLog) => {
    const vals = ctx.psychologyLogs.map((l) => l[key]).filter((v): v is number => v != null) as number[];
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const confidence = avg('confidence');
  const discipline = avg('discipline');
  const fomo = avg('fomo');
  const stress = avg('stress_level');
  const patience = avg('patience');
  if (confidence >= 7) strengths.push(`Strong confidence (${confidence.toFixed(1)}/10)`);
  else weaknesses.push(`Below-average confidence (${confidence.toFixed(1)}/10)`);
  if (discipline >= 7) strengths.push(`Good discipline (${discipline.toFixed(1)}/10)`);
  else { weaknesses.push(`Discipline needs work (${discipline.toFixed(1)}/10)`); recommendations.push('Use your pre-trade checklist on every entry to improve discipline'); }
  if (fomo > 6) { weaknesses.push(`High FOMO (${fomo.toFixed(1)}/10)`); recommendations.push('Wait for setups to come to you — set alerts instead of watching charts constantly'); }
  if (stress > 6) { weaknesses.push(`Elevated stress (${stress.toFixed(1)}/10)`); recommendations.push('Consider meditation or breathing exercises before trading sessions'); }
  if (patience >= 7) strengths.push(`Good patience (${patience.toFixed(1)}/10)`);
  if (ctx.mistakes.length > 3) recommendations.push(`You have ${ctx.mistakes.length} tracked mistakes — review your mistake library weekly`);
  const summary = `Based on ${ctx.psychologyLogs.length} psychology logs: confidence ${confidence.toFixed(1)}/10, discipline ${discipline.toFixed(1)}/10, FOMO ${fomo.toFixed(1)}/10, stress ${stress.toFixed(1)}/10`;
  return { summary, strengths, weaknesses, recommendations };
}

export function reviewGoals(ctx: AiContext): { summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  if (ctx.goals.length === 0) return { summary: 'No goals set yet. Create trading goals to get AI goal coaching.', strengths, weaknesses, recommendations };
  const completed = ctx.goals.filter((g) => g.completed);
  const incomplete = ctx.goals.filter((g) => !g.completed);
  if (completed.length > 0) strengths.push(`${completed.length} goal${completed.length === 1 ? '' : 's'} completed`);
  if (incomplete.length > 0) {
    weaknesses.push(`${incomplete.length} goal${incomplete.length === 1 ? '' : 's'} still in progress`);
    incomplete.forEach((g) => {
      const progress = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
      if (progress < 25) recommendations.push(`"${g.title}" is at ${progress.toFixed(0)}% — consider breaking it into smaller steps`);
      else if (g.deadline) {
        const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 7 && daysLeft > 0) recommendations.push(`"${g.title}" deadline in ${daysLeft} days — prioritize this goal`);
      }
    });
  }
  recommendations.push('Review your goals weekly and adjust targets based on your actual performance data');
  const summary = `${completed.length} completed, ${incomplete.length} in progress out of ${ctx.goals.length} total goals`;
  return { summary, strengths, weaknesses, recommendations };
}

export const CHAT_SUGGESTIONS = [
  'Review today\'s trades',
  'Review this week',
  'Review this month',
  'Show my biggest mistakes',
  'How is my discipline?',
  'How is my psychology?',
  'What should I improve?',
  'Compare this month vs last month',
  'Review my strategy',
  'Review my risk',
];

export function generateMemoryEntries(ctx: AiContext): Omit<AiMemory, 'id' | 'user_id' | 'workspace_id' | 'created_at'>[] {
  const entries: Omit<AiMemory, 'id' | 'user_id' | 'workspace_id' | 'created_at'>[] = [];
  const m = ctx.metrics;
  if (m.totalTrades === 0) return entries;
  const bestSession = Object.entries(m.bySession).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestSession && bestSession[1].trades >= 3) entries.push({ memory_type: 'preference', key: 'best_session', value: bestSession[0], source: 'analytics' });
  const bestInstrument = Object.entries(m.byInstrument).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  if (bestInstrument && bestInstrument[1].trades >= 3) entries.push({ memory_type: 'preference', key: 'best_instrument', value: bestInstrument[0], source: 'analytics' });
  const worstInstrument = Object.entries(m.byInstrument).sort((a, b) => a[1].pnl - b[1].pnl)[0];
  if (worstInstrument && worstInstrument[1].trades >= 3) entries.push({ memory_type: 'mistake', key: 'worst_instrument', value: worstInstrument[0], source: 'analytics' });
  if (m.winRate < 40) entries.push({ memory_type: 'style', key: 'trading_style', value: 'low win rate — needs tighter entry criteria', source: 'analytics' });
  if (m.avgRr < 1.5) entries.push({ memory_type: 'observation', key: 'rr_pattern', value: `average RR is ${m.avgRr.toFixed(2)} — below 1.5 target`, source: 'analytics' });
  if (ctx.strategies.length > 0) ctx.strategies.slice(0, 5).forEach((s) => entries.push({ memory_type: 'strategy', key: `strategy_${s.id.slice(0, 8)}`, value: `${s.name} (${s.category}, ${s.status})`, source: 'strategy_module' }));
  if (ctx.mistakes.length > 0) ctx.mistakes.slice(0, 3).forEach((mst) => entries.push({ memory_type: 'mistake', key: `mistake_${mst.id.slice(0, 8)}`, value: `${mst.name} (${mst.frequency}x)`, source: 'mistake_library' }));
  if (ctx.habits.length > 0) ctx.habits.filter((h) => h.active).slice(0, 5).forEach((h) => entries.push({ memory_type: 'habit', key: `habit_${h.id.slice(0, 8)}`, value: h.name, source: 'habit_tracker' }));
  if (ctx.goals.length > 0) ctx.goals.slice(0, 5).forEach((g) => entries.push({ memory_type: 'goal', key: `goal_${g.id.slice(0, 8)}`, value: `${g.title} (${g.completed ? 'done' : `${g.current_value}/${g.target_value}`})`, source: 'goals' }));
  return entries;
}
