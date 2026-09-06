import type { Trade, Strategy, PsychologyLog, TradingGoal, Habit, Mistake, RiskRules, DailyJournal } from './supabase';
import { computeMetrics, type Metrics } from './analytics';
import { formatCurrency } from './format';

export type Confidence = 'high' | 'medium' | 'low';

export type EvidenceRef = {
  type: 'trade' | 'journal' | 'metric' | 'psychology_log' | 'goal' | 'habit' | 'mistake' | 'strategy';
  ref_id: string;
  label: string;
  detail?: Record<string, unknown>;
};

export type BehaviorPattern = {
  pattern_type: string;
  title: string;
  description: string;
  confidence: Confidence;
  severity: 'info' | 'warning' | 'critical';
  occurrence_count: number;
  first_seen: string | null;
  last_seen: string | null;
  evidence: EvidenceRef[];
};

export type CorrelationResult = {
  dimension: string;
  label: string;
  finding: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
  data: { key: string; trades: number; pnl: number; winRate: number }[];
};

export type TraderProfileData = {
  trading_style: string;
  preferred_markets: string[];
  preferred_instruments: string[];
  preferred_sessions: string[];
  preferred_timeframes: string[];
  typical_risk_pct: number;
  typical_holding_minutes: number | null;
  strong_strategies: string[];
  weak_strategies: string[];
  common_mistakes: string[];
  psychological_patterns: string[];
  strengths: string[];
  weaknesses: string[];
  learning_priorities: string[];
};

export type ScoreComponent = {
  label: string;
  score: number;
  weight: number;
  explanation: string;
};

export type TradingScoreResult = {
  overall: number;
  components: ScoreComponent[];
  confidence: Confidence;
  explanation: string;
};

export type TimelineEvent = {
  event_type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  event_date: string;
  metric_value: number | null;
  previous_value: number | null;
  evidence: EvidenceRef[];
};

export type ComparisonResult = {
  label: string;
  dimension: string;
  a: { key: string; trades: number; pnl: number; winRate: number; profitFactor: number };
  b: { key: string; trades: number; pnl: number; winRate: number; profitFactor: number };
  finding: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
};

export type DailyIntelligence = {
  date: string;
  summary: string;
  activity: { trades: number; pnl: number; wins: number; losses: number };
  mistakes: string[];
  risk_behavior: string;
  psychology: string;
  strategy_execution: string;
  positive_behaviors: string[];
  areas_to_improve: string[];
  confidence: Confidence;
};

export type WeeklyIntelligence = {
  week: string;
  summary: string;
  performance: { trades: number; pnl: number; winRate: number; profitFactor: number };
  risk: string;
  psychology: string;
  strategy_execution: string;
  behavior: string[];
  mistakes: string[];
  improvements: string[];
  goals: string[];
  next_week_priorities: string[];
  confidence: Confidence;
};

function confidenceFromSample(size: number, threshold: { high: number; medium: number }): Confidence {
  if (size >= threshold.high) return 'high';
  if (size >= threshold.medium) return 'medium';
  return 'low';
}

function tradeEvidence(trade: Trade, label: string): EvidenceRef {
  return {
    type: 'trade',
    ref_id: trade.id,
    label: `${trade.instrument} ${trade.direction} | ${formatCurrency(Number(trade.pnl))} | ${trade.session || 'N/A'}`,
    detail: { pnl: Number(trade.pnl), rr: Number(trade.rr), instrument: trade.instrument, session: trade.session, date: trade.closed_at || trade.executed_at },
  };
}

