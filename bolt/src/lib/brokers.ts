import type { Trade } from '@/lib/supabase';

export type BrokerFormat = 'mt4' | 'mt5' | 'ctrader' | 'dxtrade' | 'matchtrader' | 'generic_csv';

export type BrokerAdapter = {
  id: BrokerFormat;
  label: string;
  description: string;
  fileTypes: string[];
  maxFileSize: number;
  delimiter: ',' | ';' | '\t' | '|';
  encoding: string;
  skipRows: number;
  columnMapping: Record<string, string>;
  parseRow: (row: Record<string, string>, mapping: Record<string, string>) => ParsedTrade | null;
};

export type ParsedTrade = {
  instrument: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number;
  rr: number;
  status: 'open' | 'closed' | 'pending';
  session: 'asia' | 'london' | 'new_york' | 'sydney' | 'other' | null;
  strategy_tags: string[];
  executed_at: string;
  closed_at: string | null;
  broker_trade_id: string | null;
  source: string;
};

export const BROKER_ADAPTERS: Record<BrokerFormat, BrokerAdapter> = {
  mt4: {
    id: 'mt4',
    label: 'MetaTrader 4',
    description: 'MT4 History Report CSV export',
    fileTypes: ['.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 0,
    columnMapping: {
      'Ticket': 'broker_trade_id',
      'Open Time': 'executed_at',
      'Type': 'direction',
      'Item': 'instrument',
      'Price': 'entry_price',
      'S / L': 'stop_loss',
      'T / P': 'take_profit',
      'Volume': 'quantity',
      'Close Time': 'closed_at',
      'Close Price': 'exit_price',
      'Profit': 'pnl',
    },
    parseRow: (row, mapping) => parseGenericRow(row, mapping, 'mt4'),
  },
  mt5: {
    id: 'mt5',
    label: 'MetaTrader 5',
    description: 'MT5 Deal History CSV export',
    fileTypes: ['.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 0,
    columnMapping: {
      'Ticket': 'broker_trade_id',
      'Time': 'executed_at',
      'Type': 'direction',
      'Instrument': 'instrument',
      'Price': 'entry_price',
      'Volume': 'quantity',
      'S/L': 'stop_loss',
      'T/P': 'take_profit',
      'Time.1': 'closed_at',
      'Price.1': 'exit_price',
      'Profit': 'pnl',
    },
    parseRow: (row, mapping) => parseGenericRow(row, mapping, 'mt5'),
  },
  ctrader: {
    id: 'ctrader',
    label: 'cTrader',
    description: 'cTrader Trade History CSV export',
    fileTypes: ['.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 1,
    columnMapping: {
      'Position ID': 'broker_trade_id',
      'Open Time': 'executed_at',
      'Direction': 'direction',
      'Symbol': 'instrument',
      'Volume': 'quantity',
      'Open Price': 'entry_price',
      'Close Time': 'closed_at',
      'Close Price': 'exit_price',
      'Stop Loss': 'stop_loss',
      'Take Profit': 'take_profit',
      'PnL': 'pnl',
    },
    parseRow: (row, mapping) => parseGenericRow(row, mapping, 'ctrader'),
  },
  dxtrade: {
    id: 'dxtrade',
    label: 'DXtrade',
    description: 'DXtrade History CSV export',
    fileTypes: ['.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 0,
    columnMapping: {
      'Trade ID': 'broker_trade_id',
      'Open Time': 'executed_at',
      'Side': 'direction',
      'Symbol': 'instrument',
      'Open Price': 'entry_price',
      'Volume': 'quantity',
      'Close Time': 'closed_at',
      'Close Price': 'exit_price',
      'SL': 'stop_loss',
      'TP': 'take_profit',
      'Profit': 'pnl',
    },
    parseRow: (row, mapping) => parseGenericRow(row, mapping, 'dxtrade'),
  },
  matchtrader: {
    id: 'matchtrader',
    label: 'Match-Trader',
    description: 'Match-Trader History CSV export',
    fileTypes: ['.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 0,
    columnMapping: {
      'OrderID': 'broker_trade_id',
      'OpenTime': 'executed_at',
      'Type': 'direction',
      'Symbol': 'instrument',
      'OpenPrice': 'entry_price',
      'Lots': 'quantity',
      'CloseTime': 'closed_at',
      'ClosePrice': 'exit_price',
      'StopLoss': 'stop_loss',
      'TakeProfit': 'take_profit',
      'Profit': 'pnl',
    },
    parseRow: (row, mapping) => parseGenericRow(row, mapping, 'matchtrader'),
  },
  generic_csv: {
    id: 'generic_csv',
    label: 'Generic CSV',
    description: 'Custom CSV format with manual column mapping',
    fileTypes: ['.csv', '.txt'],
    maxFileSize: 10 * 1024 * 1024,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 0,
    columnMapping: {
      'Instrument': 'instrument',
      'Direction': 'direction',
      'Entry Price': 'entry_price',
      'Exit Price': 'exit_price',
      'Quantity': 'quantity',
      'Stop Loss': 'stop_loss',
      'Take Profit': 'take_profit',
      'P&L': 'pnl',
      'Open Time': 'executed_at',
      'Close Time': 'closed_at',
      'Trade ID': 'broker_trade_id',
    },
    parseRow: (row, mapping) => parseGenericRow(row, mapping, 'csv'),
  },
};

export const BROKER_LIST = Object.values(BROKER_ADAPTERS);

function parseGenericRow(row: Record<string, string>, mapping: Record<string, string>, source: string): ParsedTrade | null {
  const get = (field: string): string | undefined => {
    for (const [csvCol, mappedField] of Object.entries(mapping)) {
      if (mappedField === field) return row[csvCol];
    }
    return undefined;
  };

  const instrument = (get('instrument') || '').trim().toUpperCase();
  if (!instrument) return null;

  const dirRaw = (get('direction') || '').trim().toLowerCase();
  let direction: 'long' | 'short' = 'long';
  if (dirRaw.includes('sell') || dirRaw.includes('short')) direction = 'short';
  else if (dirRaw.includes('buy') || dirRaw.includes('long')) direction = 'long';

  const entryPrice = parseFloat(get('entry_price') || '0');
  if (!entryPrice || entryPrice <= 0) return null;

  const exitPriceRaw = get('exit_price');
  const exitPrice = exitPriceRaw ? parseFloat(exitPriceRaw) : null;

  const quantity = parseFloat(get('quantity') || '1') || 1;
  const stopLoss = get('stop_loss') ? parseFloat(get('stop_loss')!) : null;
  const takeProfit = get('take_profit') ? parseFloat(get('take_profit')!) : null;
  const pnl = parseFloat(get('pnl') || '0') || 0;

  const executedAt = parseDate(get('executed_at'));
  if (!executedAt) return null;

  const closedAtRaw = get('closed_at');
  const closedAt = closedAtRaw ? parseDate(closedAtRaw) : null;

  const brokerTradeId = get('broker_trade_id') || null;

  const rr = stopLoss && entryPrice
    ? Math.abs((exitPrice || 0) - entryPrice) / Math.abs(entryPrice - stopLoss)
    : 0;

  const status: 'open' | 'closed' | 'pending' = closedAt ? 'closed' : 'open';
  const session = detectSession(executedAt);

  return {
    instrument,
    direction,
    entry_price: entryPrice,
    exit_price: exitPrice,
    quantity,
    stop_loss: stopLoss,
    take_profit: takeProfit,
    pnl,
    rr: isFinite(rr) ? Math.round(rr * 100) / 100 : 0,
    status,
    session,
    strategy_tags: [],
    executed_at: executedAt,
    closed_at: closedAt,
    broker_trade_id: brokerTradeId,
    source,
  };
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    const parts = trimmed.split(/[/.\- ]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      if (day && month && year) d = new Date(year, month - 1, day);
    }
  }
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function detectSession(isoDate: string): 'asia' | 'london' | 'new_york' | 'sydney' | 'other' {
  const hour = new Date(isoDate).getUTCHours();
  if (hour >= 0 && hour < 9) return 'asia';
  if (hour >= 7 && hour < 16) return 'london';
  if (hour >= 13 && hour < 22) return 'new_york';
  if (hour >= 21 || hour < 6) return 'sydney';
  return 'other';
}

export function parseCSV(text: string, delimiter: string, skipRows: number): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.slice(skipRows);
  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const dataRows = rows.slice(1);

  const parsed = dataRows.map((line) => {
    const values = line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });

  return { headers, rows: parsed };
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || '';
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch]++;
  }
  let best = ',';
  let bestCount = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > bestCount) { best = delim; bestCount = count; }
  }
  return best;
}

