export type InstrumentSpec = {
  symbol: string;
  name: string;
  category: 'forex' | 'crypto' | 'commodity' | 'index' | 'stock';
  pipSize: number;
  contractSize: number;
  pipValuePerLot: number;
};

const INSTRUMENTS: Record<string, InstrumentSpec> = {
  EURUSD: { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', pipSize: 0.0001, contractSize: 100000, pipValuePerLot: 10 },
  GBPUSD: { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex', pipSize: 0.0001, contractSize: 100000, pipValuePerLot: 10 },
  USDJPY: { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex', pipSize: 0.01, contractSize: 100000, pipValuePerLot: 9.09 },
  AUDUSD: { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'forex', pipSize: 0.0001, contractSize: 100000, pipValuePerLot: 10 },
  USDCAD: { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'forex', pipSize: 0.0001, contractSize: 100000, pipValuePerLot: 7.69 },
  NZDUSD: { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'forex', pipSize: 0.0001, contractSize: 100000, pipValuePerLot: 10 },
  EURJPY: { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'forex', pipSize: 0.01, contractSize: 100000, pipValuePerLot: 9.09 },
  GBPJPY: { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'forex', pipSize: 0.01, contractSize: 100000, pipValuePerLot: 9.09 },
  EURGBP: { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'forex', pipSize: 0.0001, contractSize: 100000, pipValuePerLot: 12.5 },
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'commodity', pipSize: 0.01, contractSize: 100, pipValuePerLot: 1 },
  XAGUSD: { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'commodity', pipSize: 0.01, contractSize: 5000, pipValuePerLot: 50 },
  BTCUSD: { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto', pipSize: 1, contractSize: 1, pipValuePerLot: 1 },
  ETHUSD: { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto', pipSize: 0.01, contractSize: 1, pipValuePerLot: 1 },
  US30:   { symbol: 'US30', name: 'Dow Jones 30', category: 'index', pipSize: 1, contractSize: 1, pipValuePerLot: 1 },
  SPX500: { symbol: 'SPX500', name: 'S&P 500', category: 'index', pipSize: 0.1, contractSize: 1, pipValuePerLot: 1 },
  NAS100: { symbol: 'NAS100', name: 'Nasdaq 100', category: 'index', pipSize: 0.25, contractSize: 1, pipValuePerLot: 1 },
};

export function getSpec(symbol: string): InstrumentSpec | null {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return INSTRUMENTS[normalized] || null;
}

export function pipValuePerLot(symbol: string): number {
  return getSpec(symbol)?.pipValuePerLot ?? 1;
}

export function getAllInstruments(): InstrumentSpec[] {
  return Object.values(INSTRUMENTS);
}

export function getInstrumentsByCategory(category: InstrumentSpec['category']): InstrumentSpec[] {
  return Object.values(INSTRUMENTS).filter((i) => i.category === category);
}