export function detectBehaviorPatterns(
  trades: Trade[],
  psychologyLogs: PsychologyLog[],
  mistakes: Mistake[],
  riskRules: RiskRules | null,
): BehaviorPattern[] {
  const patterns: BehaviorPattern[] = [];
  const closed = trades.filter((t) => t.status === 'closed');
  const sorted = [...closed].sort((a, b) => new Date(a.closed_at || a.executed_at).getTime() - new Date(b.closed_at || b.executed_at).getTime());
  if (sorted.length < 5) return patterns;

  const conf = confidenceFromSample(sorted.length, { high: 30, medium: 10 });

  // 1. Revenge Trading: trades entered shortly after a loss with increased risk
  let revengeCount = 0;
  const revengeEvidence: EvidenceRef[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (Number(prev.pnl) < 0 && Number(curr.pnl) < 0) {
      const gap = new Date(curr.executed_at).getTime() - new Date(prev.closed_at || prev.executed_at).getTime();
      const gapMinutes = gap / (1000 * 60);
      if (gapMinutes < 30 && curr.risk_pct != null && prev.risk_pct != null && curr.risk_pct > prev.risk_pct) {
        revengeCount++;
        if (revengeEvidence.length < 5) revengeEvidence.push(tradeEvidence(curr, 'Revenge trade'));
      }
    }
  }
  if (revengeCount >= 2) {
    patterns.push({
      pattern_type: 'revenge_trading',
      title: 'Revenge Trading Detected',
      description: `After losses, you enter new trades within 30 minutes with increased risk ${revengeCount} times. This suggests emotional re-entry rather than planned execution.`,
      confidence: revengeCount >= 4 ? 'high' : 'medium',
      severity: 'critical',
      occurrence_count: revengeCount,
      first_seen: revengeEvidence[0]?.detail?.date as string || sorted[0].closed_at,
      last_seen: revengeEvidence[revengeEvidence.length - 1]?.detail?.date as string || sorted[sorted.length - 1].closed_at,
      evidence: revengeEvidence,
    });
  }

  // 2. FOMO: high confidence entries that resulted in losses
  let fomoCount = 0;
  const fomoEvidence: EvidenceRef[] = [];
  for (const t of sorted) {
    if (t.confidence != null && t.confidence >= 8 && Number(t.pnl) < 0) {
      fomoCount++;
      if (fomoEvidence.length < 5) fomoEvidence.push(tradeEvidence(t, 'High-confidence loss'));
    }
  }
  if (fomoCount >= 3) {
    patterns.push({
      pattern_type: 'fomo',
      title: 'FOMO Pattern',
      description: `${fomoCount} trades with confidence 8+ resulted in losses. High confidence before entry often signals FOMO rather than genuine conviction based on your setup criteria.`,
      confidence: fomoCount >= 6 ? 'high' : 'medium',
      severity: 'warning',
      occurrence_count: fomoCount,
      first_seen: null,
      last_seen: null,
      evidence: fomoEvidence,
    });
  }

  // 3. Overtrading: more trades than daily average or risk rules allow
  if (riskRules && riskRules.max_daily_trades > 0) {
    const byDay: Record<string, Trade[]> = {};
    for (const t of sorted) {
      const d = (t.closed_at || t.executed_at).split('T')[0];
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(t);
    }
    const overtradeDays = Object.entries(byDay).filter(([, ts]) => ts.length > riskRules.max_daily_trades);
    if (overtradeDays.length >= 2) {
      patterns.push({
        pattern_type: 'overtrading',
        title: 'Overtrading',
        description: `You exceeded your daily trade limit of ${riskRules.max_daily_trades} on ${overtradeDays.length} day(s). Overtrading often correlates with lower quality setups.`,
        confidence: overtradeDays.length >= 4 ? 'high' : 'medium',
        severity: 'warning',
        occurrence_count: overtradeDays.length,
        first_seen: overtradeDays[0][0],
        last_seen: overtradeDays[overtradeDays.length - 1][0],
        evidence: overtradeDays.slice(0, 3).flatMap(([, ts]) => ts.slice(0, 2).map((t) => tradeEvidence(t, 'Overtrade day'))),
      });
    }
  }

  // 4. Early Exits: trades that hit profit but have low R:R (exited before target)
  let earlyExitCount = 0;
  const earlyExitEvidence: EvidenceRef[] = [];
  for (const t of sorted) {
    if (Number(t.pnl) > 0 && Number(t.rr) < 1 && t.rr > 0) {
      earlyExitCount++;
      if (earlyExitEvidence.length < 5) earlyExitEvidence.push(tradeEvidence(t, 'Early exit'));
    }
  }
  if (earlyExitCount >= 3) {
    patterns.push({
      pattern_type: 'early_exit',
      title: 'Early Exits',
      description: `${earlyExitCount} profitable trades exited with R:R below 1:1. You may be cutting winners short — let your trades reach their planned targets.`,
      confidence: earlyExitCount >= 6 ? 'high' : 'medium',
      severity: 'warning',
      occurrence_count: earlyExitCount,
      first_seen: null,
      last_seen: null,
      evidence: earlyExitEvidence,
    });
  }

  // 5. Increasing Risk After Losses
  let riskIncreaseCount = 0;
  const riskIncreaseEvidence: EvidenceRef[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (Number(prev.pnl) < 0 && curr.risk_pct != null && prev.risk_pct != null && curr.risk_pct > prev.risk_pct * 1.3) {
      riskIncreaseCount++;
      if (riskIncreaseEvidence.length < 5) riskIncreaseEvidence.push(tradeEvidence(curr, 'Risk increase after loss'));
    }
  }
  if (riskIncreaseCount >= 2) {
    patterns.push({
      pattern_type: 'increasing_risk_after_loss',
      title: 'Increasing Risk After Losses',
      description: `After losing trades, you increased risk by 30%+ on ${riskIncreaseCount} occasions. This is a common pattern that amplifies drawdowns.`,
      confidence: riskIncreaseCount >= 4 ? 'high' : 'medium',
      severity: 'critical',
      occurrence_count: riskIncreaseCount,
      first_seen: null,
      last_seen: null,
      evidence: riskIncreaseEvidence,
    });
  }

  // 6. Breaking Rules: trades with mistakes logged
  if (mistakes.length > 0) {
    const totalMistakeFreq = mistakes.reduce((s, m) => s + m.frequency, 0);
    if (totalMistakeFreq >= 3) {
      patterns.push({
        pattern_type: 'breaking_rules',
        title: 'Rule Violations',
        description: `You have ${mistakes.length} tracked mistake types occurring ${totalMistakeFreq} total times. Your most frequent: ${mistakes.sort((a, b) => b.frequency - a.frequency)[0].name}.`,
        confidence: totalMistakeFreq >= 8 ? 'high' : 'medium',
        severity: 'warning',
        occurrence_count: totalMistakeFreq,
        first_seen: null,
        last_seen: null,
        evidence: mistakes.slice(0, 3).map((m) => ({ type: 'mistake' as const, ref_id: m.id, label: `${m.name} (${m.frequency}x)` })),
      });
    }
  }

  // 7. Trading Outside Preferred Sessions
  const metrics = computeMetrics(trades);
  const sessionEntries = Object.entries(metrics.bySession);
  if (sessionEntries.length >= 2) {
    const worstSession = sessionEntries.sort((a, b) => a[1].pnl - b[1].pnl)[0];
    if (worstSession[1].pnl < 0 && worstSession[1].trades >= 3) {
      patterns.push({
        pattern_type: 'trading_outside_session',
        title: `Underperforming in ${worstSession[0]} Session`,
        description: `You have ${worstSession[1].trades} trades in the ${worstSession[0]} session with ${formatCurrency(worstSession[1].pnl)} P&L. Consider avoiding this session or reviewing your approach there.`,
        confidence: worstSession[1].trades >= 8 ? 'high' : 'medium',
        severity: 'warning',
        occurrence_count: worstSession[1].trades,
        first_seen: null,
        last_seen: null,
        evidence: sorted.filter((t) => t.session === worstSession[0]).slice(0, 5).map((t) => tradeEvidence(t, `${worstSession[0]} session`)),
      });
    }
  }

  // 8. Repeated Mistakes from psychology logs
  if (psychologyLogs.length > 0) {
    const allViolations = psychologyLogs.flatMap((l) => l.rule_violations || []);
    if (allViolations.length >= 3) {
      const violationCounts: Record<string, number> = {};
      for (const v of allViolations) violationCounts[v] = (violationCounts[v] || 0) + 1;
      const topViolation = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0];
      patterns.push({
        pattern_type: 'repeated_mistakes',
        title: 'Repeated Rule Violations',
        description: `"${topViolation[0]}" violated ${topViolation[1]} times across your psychology logs. This is a recurring pattern that needs targeted intervention.`,
        confidence: topViolation[1] >= 5 ? 'high' : 'medium',
        severity: 'warning',
        occurrence_count: topViolation[1],
        first_seen: null,
        last_seen: null,
        evidence: psychologyLogs.filter((l) => (l.rule_violations || []).includes(topViolation[0])).slice(0, 3).map((l) => ({ type: 'psychology_log' as const, ref_id: l.id, label: `${l.log_date}: ${topViolation[0]}` })),
      });
    }
  }

  // 9. Chasing Losses: consecutive losing trades with increasing position sizes
  let chaseCount = 0;
  for (let i = 2; i < sorted.length; i++) {
    const prev2 = sorted[i - 2];
    const prev1 = sorted[i - 1];
    const curr = sorted[i];
    if (Number(prev2.pnl) < 0 && Number(prev1.pnl) < 0 && Number(curr.pnl) < 0 &&
      curr.quantity > prev1.quantity && prev1.quantity > prev2.quantity) {
      chaseCount++;
    }
  }
  if (chaseCount >= 1) {
    patterns.push({
      pattern_type: 'chasing_losses',
      title: 'Chasing Losses',
      description: `Detected ${chaseCount} instance(s) of increasing position size across 3+ consecutive losing trades. This behavior typically deepens drawdowns.`,
      confidence: chaseCount >= 3 ? 'high' : 'low',
      severity: 'critical',
      occurrence_count: chaseCount,
      first_seen: null,
      last_seen: null,
      evidence: [],
    });
  }

  return patterns;
}