export function detectBrokerFormat(headers: string[]): BrokerFormat {
  const headerStr = headers.join(' ').toLowerCase();
  if (headerStr.includes('s / l') || headerStr.includes('ticket') && headerStr.includes('item')) return 'mt4';
  if (headerStr.includes('s/l') && headerStr.includes('t/p') && headerStr.includes('instrument')) return 'mt5';
  if (headerStr.includes('position id') || headerStr.includes('cTrader'.toLowerCase())) return 'ctrader';
  if (headerStr.includes('trade id') && headerStr.includes('dxtrade')) return 'dxtrade';
  if (headerStr.includes('orderid') || headerStr.includes('matchtrader')) return 'matchtrader';
  return 'generic_csv';
}

export type ValidationResult = {
  valid: ParsedTrade[];
  invalid: { row: Record<string, string>; rowNumber: number; error: string }[];
  duplicates: { trade: ParsedTrade; rowNumber: number; existingTrade: Trade }[];
};

export function validateTrades(
  parsed: ParsedTrade[],
  existingTrades: Trade[],
  options: { skipDuplicates: boolean; replaceDuplicates: boolean }
): ValidationResult {
  const valid: ParsedTrade[] = [];
  const invalid: { row: Record<string, string>; rowNumber: number; error: string }[] = [];
  const duplicates: { trade: ParsedTrade; rowNumber: number; existingTrade: Trade }[] = [];

  parsed.forEach((trade, idx) => {
    const rowNumber = idx + 2;

    if (!trade.instrument) {
      invalid.push({ row: {}, rowNumber, error: 'Missing instrument' });
      return;
    }
    if (!trade.entry_price || trade.entry_price <= 0) {
      invalid.push({ row: {}, rowNumber, error: 'Invalid entry price' });
      return;
    }
    if (!trade.executed_at) {
      invalid.push({ row: {}, rowNumber, error: 'Missing or invalid open time' });
      return;
    }

    const dup = existingTrades.find((et) => isDuplicate(trade, et));
    if (dup) {
      duplicates.push({ trade, rowNumber, existingTrade: dup });
      if (options.skipDuplicates) return;
      if (options.replaceDuplicates) {
        valid.push(trade);
        return;
      }
      return;
    }

    valid.push(trade);
  });

  return { valid, invalid, duplicates };
}

