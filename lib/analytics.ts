import type { Trade } from './supabase';

export type Metrics = {
  // Core P&L
  totalPnl: number;
  netPnl: number;       // alias for totalPnl
  grossProfit: number;
  grossLoss: number;
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;

  // Trade counts
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  todayTrades: number;

  // Rate / factor metrics
  winRate: number;
  profitFactor: number;
  expectancy: number;
  avgRR: number;         // preferred alias
  avgRr: number;         // backward-compat alias
  totalRR: number;       // sum of all R:R values

  // Trade size
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingMinutes: number;

  // Drawdown
  maxDrawdown: number;
  maxDrawdownPct: number;
  currentDrawdown: number;

  // Streak
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  longestWinStreak: number;
  longestLossStreak: number;

  // Equity curve
  equityCurve: { i: number; equity: number; pnl: number; date: string }[];

  // Breakdowns – each entry has both a `key` field and a named alias
  byInstrument: { key: string; instrument: string; pnl: number; trades: number; winRate: number }[];
  bySession:    { key: string; session: string;    pnl: number; trades: number; winRate: number }[];
  byWeekday:    { day: string;                     pnl: number; trades: number; winRate: number }[];
  byStrategy:   { key: string; strategy: string;   pnl: number; trades: number; winRate: number }[];
  byMonth:      { month: string;                   pnl: number; trades: number; winRate: number }[];

  // Matrix breakdowns
  byStrategySession:    { strategy: string; session: string;    pnl: number; trades: number; winRate: number }[];
  byStrategyInstrument: { strategy: string; instrument: string; pnl: number; trades: number; winRate: number }[];
};

