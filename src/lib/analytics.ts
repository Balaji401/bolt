import type { Trade } from './supabase';

export type Metrics = {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  avgRr: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldTime: number;
  totalWins: number;
  totalLosses: number;
  breakeven: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: number;
  avgConfidence: number;
  bySession: Record<string, { trades: number; pnl: number; winRate: number }>;
  byDirection: { long: { trades: number; pnl: number }; short: { trades: number; pnl: number } };
  byInstrument: Record<string, { trades: number; pnl: number; winRate: number }>;
  byTag: Record<string, { trades: number; pnl: number; winRate: number }>;
  byDay: Record<string, { trades: number; pnl: number }>;
  equity: { date: string; cumulative: number }[];
  dailyPnl: { date: string; pnl: number }[];
  recentTrades: Trade[];
  largestWin: Trade | null;
  largestLoss: Trade | null;
};

export function computeMetrics(trades: Trade[]): Metrics {
  const closed = trades.filter((t) => t.status === 'closed');
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const breakeven = closed.filter((t) => t.pnl === 0);

  const totalPnl = closed.reduce((s, t) => s + Number(t.pnl), 0);
  const totalWins = wins.length;
  const totalLosses = losses.length;
  const winRate = closed.length > 0 ? (totalWins / closed.length) * 100 : 0;

  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + Number(t.pnl), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : wins.length > 0 ? Infinity : 0;
  const expectancy = closed.length > 0 ? totalPnl / closed.length : 0;
  const avgRr = closed.length > 0 ? closed.reduce((s, t) => s + Number(t.rr || 0), 0) / closed.length : 0;

  const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => Number(t.pnl))) : 0;
  const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => Number(t.pnl))) : 0;

  const avgHoldTime = closed.filter((t) => t.holding_minutes).length > 0
    ? closed.filter((t) => t.holding_minutes).reduce((s, t) => s + (t.holding_minutes || 0), 0) / closed.filter((t) => t.holding_minutes).length
    : 0;

  const avgConfidence = closed.filter((t) => t.confidence != null).length > 0
    ? closed.filter((t) => t.confidence != null).reduce((s, t) => s + (t.confidence || 0), 0) / closed.filter((t) => t.confidence != null).length
    : 0;

  // Streaks
  const sorted = [...closed].sort((a, b) => new Date(a.closed_at || a.executed_at).getTime() - new Date(b.closed_at || b.executed_at).getTime());
  let maxWinStreak = 0, maxLossStreak = 0, currentStreak = 0, curWin = 0, curLoss = 0;
  for (const t of sorted) {
    if (t.pnl > 0) { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); currentStreak = curWin; }
    else if (t.pnl < 0) { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); currentStreak = -curLoss; }
    else { curWin = 0; curLoss = 0; }
  }

  // By session
  const bySession: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    const s = t.session || 'other';
    if (!bySession[s]) bySession[s] = { trades: 0, pnl: 0, winRate: 0 };
    bySession[s].trades++;
    bySession[s].pnl += Number(t.pnl);
    bySession[s].winRate = bySession[s].trades > 0 ? (wins.filter((w) => w.session === s).length / bySession[s].trades) * 100 : 0;
  }

  // By direction
  const byDirection = {
    long: { trades: closed.filter((t) => t.direction === 'long').length, pnl: closed.filter((t) => t.direction === 'long').reduce((s, t) => s + Number(t.pnl), 0) },
    short: { trades: closed.filter((t) => t.direction === 'short').length, pnl: closed.filter((t) => t.direction === 'short').reduce((s, t) => s + Number(t.pnl), 0) },
  };

  // By instrument
  const byInstrument: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    if (!byInstrument[t.instrument]) byInstrument[t.instrument] = { trades: 0, pnl: 0, winRate: 0 };
    byInstrument[t.instrument].trades++;
    byInstrument[t.instrument].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byInstrument)) {
    const instWins = wins.filter((w) => w.instrument === k).length;
    byInstrument[k].winRate = byInstrument[k].trades > 0 ? (instWins / byInstrument[k].trades) * 100 : 0;
  }

  // By tag
  const byTag: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    for (const tag of t.strategy_tags || []) {
      if (!byTag[tag]) byTag[tag] = { trades: 0, pnl: 0, winRate: 0 };
      byTag[tag].trades++;
      byTag[tag].pnl += Number(t.pnl);
    }
  }
  for (const k of Object.keys(byTag)) {
    const tagWins = wins.filter((w) => (w.strategy_tags || []).includes(k)).length;
    byTag[k].winRate = byTag[k].trades > 0 ? (tagWins / byTag[k].trades) * 100 : 0;
  }

  // By day + equity curve
  const byDay: Record<string, { trades: number; pnl: number }> = {};
  const dailyPnl: { date: string; pnl: number }[] = [];
  let cumulative = 0;
  const equity: { date: string; cumulative: number }[] = [];
  for (const t of sorted) {
    const d = (t.closed_at || t.executed_at).split('T')[0];
    if (!byDay[d]) byDay[d] = { trades: 0, pnl: 0 };
    byDay[d].trades++;
    byDay[d].pnl += Number(t.pnl);
  }
  const days = Object.keys(byDay).sort();
  for (const d of days) {
    dailyPnl.push({ date: d, pnl: byDay[d].pnl });
    cumulative += byDay[d].pnl;
    equity.push({ date: d, cumulative });
  }

  const largestWin = closed.length > 0 ? closed.reduce((max, t) => Number(t.pnl) > Number(max.pnl) ? t : max, closed[0]) : null;
  const largestLoss = closed.length > 0 ? closed.reduce((min, t) => Number(t.pnl) < Number(min.pnl) ? t : min, closed[0]) : null;

  return {
    totalTrades: trades.length,
    winRate,
    totalPnl,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    avgRr,
    bestTrade,
    worstTrade,
    avgHoldTime,
    totalWins,
    totalLosses,
    breakeven: breakeven.length,
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    avgConfidence,
    bySession,
    byDirection,
    byInstrument,
    byTag,
    byDay,
    equity,
    dailyPnl,
    recentTrades: [...trades].sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()).slice(0, 10),
    largestWin,
    largestLoss,
  };
}
