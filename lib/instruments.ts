// Contract specifications per instrument.
// `contractSize` is the unit size of 1 standard lot.
// `pipDecimals` is how many decimals a pip represents (4 for most FX, 2 for JPY pairs).
// `pipSize` is the value of one pip in price terms (0.0001 / 0.01 / 0.1 / 1).
// `category` groups instruments for filtering and analytics.

export type InstrumentSpec = {
  symbol: string;
  name: string;
  category: 'forex' | 'metals' | 'crypto' | 'indices' | 'stocks' | 'commodities' | 'energy';
  contractSize: number; // units per 1 lot
  pipSize: number; // price value of 1 pip
  pipDecimals: number;
  minLot: number;
  quoteCurrency: string;
};

export const INSTRUMENTS: Record<string, InstrumentSpec> = {
  // Forex majors
  EURUSD: { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', contractSize: 100000, pipSize: 0.0001, pipDecimals: 4, minLot: 0.01, quoteCurrency: 'USD' },
  GBPUSD: { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex', contractSize: 100000, pipSize: 0.0001, pipDecimals: 4, minLot: 0.01, quoteCurrency: 'USD' },
  USDJPY: { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex', contractSize: 100000, pipSize: 0.01, pipDecimals: 2, minLot: 0.01, quoteCurrency: 'JPY' },
  GBPJPY: { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'forex', contractSize: 100000, pipSize: 0.01, pipDecimals: 2, minLot: 0.01, quoteCurrency: 'JPY' },
  AUDUSD: { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'forex', contractSize: 100000, pipSize: 0.0001, pipDecimals: 4, minLot: 0.01, quoteCurrency: 'USD' },
  USDCAD: { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'forex', contractSize: 100000, pipSize: 0.0001, pipDecimals: 4, minLot: 0.01, quoteCurrency: 'CAD' },
  // Metals
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'metals', contractSize: 100, pipSize: 0.01, pipDecimals: 2, minLot: 0.01, quoteCurrency: 'USD' },
  XAGUSD: { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'metals', contractSize: 5000, pipSize: 0.001, pipDecimals: 3, minLot: 0.01, quoteCurrency: 'USD' },
  // Crypto
  BTCUSD: { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto', contractSize: 1, pipSize: 1, pipDecimals: 1, minLot: 0.01, quoteCurrency: 'USD' },
  ETHUSD: { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto', contractSize: 1, pipSize: 0.1, pipDecimals: 1, minLot: 0.01, quoteCurrency: 'USD' },
  // Indices
  SP500: { symbol: 'SP500', name: 'S&P 500 Index', category: 'indices', contractSize: 50, pipSize: 0.1, pipDecimals: 1, minLot: 0.1, quoteCurrency: 'USD' },
  NAS100: { symbol: 'NAS100', name: 'Nasdaq 100 Index', category: 'indices', contractSize: 20, pipSize: 0.1, pipDecimals: 1, minLot: 0.1, quoteCurrency: 'USD' },
  US30: { symbol: 'US30', name: 'Dow Jones 30', category: 'indices', contractSize: 10, pipSize: 0.1, pipDecimals: 1, minLot: 0.1, quoteCurrency: 'USD' },
  // Stocks
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', contractSize: 100, pipSize: 0.01, pipDecimals: 2, minLot: 1, quoteCurrency: 'USD' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks', contractSize: 100, pipSize: 0.01, pipDecimals: 2, minLot: 1, quoteCurrency: 'USD' },
  // Energy
  BRENT: { symbol: 'BRENT', name: 'Brent Crude Oil', category: 'energy', contractSize: 1000, pipSize: 0.01, pipDecimals: 2, minLot: 0.01, quoteCurrency: 'USD' },
  CRUDE: { symbol: 'CRUDE', name: 'WTI Crude Oil', category: 'energy', contractSize: 1000, pipSize: 0.01, pipDecimals: 2, minLot: 0.01, quoteCurrency: 'USD' },
};

export const INSTRUMENT_LIST = Object.values(INSTRUMENTS);

export function getSpec(symbol: string): InstrumentSpec {
  return INSTRUMENTS[symbol] || {
    symbol,
    name: symbol,
    category: 'forex' as const,
    contractSize: 100000,
    pipSize: 0.0001,
    pipDecimals: 4,
    minLot: 0.01,
    quoteCurrency: 'USD',
  };
}

// Calculate pip distance between two prices for a given instrument.
export function pipDistance(symbol: string, a: number, b: number): number {
  const spec = getSpec(symbol);
  return Math.abs(a - b) / spec.pipSize;
}

// Calculate pip value per lot for a given instrument.
// For USD-quoted instruments, pipValue = pipSize * contractSize.
// For JPY-quoted instruments, pipValue is in JPY and converted to USD using current rate.
export function pipValuePerLot(symbol: string, rate?: number): number {
  const spec = getSpec(symbol);
  const basePipValue = spec.pipSize * spec.contractSize;
  if (spec.quoteCurrency === 'USD') return basePipValue;
  if (spec.quoteCurrency === 'JPY') {
    const r = rate || getSpec('USDJPY').pipSize * 100; // fallback rough rate
    return basePipValue / r;
  }
  return basePipValue;
}
