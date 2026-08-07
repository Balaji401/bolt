import type { Trade } from './supabase';
import type { Metrics } from './analytics';
import { formatCurrency } from './format';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'image';

export function exportTradesCSV(trades: Trade[], filename = 'traderos-trades') {
  const headers = [
    'Instrument', 'Direction', 'Entry Price', 'Exit Price', 'Quantity',
    'Stop Loss', 'Take Profit', 'PnL', 'RR', 'Status', 'Session',
    'Strategy Tags', 'Executed At', 'Closed At', 'Market', 'Timeframe',
    'Source', 'Broker Trade ID',
  ];
  const rows = trades.map((t) => [
    t.instrument, t.direction, t.entry_price, t.exit_price ?? '',
    t.quantity, t.stop_loss ?? '', t.take_profit ?? '',
    t.pnl, t.rr, t.status, t.session ?? '',
    (t.strategy_tags || []).join('; '), t.executed_at, t.closed_at ?? '',
    t.market ?? '', t.timeframe ?? '', t.source ?? '', t.broker_trade_id ?? '',
  ]);
  const csv = [headers, ...rows].map((row) =>
    row.map((cell) => {
      const s = String(cell ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  ).join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

export function exportMetricsCSV(metrics: Metrics, filename = 'traderos-metrics') {
  const rows: [string, string][] = [
    ['Total Trades', String(metrics.totalTrades)],
    ['Win Rate', `${metrics.winRate.toFixed(1)}%`],
    ['Loss Rate', `${metrics.lossRate.toFixed(1)}%`],
    ['Breakeven Rate', `${metrics.breakevenRate.toFixed(1)}%`],
    ['Net Profit', formatCurrency(metrics.totalPnl)],
    ['Gross Profit', formatCurrency(metrics.grossProfit)],
    ['Gross Loss', formatCurrency(-metrics.grossLoss)],
    ['Profit Factor', metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)],
    ['Average RR', metrics.avgRr.toFixed(2)],
    ['Expectancy', formatCurrency(metrics.expectancy)],
    ['Average Win', formatCurrency(metrics.avgWin)],
    ['Average Loss', formatCurrency(-metrics.avgLoss)],
    ['Largest Win', formatCurrency(metrics.largestWin)],
    ['Largest Loss', formatCurrency(metrics.largestLoss)],
    ['Max Win Streak', String(metrics.maxWinStreak)],
    ['Max Loss Streak', String(metrics.maxLossStreak)],
    ['Current Streak', String(metrics.currentStreak)],
    ['Avg Hold Time (min)', String(Math.round(metrics.avgHoldTime))],
    ['Avg Trades/Day', metrics.avgTradesPerDay.toFixed(1)],
  ];
  const csv = ['Metric,Value', ...rows.map(([k, v]) => `${k},${v}`)].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

export function exportTradesExcel(trades: Trade[], filename = 'traderos-trades') {
  const headers = ['Instrument', 'Direction', 'Entry', 'Exit', 'Qty', 'PnL', 'RR', 'Status', 'Session', 'Executed At', 'Closed At'];
  const rows = trades.map((t) => [
    t.instrument, t.direction, t.entry_price, t.exit_price ?? '',
    t.quantity, t.pnl, t.rr, t.status, t.session ?? '',
    t.executed_at, t.closed_at ?? '',
  ]);
  const html = `<table xmlns:x="urn:schemas-microsoft-com:office:excel"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel');
}

export function exportPDF(title: string, content: HTMLElement, filename = 'traderos-report') {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((el) => el.outerHTML).join('\n');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>${styles}<style>@media print { body { padding: 20px; } }</style></head><body><h1 style="font-size:20px;font-weight:600;margin-bottom:16px;">${title}</h1>${content.outerHTML}<script>window.onload=function(){window.print();}</script></body></html>`);
  win.document.close();
}

export function exportChartImage(chartContainer: HTMLElement, filename = 'traderos-chart') {
  const svg = chartContainer.querySelector('svg');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = new Image();
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${filename}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }
      URL.revokeObjectURL(url);
    });
  };
  img.src = url;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
