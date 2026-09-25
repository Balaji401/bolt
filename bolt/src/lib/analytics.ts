import type { Trade } from './supabase';

export type Metrics = {
  totalTrades: number;
  winRate: number;
  lossRate: number;
  breakevenRate: number;
  totalPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  expectancy: number;
  avgRr: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldTime: number;
  totalWins: number;
  totalLosses: number;
  breakeven: number;
  maxWinStreak: number;
  maxLossStreak: number;
  currentWinStreak: number;
  currentLossStreak: number;
  currentStreak: number;
  avgConfidence: number;
  avgTradesPerDay: number;
  tradeFrequency: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  bySession: Record<string, { trades: number; pnl: number; winRate: number }>;
  byDirection: { long: { trades: number; pnl: number; winRate: number }; short: { trades: number; pnl: number; winRate: number } };
  byInstrument: Record<string, { trades: number; pnl: number; winRate: number }>;
  byTag: Record<string, { trades: number; pnl: number; winRate: number }>;
  byDay: Record<string, { trades: number; pnl: number }>;
  byDayOfWeek: Record<string, { trades: number; pnl: number; winRate: number }>;
  byHour: Record<string, { trades: number; pnl: number }>;
  byMonth: Record<string, { trades: number; pnl: number }>;
  byYear: Record<string, { trades: number; pnl: number }>;
  byTimeframe: Record<string, { trades: number; pnl: number; winRate: number }>;
  byMarket: Record<string, { trades: number; pnl: number; winRate: number }>;
  byAccount: Record<string, { trades: number; pnl: number; winRate: number }>;
  equity: { date: string; cumulative: number; pnl: number; balance: number }[];
  drawdownSeries: { date: string; drawdown: number; equity: number }[];
  maxDrawdown: number;
  currentDrawdown: number;
  rDistribution: { bucket: string; count: number; percent: number; avgR: number }[];
  dailyPnl: { date: string; pnl: number }[];
  weeklyPnl: { week: string; pnl: number }[];
  monthlyPnl: { month: string; pnl: number }[];
  yearlyPnl: { year: string; pnl: number }[];
  recentTrades: Trade[];
  largestWinTrade: Trade | null;
  largestLossTrade: Trade | null;
};

export type FilterOptions = {
  dateFrom?: string | null;
  dateTo?: string | null;
  accountId?: string | null;
  instrument?: string | null;
  market?: string | null;
  strategy?: string | null;
  session?: string | null;
  direction?: string | null;
  setupType?: string | null;
  tags?: string[] | null;
  timeframe?: string | null;
};

export function filterTrades(trades: Trade[], filters: FilterOptions): Trade[] {
  return trades.filter((t) => {
    if (filters.dateFrom) {
      const d = (t.closed_at || t.executed_at).split('T')[0];
      if (d < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      const d = (t.closed_at || t.executed_at).split('T')[0];
      if (d > filters.dateTo) return false;
    }
    if (filters.accountId && t.import_job_id) {
      // account filter is applied at the component level via workspace
    }
    if (filters.instrument && t.instrument !== filters.instrument) return false;
    if (filters.market && t.market !== filters.market) return false;
    if (filters.strategy && !(t.strategy_tags || []).includes(filters.strategy)) return false;
    if (filters.session && t.session !== filters.session) return false;
    if (filters.direction && t.direction !== filters.direction) return false;
    if (filters.setupType && t.setup_type !== filters.setupType) return false;
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((tag) => (t.strategy_tags || []).includes(tag))) return false;
    }
    if (filters.timeframe && t.timeframe !== filters.timeframe) return false;
    return true;
  });
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function computeWinRate(wins: number, total: number): number {
  return total > 0 ? (wins / total) * 100 : 0;
}

