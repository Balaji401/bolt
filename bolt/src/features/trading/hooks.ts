import { useMemo } from 'react';
import type { TradeSummary } from './types';

export function useTradeStats(trades: TradeSummary[]) {
  return useMemo(() => {
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    const wins = trades.filter((trade) => trade.pnl > 0).length;
    const losses = trades.filter((trade) => trade.pnl < 0).length;

    return {
      totalPnl,
      wins,
      losses,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
    };
  }, [trades]);
}