export function analyzeCorrelations(
  trades: Trade[],
  strategies: Strategy[],
  psychologyLogs: PsychologyLog[],
): CorrelationResult[] {
  const results: CorrelationResult[] = [];
  const metrics = computeMetrics(trades);
  if (metrics.totalTrades < 5) return results;

  const conf = confidenceFromSample(metrics.totalTrades, { high: 30, medium: 10 });

  // Strategy × Performance
  if (strategies.length > 0 && Object.keys(metrics.byTag).length > 0) {
    const data = Object.entries(metrics.byTag).map(([key, val]) => ({ key, ...val }));
    const best = data.sort((a, b) => b.pnl - a.pnl)[0];
    const worst = data.sort((a, b) => a.pnl - b.pnl)[0];
    if (best && best.pnl > 0) {
      results.push({
        dimension: 'strategy',
        label: 'Strategy × Performance',
        finding: `Your best-performing strategy tag is "${best.key}" with ${formatCurrency(best.pnl)} across ${best.trades} trades (${best.winRate.toFixed(0)}% win rate).`,
        confidence: best.trades >= 8 ? 'high' : conf,
        evidence: trades.filter((t) => (t.strategy_tags || []).includes(best.key)).slice(0, 5).map((t) => tradeEvidence(t, best.key)),
        data,
      });
    }
    if (worst && worst.pnl < 0) {
      results.push({
        dimension: 'strategy',
        label: 'Strategy × Performance (Worst)',
        finding: `Your worst-performing strategy tag is "${worst.key}" with ${formatCurrency(worst.pnl)} across ${worst.trades} trades (${worst.winRate.toFixed(0)}% win rate).`,
        confidence: worst.trades >= 8 ? 'high' : conf,
        evidence: trades.filter((t) => (t.strategy_tags || []).includes(worst.key)).slice(0, 5).map((t) => tradeEvidence(t, worst.key)),
        data,
      });
    }
  }

  // Session × Performance
  const sessionData = Object.entries(metrics.bySession).map(([key, val]) => ({ key, ...val }));
  if (sessionData.length >= 2) {
    const best = sessionData.sort((a, b) => b.pnl - a.pnl)[0];
    const worst = sessionData.sort((a, b) => a.pnl - b.pnl)[0];
    results.push({
      dimension: 'session',
      label: 'Session × Performance',
      finding: `Best: ${best.key} (${formatCurrency(best.pnl)}, ${best.winRate.toFixed(0)}% WR). Worst: ${worst.key} (${formatCurrency(worst.pnl)}, ${worst.winRate.toFixed(0)}% WR).`,
      confidence: conf,
      evidence: trades.filter((t) => t.session === best.key).slice(0, 3).map((t) => tradeEvidence(t, `${best.key} session`)),
      data: sessionData,
    });
  }

  // Instrument × Performance
  const instrumentData = Object.entries(metrics.byInstrument).map(([key, val]) => ({ key, ...val }));
  if (instrumentData.length >= 2) {
    const best = instrumentData.sort((a, b) => b.pnl - a.pnl)[0];
    const worst = instrumentData.sort((a, b) => a.pnl - b.pnl)[0];
    results.push({
      dimension: 'instrument',
      label: 'Instrument × Performance',
      finding: `Best: ${best.key} (${formatCurrency(best.pnl)}). Worst: ${worst.key} (${formatCurrency(worst.pnl)}).`,
      confidence: conf,
      evidence: trades.filter((t) => t.instrument === best.key).slice(0, 3).map((t) => tradeEvidence(t, best.key)),
      data: instrumentData,
    });
  }

  // Day × Performance
  const dayData = Object.entries(metrics.byDayOfWeek).map(([key, val]) => ({ key, ...val }));
  if (dayData.length >= 2) {
    const best = dayData.sort((a, b) => b.pnl - a.pnl)[0];
    const worst = dayData.sort((a, b) => a.pnl - b.pnl)[0];
    results.push({
      dimension: 'day',
      label: 'Day of Week × Performance',
      finding: `Best: ${best.key} (${formatCurrency(best.pnl)}, ${best.winRate.toFixed(0)}% WR). Worst: ${worst.key} (${formatCurrency(worst.pnl)}, ${worst.winRate.toFixed(0)}% WR).`,
      confidence: conf,
      evidence: [],
      data: dayData,
    });
  }

  // Timeframe × Performance
  const tfData = Object.entries(metrics.byTimeframe).map(([key, val]) => ({ key, ...val }));
  if (tfData.length >= 2) {
    const best = tfData.sort((a, b) => b.pnl - a.pnl)[0];
    results.push({
      dimension: 'timeframe',
      label: 'Timeframe × Performance',
      finding: `Best timeframe: ${best.key} (${formatCurrency(best.pnl)}, ${best.winRate.toFixed(0)}% WR).`,
      confidence: conf,
      evidence: [],
      data: tfData,
    });
  }

  // Emotion × Performance
  const emotionMap: Record<string, { trades: number; pnl: number; wins: number }> = {};
  for (const t of trades.filter((t) => t.status === 'closed')) {
    for (const emo of t.emotions || []) {
      if (!emotionMap[emo]) emotionMap[emo] = { trades: 0, pnl: 0, wins: 0 };
      emotionMap[emo].trades++;
      emotionMap[emo].pnl += Number(t.pnl);
      if (Number(t.pnl) > 0) emotionMap[emo].wins++;
    }
  }
  const emotionData = Object.entries(emotionMap).map(([key, val]) => ({ key, ...val, winRate: val.trades > 0 ? (val.wins / val.trades) * 100 : 0 }));
  if (emotionData.length >= 2) {
    results.push({
      dimension: 'emotion',
      label: 'Emotion × Performance',
      finding: emotionData.sort((a, b) => b.pnl - a.pnl).map((e) => `${e.key}: ${formatCurrency(e.pnl)} (${e.winRate.toFixed(0)}% WR)`).join(', '),
      confidence: conf,
      evidence: [],
      data: emotionData,
    });
  }

  // Risk × Performance
  const riskBuckets: Record<string, { trades: number; pnl: number; wins: number }> = {};
  for (const t of trades.filter((t) => t.status === 'closed' && t.risk_pct != null)) {
    const bucket = t.risk_pct! <= 1 ? '0-1%' : t.risk_pct! <= 2 ? '1-2%' : t.risk_pct! <= 3 ? '2-3%' : '3%+';
    if (!riskBuckets[bucket]) riskBuckets[bucket] = { trades: 0, pnl: 0, wins: 0 };
    riskBuckets[bucket].trades++;
    riskBuckets[bucket].pnl += Number(t.pnl);
    if (Number(t.pnl) > 0) riskBuckets[bucket].wins++;
  }
  const riskData = Object.entries(riskBuckets).map(([key, val]) => ({ key, ...val, winRate: val.trades > 0 ? (val.wins / val.trades) * 100 : 0 }));
  if (riskData.length >= 2) {
    results.push({
      dimension: 'risk',
      label: 'Risk Level × Performance',
      finding: riskData.sort((a, b) => a.key.localeCompare(b.key)).map((r) => `${r.key}: ${formatCurrency(r.pnl)} (${r.winRate.toFixed(0)}% WR, ${r.trades} trades)`).join(', '),
      confidence: conf,
      evidence: [],
      data: riskData,
    });
  }

  return results;
}

