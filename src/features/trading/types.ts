export type TradingDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed' | 'pending';
export type RiskLevel = 'low' | 'medium' | 'high';

export type TradeSummary = {
  id: string;
  instrument: string;
  direction: TradingDirection;
  pnl: number;
  status: TradeStatus;
  risk: RiskLevel;
  executed_at: string;
};
