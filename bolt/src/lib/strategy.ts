import type { Strategy, Trade, TradeSetup } from '@/lib/supabase';

export const DEFAULT_STRATEGY_CATEGORIES = [
  'Scalping', 'Intraday', 'Swing', 'Position', 'Breakout',
  'Reversal', 'Trend Following', 'Range Trading', 'News Trading',
] as const;

export const STRATEGY_STATUSES = ['active', 'inactive', 'testing', 'archived'] as const;
export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', 'Daily', 'Weekly', 'Monthly'] as const;
export const INSTRUMENT_TYPES = ['Forex', 'Stocks', 'Crypto', 'Indices', 'Commodities', 'Futures', 'Options'] as const;
export const SETUP_TYPES = ['Continuation', 'Reversal', 'Breakout', 'Pullback', 'Range', 'Momentum', 'Custom'] as const;
export const SESSIONS = ['Asia', 'London', 'New York', 'Sydney', 'Overlap', 'Any Session'] as const;
export const CHECKLIST_TYPES = [
  { value: 'before_entry', label: 'Before Entry' },
  { value: 'after_exit', label: 'After Exit' },
  { value: 'pre_market', label: 'Pre-Market' },
  { value: 'risk_check', label: 'Risk Check' },
  { value: 'custom', label: 'Custom' },
] as const;

export type StrategyPerformance = {
  trades: Trade[];
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  lossRate: number;
  averageRr: number;
  netProfit: number;
  totalProfit: number;
  totalLoss: number;
  bestInstrument: string;
  worstInstrument: string;
};

export function getStrategyTrades(strategy: Strategy, trades: Trade[]): Trade[] {
  const name = strategy.name.toLowerCase();
  return trades.filter((trade) => {
    const tags = (trade.strategy_tags || []).map((tag) => tag.toLowerCase());
    return tags.includes(name) || tags.includes(strategy.id.toLowerCase()) || tags.includes(strategy.category.toLowerCase());
  });
}

export function getSetupTrades(setup: TradeSetup, strategy: Strategy, trades: Trade[]): Trade[] {
  const setupName = setup.name.toLowerCase();
  const strategyTrades = getStrategyTrades(strategy, trades);
  return strategyTrades.filter((trade) => {
    const type = (trade.setup_type || '').toLowerCase();
    const tags = (trade.strategy_tags || []).map((tag) => tag.toLowerCase());
    return type === setupName || tags.includes(setupName) || type === (setup.setup_type || '').toLowerCase();
  });
}

export function calculateStrategyPerformance(strategy: Strategy, trades: Trade[]): StrategyPerformance {
  const linked = getStrategyTrades(strategy, trades).filter((trade) => trade.status === 'closed');
  const wins = linked.filter((trade) => Number(trade.pnl) > 0);
  const losses = linked.filter((trade) => Number(trade.pnl) < 0);
  const instruments = new Map<string, { pnl: number; count: number }>();
  linked.forEach((trade) => {
    const current = instruments.get(trade.instrument) || { pnl: 0, count: 0 };
    instruments.set(trade.instrument, { pnl: current.pnl + Number(trade.pnl), count: current.count + 1 });
  });
  const sortedInstruments = [...instruments.entries()].sort((a, b) => b[1].pnl - a[1].pnl);
  return {
    trades: linked,
    totalTrades: linked.length,
    wins: wins.length,
    losses: losses.length,
    winRate: linked.length ? (wins.length / linked.length) * 100 : 0,
    lossRate: linked.length ? (losses.length / linked.length) * 100 : 0,
    averageRr: linked.length ? linked.reduce((sum, trade) => sum + Number(trade.rr || 0), 0) / linked.length : 0,
    netProfit: linked.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
    totalProfit: wins.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
    totalLoss: losses.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
    bestInstrument: sortedInstruments[0]?.[0] || '—',
    worstInstrument: sortedInstruments[sortedInstruments.length - 1]?.[0] || '—',
  };
}

export function calculateStrategyStats(strategies: Strategy[], trades: Trade[]) {
  const performances = strategies.map((strategy) => ({ strategy, performance: calculateStrategyPerformance(strategy, trades) }));
  const active = strategies.filter((strategy) => strategy.status === 'active').length;
  const inactive = strategies.filter((strategy) => strategy.status !== 'active').length;
  const winning = performances.filter(({ performance }) => performance.winRate >= 50 && performance.totalTrades > 0).length;
  const allLinked = performances.flatMap(({ performance }) => performance.trades);
  const wins = allLinked.filter((trade) => Number(trade.pnl) > 0).length;
  const best = [...performances].sort((a, b) => b.performance.netProfit - a.performance.netProfit)[0];
  const worst = [...performances].sort((a, b) => a.performance.netProfit - b.performance.netProfit)[0];
  return {
    total: strategies.length,
    active,
    inactive,
    winning,
    winRate: allLinked.length ? (wins / allLinked.length) * 100 : 0,
    best: best?.strategy.name || '—',
    worst: worst?.strategy.name || '—',
  };
}

export function parseList(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

export function stringifyList(value: string[] | null | undefined): string {
  return (value || []).join('\n');
}