export function buildTraderProfile(
  trades: Trade[],
  strategies: Strategy[],
  psychologyLogs: PsychologyLog[],
  mistakes: Mistake[],
  metrics: Metrics,
): TraderProfileData {
  const closed = trades.filter((t) => t.status === 'closed');
  const profile: TraderProfileData = {
    trading_style: 'Unknown',
    preferred_markets: [],
    preferred_instruments: [],
    preferred_sessions: [],
    preferred_timeframes: [],
    typical_risk_pct: 0,
    typical_holding_minutes: null,
    strong_strategies: [],
    weak_strategies: [],
    common_mistakes: [],
    psychological_patterns: [],
    strengths: [],
    weaknesses: [],
    learning_priorities: [],
  };

  if (closed.length === 0) return profile;

  // Trading style
  const winRate = metrics.winRate;
  const avgRr = metrics.avgRr;
  const avgHold = metrics.avgHoldTime;
  if (winRate >= 55 && avgRr >= 1.5) profile.trading_style = 'Quality-focused (high win rate, good R:R)';
  else if (winRate < 40 && avgRr >= 2) profile.trading_style = 'Sniper (low win rate, high R:R)';
  else if (winRate >= 50 && avgRr < 1.5) profile.trading_style = 'Scalper (moderate win rate, lower R:R)';
  else if (avgHold > 0 && avgHold < 60) profile.trading_style = 'Scalper (short holding times)';
  else if (avgHold > 240) profile.trading_style = 'Swing trader (longer holding times)';
  else profile.trading_style = 'Balanced';

  // Preferred markets
  const marketCounts: Record<string, number> = {};
  for (const t of closed) {
    const m = t.market || 'unknown';
    marketCounts[m] = (marketCounts[m] || 0) + 1;
  }
  profile.preferred_markets = Object.entries(marketCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  // Preferred instruments
  const instrumentCounts: Record<string, number> = {};
  for (const t of closed) instrumentCounts[t.instrument] = (instrumentCounts[t.instrument] || 0) + 1;
  profile.preferred_instruments = Object.entries(instrumentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

  // Preferred sessions
  const sessionCounts: Record<string, number> = {};
  for (const t of closed) {
    const s = t.session || 'other';
    sessionCounts[s] = (sessionCounts[s] || 0) + 1;
  }
  profile.preferred_sessions = Object.entries(sessionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  // Preferred timeframes
  const tfCounts: Record<string, number> = {};
  for (const t of closed) {
    const tf = t.timeframe || 'unknown';
    tfCounts[tf] = (tfCounts[tf] || 0) + 1;
  }
  profile.preferred_timeframes = Object.entries(tfCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  // Typical risk
  const riskTrades = closed.filter((t) => t.risk_pct != null);
  if (riskTrades.length > 0) {
    profile.typical_risk_pct = riskTrades.reduce((s, t) => s + (t.risk_pct || 0), 0) / riskTrades.length;
  }

  // Typical holding time
  profile.typical_holding_minutes = metrics.avgHoldTime > 0 ? Math.round(metrics.avgHoldTime) : null;

  // Strong/weak strategies
  const tagPerf: Record<string, { pnl: number; trades: number }> = {};
  for (const t of closed) {
    for (const tag of t.strategy_tags || []) {
      if (!tagPerf[tag]) tagPerf[tag] = { pnl: 0, trades: 0 };
      tagPerf[tag].pnl += Number(t.pnl);
      tagPerf[tag].trades++;
    }
  }
  const sortedTags = Object.entries(tagPerf).sort((a, b) => b[1].pnl - a[1].pnl);
  profile.strong_strategies = sortedTags.filter(([, v]) => v.pnl > 0 && v.trades >= 2).slice(0, 3).map(([k]) => k);
  profile.weak_strategies = sortedTags.filter(([, v]) => v.pnl < 0 && v.trades >= 2).slice(-3).map(([k]) => k);

  // Common mistakes
  profile.common_mistakes = mistakes.sort((a, b) => b.frequency - a.frequency).slice(0, 5).map((m) => m.name);

  // Psychological patterns
  if (psychologyLogs.length > 0) {
    const avg = (key: keyof PsychologyLog) => {
      const vals = psychologyLogs.map((l) => l[key]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const fomo = avg('fomo');
    const discipline = avg('discipline');
    const confidence = avg('confidence');
    if (fomo > 5) profile.psychological_patterns.push('High FOMO tendency');
    if (discipline < 5) profile.psychological_patterns.push('Low discipline self-rating');
    if (confidence < 5) profile.psychological_patterns.push('Low confidence');
    if (discipline >= 7) profile.psychological_patterns.push('Strong discipline');
    if (confidence >= 7) profile.psychological_patterns.push('High confidence');
  }

  // Strengths
  if (metrics.winRate >= 55) profile.strengths.push(`Win rate of ${metrics.winRate.toFixed(0)}%`);
  if (metrics.profitFactor >= 1.5) profile.strengths.push(`Profit factor of ${metrics.profitFactor.toFixed(2)}`);
  if (metrics.avgRr >= 2) profile.strengths.push(`Average R:R of ${metrics.avgRr.toFixed(2)}`);
  if (metrics.maxLossStreak <= 3) profile.strengths.push('Controlled losing streaks');
  if (profile.preferred_sessions.length > 0) profile.strengths.push(`Strong in ${profile.preferred_sessions[0]} session`);

  // Weaknesses
  if (metrics.winRate < 40) profile.weaknesses.push(`Low win rate (${metrics.winRate.toFixed(0)}%)`);
  if (metrics.profitFactor < 1) profile.weaknesses.push(`Negative profit factor (${metrics.profitFactor.toFixed(2)})`);
  if (metrics.avgRr < 1.5) profile.weaknesses.push(`Low average R:R (${metrics.avgRr.toFixed(2)})`);
  if (metrics.maxLossStreak >= 5) profile.weaknesses.push(`Long losing streaks (${metrics.maxLossStreak} max)`);
  if (profile.weak_strategies.length > 0) profile.weaknesses.push(`Underperforming in: ${profile.weak_strategies.join(', ')}`);

  // Learning priorities
  if (metrics.winRate < 50) profile.learning_priorities.push('Improve entry selectivity');
  if (metrics.avgRr < 1.5) profile.learning_priorities.push('Target higher R:R ratios');
  if (metrics.maxLossStreak >= 4) profile.learning_priorities.push('Develop loss-streak management protocols');
  if (mistakes.length > 3) profile.learning_priorities.push('Reduce recurring mistakes');
  if (profile.psychological_patterns.includes('High FOMO tendency')) profile.learning_priorities.push('Manage FOMO with alerts and patience');
  if (profile.psychological_patterns.includes('Low discipline self-rating')) profile.learning_priorities.push('Strengthen pre-trade checklist usage');
  if (profile.learning_priorities.length === 0) profile.learning_priorities.push('Continue refining your edge');

  return profile;
}

export function calculateCompositeScore(
  trades: Trade[],
  psychologyLogs: PsychologyLog[],
  mistakes: Mistake[],
  goals: TradingGoal[],
  habits: Habit[],
  metrics: Metrics,
): TradingScoreResult {
  if (metrics.totalTrades === 0) {
    return { overall: 0, components: [], confidence: 'low', explanation: 'No trades to score.' };
  }

  const components: ScoreComponent[] = [];
  const conf = confidenceFromSample(metrics.totalTrades, { high: 30, medium: 10 });

  // Risk Management (25%)
  const riskScore = Math.min(metrics.profitFactor * 40, 100);
  components.push({
    label: 'Risk Management',
    score: Math.round(riskScore),
    weight: 0.25,
    explanation: `Profit factor: ${metrics.profitFactor.toFixed(2)}. ${riskScore >= 60 ? 'Your risk management is solid.' : 'Risk management needs improvement.'}`,
  });

  // Discipline (20%)
  let disciplineScore = 50;
  if (metrics.maxLossStreak <= 3) disciplineScore += 30;
  else disciplineScore -= (metrics.maxLossStreak - 3) * 10;
  if (mistakes.length > 0) {
    const totalFreq = mistakes.reduce((s, m) => s + m.frequency, 0);
    disciplineScore = (disciplineScore + Math.max(20, 100 - totalFreq * 5)) / 2;
  }
  if (psychologyLogs.length > 0) {
    const avgDisc = psychologyLogs.reduce((s, l) => s + (l.discipline || 5), 0) / psychologyLogs.length;
    disciplineScore = (disciplineScore + avgDisc * 10) / 2;
  }
  disciplineScore = Math.max(0, Math.min(100, disciplineScore));
  components.push({
    label: 'Discipline',
    score: Math.round(disciplineScore),
    weight: 0.2,
    explanation: `Based on losing streaks (${metrics.maxLossStreak} max), mistake frequency (${mistakes.reduce((s, m) => s + m.frequency, 0)} total), and self-rated discipline.`,
  });

  // Strategy Execution (20%)
  const strategyScore = Math.min(metrics.winRate, 100);
  components.push({
    label: 'Strategy Execution',
    score: Math.round(strategyScore),
    weight: 0.2,
    explanation: `Win rate: ${metrics.winRate.toFixed(1)}%. ${strategyScore >= 55 ? 'Your strategy is well-executed.' : 'Your entry criteria may need tightening.'}`,
  });

  // Psychology (15%)
  let psychScore = 50;
  if (psychologyLogs.length > 0) {
    const avg = (key: keyof PsychologyLog) => {
      const vals = psychologyLogs.map((l) => l[key]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
    };
    psychScore = (avg('confidence') * 10 + (avg('discipline') || 5) * 10 + (avg('patience') || 5) * 10 - (avg('fomo') || 3) * 5) / 2.5;
    psychScore = Math.max(0, Math.min(100, psychScore));
  }
  components.push({
    label: 'Psychology',
    score: Math.round(psychScore),
    weight: 0.15,
    explanation: psychologyLogs.length > 0
      ? `Based on ${psychologyLogs.length} psychology logs. Confidence, discipline, patience, and FOMO ratings.`
      : 'No psychology logs yet. Start journaling emotions for a psychology score.',
  });

  // Consistency (10%)
  const consistencyScore = metrics.maxLossStreak <= 3 ? 80 : Math.max(20, 100 - metrics.maxLossStreak * 10);
  components.push({
    label: 'Consistency',
    score: Math.round(consistencyScore),
    weight: 0.1,
    explanation: `Max losing streak: ${metrics.maxLossStreak}. ${consistencyScore >= 60 ? 'You maintain consistency well.' : 'Work on reducing losing streaks.'}`,
  });

  // Journal Completion (5%)
  const journaled = trades.filter((t) => t.before_notes || t.during_notes || t.after_notes).length;
  const journalScore = trades.length > 0 ? (journaled / trades.length) * 100 : 0;
  components.push({
    label: 'Journal Completion',
    score: Math.round(journalScore),
    weight: 0.05,
    explanation: `${journaled} of ${trades.length} trades have journal notes (${journalScore.toFixed(0)}%).`,
  });

  // Rule Following (5%)
  let ruleScore = 70;
  if (mistakes.length > 0) {
    const criticalMistakes = mistakes.filter((m) => m.severity === 'critical').length;
    ruleScore = Math.max(20, 100 - (mistakes.reduce((s, m) => s + m.frequency, 0) * 3) - criticalMistakes * 10);
  }
  components.push({
    label: 'Rule Following',
    score: Math.round(ruleScore),
    weight: 0.05,
    explanation: `Based on ${mistakes.length} tracked mistake types and their severity.`,
  });

  const overall = Math.round(components.reduce((sum, c) => sum + c.score * c.weight, 0));
  const explanation = `Overall score of ${overall}/100 based on ${metrics.totalTrades} trades. ` +
    components.map((c) => `${c.label}: ${c.score} (${(c.weight * 100).toFixed(0)}%)`).join(', ') + '. ' +
    (overall >= 70 ? 'Strong overall performance.' : overall >= 50 ? 'Average performance with room for improvement.' : 'Significant improvement needed.');

  return { overall, components, confidence: conf, explanation };
}

export function generateBehaviorTimeline(
  trades: Trade[],
  psychologyLogs: PsychologyLog[],
  metrics: Metrics,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const closed = trades.filter((t) => t.status === 'closed');
  if (closed.length < 3) return events;

  const sorted = [...closed].sort((a, b) => new Date(a.closed_at || a.executed_at).getTime() - new Date(b.closed_at || b.executed_at).getTime());

  // Detect losing streaks
  let streak = 0;
  let streakStart: Trade | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (Number(t.pnl) < 0) {
      if (streak === 0) streakStart = t;
      streak++;
    } else {
      if (streak >= 3 && streakStart) {
        const loss = sorted.slice(i - streak, i).reduce((s, tr) => s + Number(tr.pnl), 0);
        events.push({
          event_type: 'streak_change',
          title: `${streak}-Trade Losing Streak`,
          description: `Lost ${formatCurrency(Math.abs(loss))} over ${streak} consecutive trades. Consider reviewing your approach during this period.`,
          severity: streak >= 5 ? 'critical' : 'warning',
          event_date: (streakStart.closed_at || streakStart.executed_at).split('T')[0],
          metric_value: loss,
          previous_value: null,
          evidence: sorted.slice(i - streak, i).slice(0, 5).map((t) => tradeEvidence(t, 'Streak trade')),
        });
      }
      streak = 0;
    }
  }

  // Detect risk changes
  const riskTrades = sorted.filter((t) => t.risk_pct != null);
  if (riskTrades.length >= 4) {
    for (let i = 1; i < riskTrades.length; i++) {
      const prev = riskTrades[i - 1];
      const curr = riskTrades[i];
      if (curr.risk_pct! > prev.risk_pct! * 1.5 && Number(prev.pnl) < 0) {
        events.push({
          event_type: 'risk_change',
          title: 'Risk Increased After Loss',
          description: `Risk increased from ${prev.risk_pct}% to ${curr.risk_pct}% after a losing trade.`,
          severity: 'warning',
          event_date: (curr.closed_at || curr.executed_at).split('T')[0],
          metric_value: curr.risk_pct!,
          previous_value: prev.risk_pct!,
          evidence: [tradeEvidence(prev, 'Previous loss'), tradeEvidence(curr, 'Increased risk')],
        });
      }
    }
  }

  // Detect psychology shifts
  if (psychologyLogs.length >= 2) {
    const sortedPsych = [...psychologyLogs].sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
    for (let i = 1; i < sortedPsych.length; i++) {
      const prev = sortedPsych[i - 1];
      const curr = sortedPsych[i];
      if (prev.discipline != null && curr.discipline != null && curr.discipline < prev.discipline - 3) {
        events.push({
          event_type: 'psychology_change',
          title: 'Discipline Drop',
          description: `Self-rated discipline dropped from ${prev.discipline} to ${curr.discipline} between ${prev.log_date} and ${curr.log_date}.`,
          severity: 'warning',
          event_date: curr.log_date,
          metric_value: curr.discipline,
          previous_value: prev.discipline,
          evidence: [
            { type: 'psychology_log', ref_id: prev.id, label: `${prev.log_date}: discipline ${prev.discipline}` },
            { type: 'psychology_log', ref_id: curr.id, label: `${curr.log_date}: discipline ${curr.discipline}` },
          ],
        });
      }
      if (prev.fomo != null && curr.fomo != null && curr.fomo > prev.fomo + 3) {
        events.push({
          event_type: 'psychology_change',
          title: 'FOMO Spike',
          description: `FOMO rating increased from ${prev.fomo} to ${curr.fomo} between ${prev.log_date} and ${curr.log_date}.`,
          severity: 'warning',
          event_date: curr.log_date,
          metric_value: curr.fomo,
          previous_value: prev.fomo,
          evidence: [
            { type: 'psychology_log', ref_id: prev.id, label: `${prev.log_date}: FOMO ${prev.fomo}` },
            { type: 'psychology_log', ref_id: curr.id, label: `${curr.log_date}: FOMO ${curr.fomo}` },
          ],
        });
      }
    }
  }

  // Detect performance milestones
  if (metrics.largestWinTrade) {
    events.push({
      event_type: 'milestone',
      title: 'Largest Win',
      description: `Biggest winning trade: ${formatCurrency(Number(metrics.largestWinTrade.pnl))} on ${metrics.largestWinTrade.instrument}.`,
      severity: 'success',
      event_date: (metrics.largestWinTrade.closed_at || metrics.largestWinTrade.executed_at).split('T')[0],
      metric_value: Number(metrics.largestWinTrade.pnl),
      previous_value: null,
      evidence: [tradeEvidence(metrics.largestWinTrade, 'Largest win')],
    });
  }
  if (metrics.largestLossTrade) {
    events.push({
      event_type: 'milestone',
      title: 'Largest Loss',
      description: `Biggest losing trade: ${formatCurrency(Number(metrics.largestLossTrade.pnl))} on ${metrics.largestLossTrade.instrument}.`,
      severity: 'critical',
      event_date: (metrics.largestLossTrade.closed_at || metrics.largestLossTrade.executed_at).split('T')[0],
      metric_value: Number(metrics.largestLossTrade.pnl),
      previous_value: null,
      evidence: [tradeEvidence(metrics.largestLossTrade, 'Largest loss')],
    });
  }

  // Drawdown events from equity curve
  const equity = metrics.equity;
  if (equity.length >= 3) {
    let peak = equity[0].cumulative;
    for (const point of equity) {
      if (point.cumulative > peak) peak = point.cumulative;
      const drawdown = peak - point.cumulative;
      if (drawdown > 0 && point.pnl < 0 && drawdown > Math.abs(metrics.avgLoss) * 3) {
        events.push({
          event_type: 'drawdown_change',
          title: 'Significant Drawdown',
          description: `Drawdown of ${formatCurrency(drawdown)} from peak. Current balance: ${formatCurrency(point.cumulative)}.`,
          severity: drawdown > Math.abs(metrics.avgLoss) * 5 ? 'critical' : 'warning',
          event_date: point.date,
          metric_value: drawdown,
          previous_value: peak,
          evidence: [],
        });
      }
    }
  }

  // Sort by date descending
  return events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
}

export function generateComparisons(
  trades: Trade[],
  metrics: Metrics,
): ComparisonResult[] {
  const comparisons: ComparisonResult[] = [];
  const closed = trades.filter((t) => t.status === 'closed');
  if (closed.length < 5) return comparisons;

  const conf = confidenceFromSample(closed.length, { high: 30, medium: 10 });

  // Month vs Month
  const monthly = metrics.monthlyPnl;
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    const lastTrades = closed.filter((t) => {
      const d = new Date(t.closed_at || t.executed_at);
      const key = `${d.getFullYear()}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
      return key === last.month;
    });
    const prevTrades = closed.filter((t) => {
      const d = new Date(t.closed_at || t.executed_at);
      const key = `${d.getFullYear()}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
      return key === prev.month;
    });
    const lastWins = lastTrades.filter((t) => Number(t.pnl) > 0).length;
    const prevWins = prevTrades.filter((t) => Number(t.pnl) > 0).length;
    const lastPF = lastTrades.filter((t) => Number(t.pnl) > 0).reduce((s, t) => s + Number(t.pnl), 0) / Math.max(1, Math.abs(lastTrades.filter((t) => Number(t.pnl) < 0).reduce((s, t) => s + Number(t.pnl), 0)));
    const prevPF = prevTrades.filter((t) => Number(t.pnl) > 0).reduce((s, t) => s + Number(t.pnl), 0) / Math.max(1, Math.abs(prevTrades.filter((t) => Number(t.pnl) < 0).reduce((s, t) => s + Number(t.pnl), 0)));
    const finding = last.pnl > prev.pnl
      ? `${last.month} improved by ${formatCurrency(last.pnl - prev.pnl)} vs ${prev.month}.`
      : `${last.month} declined by ${formatCurrency(prev.pnl - last.pnl)} vs ${prev.month}.`;
    comparisons.push({
      label: `${last.month} vs ${prev.month}`,
      dimension: 'month',
      a: { key: last.month, trades: lastTrades.length, pnl: last.pnl, winRate: lastTrades.length > 0 ? (lastWins / lastTrades.length) * 100 : 0, profitFactor: lastPF },
      b: { key: prev.month, trades: prevTrades.length, pnl: prev.pnl, winRate: prevTrades.length > 0 ? (prevWins / prevTrades.length) * 100 : 0, profitFactor: prevPF },
      finding,
      confidence: conf,
      evidence: lastTrades.slice(0, 3).map((t) => tradeEvidence(t, last.month)),
    });
  }

  // Profitable vs Losing trades
  const profitable = closed.filter((t) => Number(t.pnl) > 0);
  const losing = closed.filter((t) => Number(t.pnl) < 0);
  if (profitable.length >= 2 && losing.length >= 2) {
    const profMetrics = computeMetrics(profitable);
    const lossMetrics = computeMetrics(losing);
    comparisons.push({
      label: 'Profitable vs Losing Trades',
      dimension: 'outcome',
      a: { key: 'Profitable', trades: profitable.length, pnl: profMetrics.totalPnl, winRate: 100, profitFactor: Infinity },
      b: { key: 'Losing', trades: losing.length, pnl: lossMetrics.totalPnl, winRate: 0, profitFactor: 0 },
      finding: `Profitable trades average ${formatCurrency(profMetrics.avgWin)} vs losing trades averaging ${formatCurrency(lossMetrics.avgLoss)}. Ratio: ${(profMetrics.avgWin / Math.max(1, lossMetrics.avgLoss)).toFixed(2)}:1.`,
      confidence: conf,
      evidence: [...profitable.slice(0, 2), ...losing.slice(0, 2)].map((t) => tradeEvidence(t, Number(t.pnl) > 0 ? 'Win' : 'Loss')),
    });
  }

  // Long vs Short
  if (metrics.byDirection.long.trades >= 2 && metrics.byDirection.short.trades >= 2) {
    comparisons.push({
      label: 'Long vs Short',
      dimension: 'direction',
      a: { key: 'Long', trades: metrics.byDirection.long.trades, pnl: metrics.byDirection.long.pnl, winRate: metrics.byDirection.long.winRate, profitFactor: 0 },
      b: { key: 'Short', trades: metrics.byDirection.short.trades, pnl: metrics.byDirection.short.pnl, winRate: metrics.byDirection.short.winRate, profitFactor: 0 },
      finding: metrics.byDirection.long.pnl > metrics.byDirection.short.pnl
        ? 'Long positions outperform short positions.'
        : 'Short positions outperform long positions.',
      confidence: conf,
      evidence: [],
    });
  }

  // Best vs Worst session
  const sessionEntries = Object.entries(metrics.bySession);
  if (sessionEntries.length >= 2) {
    const sorted = sessionEntries.sort((a, b) => b[1].pnl - a[1].pnl);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    comparisons.push({
      label: `${best[0]} vs ${worst[0]} Session`,
      dimension: 'session',
      a: { key: best[0], trades: best[1].trades, pnl: best[1].pnl, winRate: best[1].winRate, profitFactor: 0 },
      b: { key: worst[0], trades: worst[1].trades, pnl: worst[1].pnl, winRate: worst[1].winRate, profitFactor: 0 },
      finding: `${best[0]} session generates ${formatCurrency(best[1].pnl - worst[1].pnl)} more than ${worst[0]} session.`,
      confidence: conf,
      evidence: [],
    });
  }

  return comparisons;
}

export function generateDailyIntelligence(
  trades: Trade[],
  psychologyLogs: PsychologyLog[],
  mistakes: Mistake[],
  date?: string,
): DailyIntelligence | null {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const dayTrades = trades.filter((t) => {
    const d = (t.closed_at || t.executed_at).split('T')[0];
    return d === targetDate && t.status === 'closed';
  });

  if (dayTrades.length === 0) {
    return {
      date: targetDate,
      summary: 'No trading activity today.',
      activity: { trades: 0, pnl: 0, wins: 0, losses: 0 },
      mistakes: [],
      risk_behavior: 'No risk data for today.',
      psychology: 'No psychology log for today.',
      strategy_execution: 'No strategy execution data.',
      positive_behaviors: [],
      areas_to_improve: [],
      confidence: 'low',
    };
  }

  const pnl = dayTrades.reduce((s, t) => s + Number(t.pnl), 0);
  const wins = dayTrades.filter((t) => Number(t.pnl) > 0).length;
  const losses = dayTrades.filter((t) => Number(t.pnl) < 0).length;
  const dayMistakes = dayTrades.flatMap((t) => t.mistakes || []);
  const avgRisk = dayTrades.filter((t) => t.risk_pct != null).reduce((s, t) => s + (t.risk_pct || 0), 0) / Math.max(1, dayTrades.filter((t) => t.risk_pct != null).length);
  const psychLog = psychologyLogs.find((l) => l.log_date === targetDate);

  const positive: string[] = [];
  const improve: string[] = [];

  if (pnl > 0) positive.push(`Profitable day with ${formatCurrency(pnl)} gain`);
  if (wins > losses) positive.push(`Win rate of ${((wins / dayTrades.length) * 100).toFixed(0)}%`);
  if (dayMistakes.length === 0 && dayTrades.length > 0) positive.push('No mistakes logged');
  if (dayTrades.every((t) => t.before_notes && t.after_notes)) positive.push('All trades journaled');

  if (pnl < 0) improve.push(`Lost ${formatCurrency(Math.abs(pnl))} today`);
  if (losses > wins) improve.push(`More losses (${losses}) than wins (${wins})`);
  if (dayMistakes.length > 0) improve.push(`${dayMistakes.length} mistake(s): ${[...new Set(dayMistakes)].join(', ')}`);
  if (avgRisk > 2) improve.push(`Average risk of ${avgRisk.toFixed(1)}% — consider reducing`);
  if (!dayTrades.some((t) => t.before_notes)) improve.push('Add pre-trade notes for better journaling');

  return {
    date: targetDate,
    summary: `${dayTrades.length} trade(s) | ${formatCurrency(pnl)} P&L | ${wins}W / ${losses}L`,
    activity: { trades: dayTrades.length, pnl, wins, losses },
    mistakes: [...new Set(dayMistakes)],
    risk_behavior: avgRisk > 0 ? `Average risk: ${avgRisk.toFixed(1)}% per trade` : 'No risk data',
    psychology: psychLog ? `Confidence: ${psychLog.confidence}/10, Discipline: ${psychLog.discipline || 'N/A'}/10` : 'No psychology log',
    strategy_execution: dayTrades.filter((t) => t.strategy_tags && t.strategy_tags.length > 0).length > 0
      ? `${dayTrades.filter((t) => t.strategy_tags && t.strategy_tags.length > 0).length}/${dayTrades.length} trades tagged with strategy`
      : 'No strategy tags on trades',
    positive_behaviors: positive,
    areas_to_improve: improve,
    confidence: dayTrades.length >= 3 ? 'high' : 'medium',
  };
}

export function generateWeeklyIntelligence(
  trades: Trade[],
  psychologyLogs: PsychologyLog[],
  mistakes: Mistake[],
  goals: TradingGoal[],
  metrics: Metrics,
): WeeklyIntelligence | null {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const weekTrades = trades.filter((t) => {
    const d = new Date(t.closed_at || t.executed_at);
    return d >= weekStart && t.status === 'closed';
  });

  const weekKey = `${weekStart.toISOString().split('T')[0]} → ${now.toISOString().split('T')[0]}`;
  if (weekTrades.length === 0) {
    return {
      week: weekKey,
      summary: 'No trading activity this week.',
      performance: { trades: 0, pnl: 0, winRate: 0, profitFactor: 0 },
      risk: 'No risk data for the week.',
      psychology: 'No psychology logs this week.',
      strategy_execution: 'No strategy execution data.',
      behavior: [],
      mistakes: [],
      improvements: [],
      goals: [],
      next_week_priorities: [],
      confidence: 'low',
    };
  }

  const pnl = weekTrades.reduce((s, t) => s + Number(t.pnl), 0);
  const wins = weekTrades.filter((t) => Number(t.pnl) > 0).length;
  const losses = weekTrades.filter((t) => Number(t.pnl) < 0).length;
  const winRate = (wins / weekTrades.length) * 100;
  const grossProfit = weekTrades.filter((t) => Number(t.pnl) > 0).reduce((s, t) => s + Number(t.pnl), 0);
  const grossLoss = Math.abs(weekTrades.filter((t) => Number(t.pnl) < 0).reduce((s, t) => s + Number(t.pnl), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const weekMistakes = weekTrades.flatMap((t) => t.mistakes || []);
  const avgRisk = weekTrades.filter((t) => t.risk_pct != null).reduce((s, t) => s + (t.risk_pct || 0), 0) / Math.max(1, weekTrades.filter((t) => t.risk_pct != null).length);
  const weekPsych = psychologyLogs.filter((l) => new Date(l.log_date) >= weekStart);

  const behavior: string[] = [];
  if (weekTrades.length > 10) behavior.push(`High trade frequency: ${weekTrades.length} trades this week`);
  if (losses > wins * 2) behavior.push('Loss-dominant week — review your approach');
  if (weekMistakes.length > 3) behavior.push(`${weekMistakes.length} mistakes logged`);

  const improvements: string[] = [];
  if (winRate < 50) improvements.push('Focus on A+ setups only');
  if (avgRisk > 2) improvements.push('Reduce risk per trade to under 2%');
  if (weekMistakes.length > 0) improvements.push('Review and prevent recurring mistakes');
  if (improvements.length === 0) improvements.push('Maintain your current approach');

  const goalNotes = goals.filter((g) => !g.completed).map((g) => `${g.title} (${((g.current_value / g.target_value) * 100).toFixed(0)}%)`);

  const nextWeek: string[] = [];
  if (pnl < 0) nextWeek.push('Review losing trades and identify patterns');
  if (winRate < 50) nextWeek.push('Tighten entry criteria');
  if (avgRisk > 2) nextWeek.push('Reduce position sizing');
  nextWeek.push('Journal every trade with before and after notes');
  if (goals.some((g) => !g.completed)) nextWeek.push('Review goal progress');

  return {
    week: weekKey,
    summary: `${weekTrades.length} trades | ${formatCurrency(pnl)} P&L | ${winRate.toFixed(0)}% WR | PF ${profitFactor.toFixed(2)}`,
    performance: { trades: weekTrades.length, pnl, winRate, profitFactor },
    risk: avgRisk > 0 ? `Average risk: ${avgRisk.toFixed(1)}% per trade` : 'No risk data',
    psychology: weekPsych.length > 0
      ? `${weekPsych.length} psychology log(s). Avg confidence: ${(weekPsych.reduce((s, l) => s + l.confidence, 0) / weekPsych.length).toFixed(1)}/10`
      : 'No psychology logs this week',
    strategy_execution: `${weekTrades.filter((t) => t.strategy_tags && t.strategy_tags.length > 0).length}/${weekTrades.length} trades tagged with strategy`,
    behavior,
    mistakes: [...new Set(weekMistakes)],
    improvements,
    goals: goalNotes,
    next_week_priorities: nextWeek,
    confidence: weekTrades.length >= 5 ? 'high' : 'medium',
  };
}
