import type { Trade } from './supabase';

export type Metrics = {
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  avgRr: number;
  maxDrawdown: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  equityCurve: { i: number; equity: number; pnl: number; date: string }[];
  byInstrument: { key: string; pnl: number; trades: number; winRate: number }[];
  bySession: { key: string; pnl: number; trades: number; winRate: number }[];
  byWeekday: { day: string; pnl: number; trades: number; winRate: number }[];
  byStrategy: { key: string; pnl: number; trades: number; winRate: number }[];
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
};

export function computeMetrics(trades: Trade[]): Metrics {
  const closed = trades.filter((t) => t.status === 'closed').sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const breakeven = closed.filter((t) => t.pnl === 0).length;
  const totalPnl = closed.reduce((s, t) => s + Number(t.pnl), 0);
  const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const avgRr = closed.length ? closed.reduce((s, t) => s + Number(t.rr || 0), 0) / closed.length : 0;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const expectancy = closed.length ? totalPnl / closed.length : 0;

  // Equity curve
  let equity = 10000;
  const equityCurve = closed.map((t, i) => {
    equity += Number(t.pnl);
    return { i, equity, pnl: Number(t.pnl), date: t.executed_at };
  });

  // Max drawdown
  let peak = -Infinity;
  let maxDrawdown = 0;
  equityCurve.forEach((p) => {
    if (p.equity > peak) peak = p.equity;
    const dd = peak - p.equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  // Streak
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | 'none' = 'none';
  for (let i = closed.length - 1; i >= 0; i--) {
    const pnl = Number(closed[i].pnl);
    if (pnl === 0) continue;
    const t = pnl > 0 ? 'win' : 'loss';
    if (streakType === 'none') {
      streakType = t;
      currentStreak = 1;
    } else if (t === streakType) {
      currentStreak++;
    } else break;
  }

  const groupBy = <K extends keyof Trade>(field: K) => {
    const map = new Map<string, { pnl: number; trades: number; wins: number }>();
    closed.forEach((t) => {
      const raw = t[field];
      const keys = Array.isArray(raw) ? raw : [String(raw)];
      keys.forEach((k) => {
        if (!k) return;
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

  const byInstrument = groupBy('instrument').sort((a, b) => b.pnl - a.pnl);
  const bySession = groupBy('session').filter((s) => s.key !== 'null' && s.key !== 'other');
  const byStrategy = groupBy('strategy_tags');

  const byWeekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
    const dayTrades = closed.filter((t) => new Date(t.executed_at).getDay() === idx);
    return {
      day,
      pnl: dayTrades.reduce((s, t) => s + Number(t.pnl), 0),
      trades: dayTrades.length,
      winRate: dayTrades.length ? (dayTrades.filter((t) => Number(t.pnl) > 0).length / dayTrades.length) * 100 : 0,
    };
  });

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayPnl = closed.filter((t) => new Date(t.executed_at) >= startToday).reduce((s, t) => s + Number(t.pnl), 0);
  const weekPnl = closed.filter((t) => new Date(t.executed_at) >= startWeek).reduce((s, t) => s + Number(t.pnl), 0);
  const monthPnl = closed.filter((t) => new Date(t.executed_at) >= startMonth).reduce((s, t) => s + Number(t.pnl), 0);

  return {
    totalPnl,
    winRate,
    profitFactor: profitFactor === Infinity ? 99 : profitFactor,
    avgRr,
    maxDrawdown,
    totalTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakeven,
    avgWin,
    avgLoss,
    expectancy,
    bestTrade: closed.length ? Math.max(...closed.map((t) => Number(t.pnl))) : 0,
    worstTrade: closed.length ? Math.min(...closed.map((t) => Number(t.pnl))) : 0,
    currentStreak,
    streakType,
    equityCurve,
    byInstrument,
    bySession,
    byWeekday,
    byStrategy,
    todayPnl,
    weekPnl,
    monthPnl,
  };
}