export function computeMetrics(trades: Trade[]): Metrics {
  const closed = trades.filter((t) => t.status === 'closed');
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const breakeven = closed.filter((t) => t.pnl === 0);

  const totalPnl = closed.reduce((s, t) => s + Number(t.pnl), 0);
  const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
  const totalWins = wins.length;
  const totalLosses = losses.length;
  const winRate = computeWinRate(totalWins, closed.length);
  const lossRate = closed.length > 0 ? (totalLosses / closed.length) * 100 : 0;
  const breakevenRate = closed.length > 0 ? (breakeven.length / closed.length) * 100 : 0;

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : wins.length > 0 ? Infinity : 0;
  const expectancy = closed.length > 0 ? totalPnl / closed.length : 0;
  const avgRr = closed.length > 0 ? closed.reduce((s, t) => s + Number(t.rr || 0), 0) / closed.length : 0;

  const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => Number(t.pnl))) : 0;
  const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => Number(t.pnl))) : 0;
  const largestWin = bestTrade;
  const largestLoss = worstTrade;

  const withHoldTime = closed.filter((t) => t.holding_minutes != null);
  const avgHoldTime = withHoldTime.length > 0
    ? withHoldTime.reduce((s, t) => s + (t.holding_minutes || 0), 0) / withHoldTime.length
    : 0;

  const withConfidence = closed.filter((t) => t.confidence != null);
  const avgConfidence = withConfidence.length > 0
    ? withConfidence.reduce((s, t) => s + (t.confidence || 0), 0) / withConfidence.length
    : 0;

  const sorted = [...closed].sort((a, b) =>
    new Date(a.closed_at || a.executed_at).getTime() - new Date(b.closed_at || b.executed_at).getTime()
  );

  let maxWinStreak = 0, maxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0, currentStreak = 0;
  for (const t of sorted) {
    if (t.pnl > 0) {
      currentWinStreak++; currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      currentStreak = currentWinStreak;
    } else if (t.pnl < 0) {
      currentLossStreak++; currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      currentStreak = -currentLossStreak;
    } else {
      currentWinStreak = 0; currentLossStreak = 0;
    }
  }

  // By session
  const bySession: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    const s = t.session || 'other';
    if (!bySession[s]) bySession[s] = { trades: 0, pnl: 0, winRate: 0 };
    bySession[s].trades++;
    bySession[s].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(bySession)) {
    bySession[k].winRate = computeWinRate(
      wins.filter((w) => (w.session || 'other') === k).length,
      bySession[k].trades
    );
  }

  // By direction
  const longTrades = closed.filter((t) => t.direction === 'long');
  const shortTrades = closed.filter((t) => t.direction === 'short');
  const byDirection = {
    long: {
      trades: longTrades.length,
      pnl: longTrades.reduce((s, t) => s + Number(t.pnl), 0),
      winRate: computeWinRate(longTrades.filter((t) => t.pnl > 0).length, longTrades.length),
    },
    short: {
      trades: shortTrades.length,
      pnl: shortTrades.reduce((s, t) => s + Number(t.pnl), 0),
      winRate: computeWinRate(shortTrades.filter((t) => t.pnl > 0).length, shortTrades.length),
    },
  };

  // By instrument
  const byInstrument: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    if (!byInstrument[t.instrument]) byInstrument[t.instrument] = { trades: 0, pnl: 0, winRate: 0 };
    byInstrument[t.instrument].trades++;
    byInstrument[t.instrument].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byInstrument)) {
    byInstrument[k].winRate = computeWinRate(
      wins.filter((w) => w.instrument === k).length,
      byInstrument[k].trades
    );
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
    byTag[k].winRate = computeWinRate(
      wins.filter((w) => (w.strategy_tags || []).includes(k)).length,
      byTag[k].trades
    );
  }

  // By day + equity curve
  const byDay: Record<string, { trades: number; pnl: number }> = {};
  for (const t of sorted) {
    const d = (t.closed_at || t.executed_at).split('T')[0];
    if (!byDay[d]) byDay[d] = { trades: 0, pnl: 0 };
    byDay[d].trades++;
    byDay[d].pnl += Number(t.pnl);
  }

  const days = Object.keys(byDay).sort();
  const dailyPnl: { date: string; pnl: number }[] = [];
  const equity: { date: string; cumulative: number; pnl: number; balance: number }[] = [];
  let cumulative = 0;
  for (const d of days) {
    dailyPnl.push({ date: d, pnl: byDay[d].pnl });
    cumulative += byDay[d].pnl;
    equity.push({ date: d, cumulative, pnl: byDay[d].pnl, balance: cumulative });
  }

  // Best/worst day
  let bestDay: { date: string; pnl: number } | null = null;
  let worstDay: { date: string; pnl: number } | null = null;
  for (const d of days) {
    if (!bestDay || byDay[d].pnl > bestDay.pnl) bestDay = { date: d, pnl: byDay[d].pnl };
    if (!worstDay || byDay[d].pnl < worstDay.pnl) worstDay = { date: d, pnl: byDay[d].pnl };
  }

  // By day of week
  const byDayOfWeek: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of sorted) {
    const dt = new Date(t.closed_at || t.executed_at);
    const dayName = DAY_NAMES[dt.getDay()];
    if (!byDayOfWeek[dayName]) byDayOfWeek[dayName] = { trades: 0, pnl: 0, winRate: 0 };
    byDayOfWeek[dayName].trades++;
    byDayOfWeek[dayName].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byDayOfWeek)) {
    byDayOfWeek[k].winRate = computeWinRate(
      sorted.filter((t) => t.pnl > 0 && DAY_NAMES[new Date(t.closed_at || t.executed_at).getDay()] === k).length,
      byDayOfWeek[k].trades
    );
  }

  // By hour
  const byHour: Record<string, { trades: number; pnl: number }> = {};
  for (const t of sorted) {
    const dt = new Date(t.executed_at);
    const h = dt.getHours().toString().padStart(2, '0') + ':00';
    if (!byHour[h]) byHour[h] = { trades: 0, pnl: 0 };
    byHour[h].trades++;
    byHour[h].pnl += Number(t.pnl);
  }

  // By month
  const byMonth: Record<string, { trades: number; pnl: number }> = {};
  const monthlyPnl: { month: string; pnl: number }[] = [];
  for (const t of sorted) {
    const dt = new Date(t.closed_at || t.executed_at);
    const key = `${dt.getFullYear()}-${MONTH_NAMES[dt.getMonth()]}`;
    if (!byMonth[key]) byMonth[key] = { trades: 0, pnl: 0 };
    byMonth[key].trades++;
    byMonth[key].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byMonth).sort()) {
    monthlyPnl.push({ month: k, pnl: byMonth[k].pnl });
  }

  // By year
  const byYear: Record<string, { trades: number; pnl: number }> = {};
  const yearlyPnl: { year: string; pnl: number }[] = [];
  for (const t of sorted) {
    const dt = new Date(t.closed_at || t.executed_at);
    const key = dt.getFullYear().toString();
    if (!byYear[key]) byYear[key] = { trades: 0, pnl: 0 };
    byYear[key].trades++;
    byYear[key].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byYear).sort()) {
    yearlyPnl.push({ year: k, pnl: byYear[k].pnl });
  }

  // Weekly PnL
  const weeklyPnl: { week: string; pnl: number }[] = [];
  const weekMap: Record<string, number> = {};
  for (const t of sorted) {
    const dt = new Date(t.closed_at || t.executed_at);
    const weekNum = getWeekNumber(dt);
    const key = `${dt.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    if (!weekMap[key]) weekMap[key] = 0;
    weekMap[key] += Number(t.pnl);
  }
  for (const k of Object.keys(weekMap).sort()) {
    weeklyPnl.push({ week: k, pnl: weekMap[k] });
  }

  // By timeframe
  const byTimeframe: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    const tf = t.timeframe || 'unknown';
    if (!byTimeframe[tf]) byTimeframe[tf] = { trades: 0, pnl: 0, winRate: 0 };
    byTimeframe[tf].trades++;
    byTimeframe[tf].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byTimeframe)) {
    byTimeframe[k].winRate = computeWinRate(
      wins.filter((w) => (w.timeframe || 'unknown') === k).length,
      byTimeframe[k].trades
    );
  }

  // By market
  const byMarket: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    const m = t.market || 'unknown';
    if (!byMarket[m]) byMarket[m] = { trades: 0, pnl: 0, winRate: 0 };
    byMarket[m].trades++;
    byMarket[m].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byMarket)) {
    byMarket[k].winRate = computeWinRate(
      wins.filter((w) => (w.market || 'unknown') === k).length,
      byMarket[k].trades
    );
  }

  // By account (using import_job_id as proxy)
  const byAccount: Record<string, { trades: number; pnl: number; winRate: number }> = {};
  for (const t of closed) {
    const a = t.import_job_id || 'manual';
    if (!byAccount[a]) byAccount[a] = { trades: 0, pnl: 0, winRate: 0 };
    byAccount[a].trades++;
    byAccount[a].pnl += Number(t.pnl);
  }
  for (const k of Object.keys(byAccount)) {
    byAccount[k].winRate = computeWinRate(
      wins.filter((w) => (w.import_job_id || 'manual') === k).length,
      byAccount[k].trades
    );
  }

  // Trade frequency
  const uniqueDays = new Set(sorted.map((t) => (t.closed_at || t.executed_at).split('T')[0])).size;
  const avgTradesPerDay = uniqueDays > 0 ? closed.length / uniqueDays : 0;

  const largestWinTrade = closed.length > 0
    ? closed.reduce((max, t) => Number(t.pnl) > Number(max.pnl) ? t : max, closed[0])
    : null;
  const largestLossTrade = closed.length > 0
    ? closed.reduce((min, t) => Number(t.pnl) < Number(min.pnl) ? t : min, closed[0])
    : null;

  const drawdownSeries: { date: string; drawdown: number; equity: number }[] = [];
  let peakEquity = 0;
  let maxDrawdown = 0;
  for (const point of equity) {
    const level = point.balance;
    peakEquity = Math.max(peakEquity, level);
    const drawdown = peakEquity > 0 ? ((level - peakEquity) / peakEquity) * 100 : 0;
    drawdownSeries.push({ date: point.date, drawdown, equity: level });
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  }
  const currentDrawdown = drawdownSeries.length > 0 ? drawdownSeries[drawdownSeries.length - 1].drawdown : 0;

  const rBuckets = [
    { bucket: '< -2R', min: -Infinity, max: -2 },
    { bucket: '-2R to -1R', min: -2, max: -1 },
    { bucket: '-1R to 0R', min: -1, max: 0 },
    { bucket: '0R to +1R', min: 0, max: 1 },
    { bucket: '+1R to +2R', min: 1, max: 2 },
    { bucket: '> +2R', min: 2, max: Infinity },
  ];

  const rDistribution = rBuckets.map((bucket) => {
    const matches = closed.filter((t) => {
      const rr = Number(t.rr || 0);
      return rr >= bucket.min && rr < bucket.max;
    });
    const avgR = matches.length > 0
      ? matches.reduce((sum, trade) => sum + Number(trade.rr || 0), 0) / matches.length
      : 0;
    return {
      bucket: bucket.bucket,
      count: matches.length,
      percent: closed.length > 0 ? (matches.length / closed.length) * 100 : 0,
      avgR,
    };
  });

  return {
    totalTrades: trades.length,
    winRate,
    lossRate,
    breakevenRate,
    totalPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    expectancy,
    avgRr,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    bestTrade,
    worstTrade,
    avgHoldTime,
    totalWins,
    totalLosses,
    breakeven: breakeven.length,
    maxWinStreak,
    maxLossStreak,
    currentWinStreak,
    currentLossStreak,
    currentStreak,
    avgConfidence,
    avgTradesPerDay,
    tradeFrequency: avgTradesPerDay,
    bestDay,
    worstDay,
    bySession,
    byDirection,
    byInstrument,
    byTag,
    byDay,
    byDayOfWeek,
    byHour,
    byMonth,
    byYear,
    byTimeframe,
    byMarket,
    byAccount,
    equity,
    drawdownSeries,
    maxDrawdown,
    currentDrawdown,
    rDistribution,
    dailyPnl,
    weeklyPnl,
    monthlyPnl,
    yearlyPnl,
    recentTrades: [...trades].sort((a, b) =>
      new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
    ).slice(0, 10),
    largestWinTrade,
    largestLossTrade,
  };
}

function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export type RecentRange = '7d' | '30d' | '90d' | 'current_month' | 'previous_month' | 'ytd' | 'lifetime';

export function filterByRecentRange(trades: Trade[], range: RecentRange): Trade[] {
  const now = new Date();
  let start = new Date();
  switch (range) {
    case '7d': start.setDate(now.getDate() - 7); break;
    case '30d': start.setDate(now.getDate() - 30); break;
    case '90d': start.setDate(now.getDate() - 90); break;
    case 'current_month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'previous_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endPrev = new Date(now.getFullYear(), now.getMonth(), 0);
      return trades.filter((t) => {
        const d = new Date(t.closed_at || t.executed_at);
        return d >= start && d <= endPrev;
      });
    case 'ytd': start = new Date(now.getFullYear(), 0, 1); break;
    case 'lifetime': return trades;
  }
  return trades.filter((t) => new Date(t.closed_at || t.executed_at) >= start);
}