function isDuplicate(parsed: ParsedTrade, existing: Trade): boolean {
  if (parsed.broker_trade_id && existing.broker_trade_id && parsed.broker_trade_id === existing.broker_trade_id) return true;

  const sameInstrument = parsed.instrument === existing.instrument.toUpperCase();
  const sameDirection = parsed.direction === existing.direction;
  const sameEntry = Math.abs(parsed.entry_price - Number(existing.entry_price)) < 0.00001;
  const sameQuantity = Math.abs(parsed.quantity - Number(existing.quantity)) < 0.00001;
  const sameOpenTime = new Date(parsed.executed_at).getTime() === new Date(existing.executed_at).getTime();

  return sameInstrument && sameDirection && sameEntry && sameQuantity && sameOpenTime;
}

export type ImportField = 'instrument' | 'direction' | 'entry_price' | 'exit_price' | 'quantity' | 'stop_loss' | 'take_profit' | 'pnl' | 'executed_at' | 'closed_at' | 'broker_trade_id';

export const IMPORT_FIELDS: { field: ImportField; label: string; required: boolean }[] = [
  { field: 'instrument', label: 'Instrument', required: true },
  { field: 'direction', label: 'Direction', required: true },
  { field: 'entry_price', label: 'Entry Price', required: true },
  { field: 'exit_price', label: 'Exit Price', required: false },
  { field: 'quantity', label: 'Lot Size / Volume', required: true },
  { field: 'stop_loss', label: 'Stop Loss', required: false },
  { field: 'take_profit', label: 'Take Profit', required: false },
  { field: 'pnl', label: 'P&L / Profit', required: false },
  { field: 'executed_at', label: 'Open Time', required: true },
  { field: 'closed_at', label: 'Close Time', required: false },
  { field: 'broker_trade_id', label: 'Trade ID / Ticket', required: false },
];