export function computeMetrics(trades: Trade[]): Metrics {
  const closed = trades
    .filter((t) => t.status === 'closed')
    .sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());

  const wins     = closed.filter((t) => Number(t.pnl) > 0);
  const losses   = closed.filter((t) => Number(t.pnl) < 0);
  const breakeven = closed.filter((t) => Number(t.pnl) === 0).length;

  const totalPnl    = closed.reduce((s, t) => s + Number(t.pnl), 0);
  const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));

  const winRate      = closed.length ? (wins.length / closed.length) * 100 : 0;
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
  const avgRR        = closed.length ? closed.reduce((s, t) => s + Number(t.rr || 0), 0) / closed.length : 0;
  const totalRR      = closed.reduce((s, t) => s + Number(t.rr || 0), 0);
  const avgWin       = wins.length ? grossProfit / wins.length : 0;
  const avgLoss      = losses.length ? grossLoss / losses.length : 0;
  const expectancy   = closed.length ? totalPnl / closed.length : 0;

  const avgHoldingMinutes = (() => {
    const withHolding = closed.filter((t) => t.holding_minutes && t.holding_minutes > 0);
    if (!withHolding.length) return 0;
    return withHolding.reduce((s, t) => s + (t.holding_minutes || 0), 0) / withHolding.length;
  })();

  // Equity curve + drawdown
  let equity = 10000;
  let peak = 10000;
  let maxDrawdown = 0;
  const equityCurve = closed.map((t, i) => {
    equity += Number(t.pnl);
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
    return { i, equity, pnl: Number(t.pnl), date: t.executed_at };
  });

  const maxDrawdownPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0;
  const currentDrawdown = equityCurve.length ? Math.max(0, peak - equityCurve[equityCurve.length - 1].equity) : 0;

  // Streak (current + longest)
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | 'none' = 'none';
  for (let i = closed.length - 1; i >= 0; i--) {
    const pnl = Number(closed[i].pnl);
    if (pnl === 0) continue;
    const t = pnl > 0 ? 'win' : 'loss';
    if (streakType === 'none') { streakType = t; currentStreak = 1; }
    else if (t === streakType) currentStreak++;
    else break;
  }

  let longestWinStreak = 0, longestLossStreak = 0;
  let curW = 0, curL = 0;
  closed.forEach((t) => {
    if (Number(t.pnl) > 0) { curW++; curL = 0; if (curW > longestWinStreak) longestWinStreak = curW; }
    else if (Number(t.pnl) < 0) { curL++; curW = 0; if (curL > longestLossStreak) longestLossStreak = curL; }
    else { curW = 0; curL = 0; }
  });

  // Generic group-by helper
  const groupBy = <K extends keyof Trade>(field: K) => {
    const map = new Map<string, { pnl: number; trades: number; wins: number }>();
    closed.forEach((t) => {
      const raw = t[field];
      const keys = Array.isArray(raw) ? raw : [String(raw)];
      keys.forEach((k) => {
        if (!k || k === 'null') return;
        const cur = map.get(k) || { pnl: 0, trades: 0, wins: 0 };
        cur.pnl += Number(t.pnl);
        cur.trades += 1;
        if (Number(t.pnl) > 0) cur.wins += 1;
        map.set(k, cur);
      });
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      key: k,
      pnl: v.pnl,
      trades: v.trades,
      winRate: (v.wins / v.trades) * 100,
    }));
  };

  const rawByInstrument = groupBy('instrument').sort((a, b) => b.pnl - a.pnl);
  const rawBySession    = groupBy('session').filter((s) => s.key !== 'other');
  const rawByStrategy   = groupBy('strategy_tags');

  const byInstrument = rawByInstrument.map((r) => ({ ...r, instrument: r.key }));
  const bySession    = rawBySession.map((r) => ({ ...r, session: r.key }));
  const byStrategy   = rawByStrategy.map((r) => ({ ...r, strategy: r.key }));

  // Weekday breakdown
  const byWeekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
    const dt = closed.filter((t) => new Date(t.executed_at).getDay() === idx);
    return {
      day,
      pnl: dt.reduce((s, t) => s + Number(t.pnl), 0),
      trades: dt.length,
      winRate: dt.length ? (dt.filter((t) => Number(t.pnl) > 0).length / dt.length) * 100 : 0,
    };
  });

  // Monthly breakdown
  const monthMap = new Map<string, { pnl: number; trades: number; wins: number }>();
  closed.forEach((t) => {
    const d = new Date(t.executed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur = monthMap.get(key) || { pnl: 0, trades: 0, wins: 0 };
    cur.pnl += Number(t.pnl);
    cur.trades += 1;
    if (Number(t.pnl) > 0) cur.wins += 1;
    monthMap.set(key, cur);
  });
  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, pnl: v.pnl, trades: v.trades, winRate: (v.wins / v.trades) * 100 }));

  // Strategy × Session + Strategy × Instrument matrices
  const stratSessMap = new Map<string, { pnl: number; trades: number; wins: number }>();
  const stratInstMap = new Map<string, { pnl: number; trades: number; wins: number }>();
  closed.forEach((t) => {
    const strategies = (t.strategy_tags || []).length ? t.strategy_tags : ['(none)'];
    const session = t.session || 'other';
    strategies.forEach((strat) => {
      const k1 = `${strat}|${session}`;
      const c1 = stratSessMap.get(k1) || { pnl: 0, trades: 0, wins: 0 };
      c1.pnl += Number(t.pnl); c1.trades += 1;
      if (Number(t.pnl) > 0) c1.wins += 1;
      stratSessMap.set(k1, c1);

      const k2 = `${strat}|${t.instrument}`;
      const c2 = stratInstMap.get(k2) || { pnl: 0, trades: 0, wins: 0 };
      c2.pnl += Number(t.pnl); c2.trades += 1;
      if (Number(t.pnl) > 0) c2.wins += 1;
      stratInstMap.set(k2, c2);
    });
  });

  const byStrategySession = Array.from(stratSessMap.entries()).map(([k, v]) => {
    const [strategy, session] = k.split('|');
    return { strategy, session, pnl: v.pnl, trades: v.trades, winRate: (v.wins / v.trades) * 100 };
  });
  const byStrategyInstrument = Array.from(stratInstMap.entries()).map(([k, v]) => {
    const [strategy, instrument] = k.split('|');
    return { strategy, instrument, pnl: v.pnl, trades: v.trades, winRate: (v.wins / v.trades) * 100 };
  });

  // Time-period P&L
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek  = new Date(startToday); startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayTrades = closed.filter((t) => new Date(t.executed_at) >= startToday).length;
  const todayPnl    = closed.filter((t) => new Date(t.executed_at) >= startToday).reduce((s, t) => s + Number(t.pnl), 0);
  const weekPnl     = closed.filter((t) => new Date(t.executed_at) >= startWeek).reduce((s, t) => s + Number(t.pnl), 0);
  const monthPnl    = closed.filter((t) => new Date(t.executed_at) >= startMonth).reduce((s, t) => s + Number(t.pnl), 0);

  return {
    totalPnl, netPnl: totalPnl, grossProfit, grossLoss,
    todayPnl, weekPnl, monthPnl, todayTrades,
    totalTrades: closed.length, wins: wins.length, losses: losses.length, breakeven,
    winRate, profitFactor, expectancy, avgRR, avgRr: avgRR, totalRR,
    avgWin, avgLoss,
    bestTrade:  closed.length ? Math.max(...closed.map((t) => Number(t.pnl))) : 0,
    worstTrade: closed.length ? Math.min(...closed.map((t) => Number(t.pnl))) : 0,
    avgHoldingMinutes,
    maxDrawdown, maxDrawdownPct, currentDrawdown,
    currentStreak: streakType === 'win' ? currentStreak : -currentStreak,
    streakType, longestWinStreak, longestLossStreak,
    equityCurve,
    byInstrument, bySession, byWeekday, byStrategy, byMonth,
    byStrategySession, byStrategyInstrument,
  };
}
