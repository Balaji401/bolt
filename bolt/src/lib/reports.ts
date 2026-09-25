import type { Trade, Strategy, PsychologyLog, TradingGoal, Habit, Mistake, RiskRules, DailyJournal } from './supabase';
import { computeMetrics, filterTrades, type Metrics, type FilterOptions } from './analytics';
import { computeRiskMetrics, type RiskMetrics } from './risk';
import { formatCurrency, formatDate, formatDuration } from './format';

export type ReportType = 'performance' | 'trade' | 'risk' | 'psychology' | 'strategy' | 'journal' | 'account' | 'ai_review' | 'custom';

export type ReportFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  accountId: string | null;
  instrument: string | null;
  strategy: string | null;
  session: string | null;
  timeframe: string | null;
  direction: string | null;
  setupType: string | null;
  tags: string[];
};

export type ReportSection = {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
};

export type PerformanceReportData = {
  metrics: Metrics;
  summary: { label: string; value: string }[];
  equityCurve: { date: string; cumulative: number; pnl: number }[];
};

export type TradeReportData = {
  trades: Trade[];
  totalTrades: number;
  summary: { label: string; value: string }[];
};

export type RiskReportData = {
  riskMetrics: RiskMetrics;
  riskRules: RiskRules | null;
  summary: { label: string; value: string }[];
  violations: { title: string; message: string; severity: string }[];
};

export type PsychologyReportData = {
  logs: PsychologyLog[];
  mistakes: Mistake[];
  summary: { label: string; value: string }[];
  patterns: string[];
  trends: { date: string; confidence: number; discipline: number | null; fomo: number | null }[];
};

export type StrategyReportData = {
  strategies: Strategy[];
  perStrategy: { name: string; trades: number; pnl: number; winRate: number; avgRr: number; profitFactor: number; avgWin: number; avgLoss: number }[];
  summary: { label: string; value: string }[];
};

export type JournalReportData = {
  totalTrades: number;
  journaledTrades: number;
  completionRate: number;
  lessons: { trade: Trade; lesson: string }[];
  mistakes: Mistake[];
  goals: TradingGoal[];
  habits: Habit[];
  dailyJournals: DailyJournal[];
  summary: { label: string; value: string }[];
};

export type AccountReportData = {
  accountName: string;
  startingBalance: number;
  currentBalance: number;
  metrics: Metrics;
  summary: { label: string; value: string }[];
};

export type ReportData =
  | { type: 'performance'; data: PerformanceReportData }
  | { type: 'trade'; data: TradeReportData }
  | { type: 'risk'; data: RiskReportData }
  | { type: 'psychology'; data: PsychologyReportData }
  | { type: 'strategy'; data: StrategyReportData }
  | { type: 'journal'; data: JournalReportData }
  | { type: 'account'; data: AccountReportData };

export const DEFAULT_SECTIONS: Record<ReportType, ReportSection[]> = {
  performance: [
    { id: 'summary', label: 'Summary Metrics', enabled: true, order: 0 },
    { id: 'equity', label: 'Equity Curve', enabled: true, order: 1 },
    { id: 'streaks', label: 'Streaks & Drawdown', enabled: true, order: 2 },
    { id: 'breakdown', label: 'Performance Breakdown', enabled: true, order: 3 },
  ],
  trade: [
    { id: 'summary', label: 'Trade Summary', enabled: true, order: 0 },
    { id: 'table', label: 'Trade Table', enabled: true, order: 1 },
    { id: 'statistics', label: 'Trade Statistics', enabled: true, order: 2 },
  ],
  risk: [
    { id: 'summary', label: 'Risk Summary', enabled: true, order: 0 },
    { id: 'violations', label: 'Risk Violations', enabled: true, order: 1 },
    { id: 'distribution', label: 'Risk Distribution', enabled: true, order: 2 },
    { id: 'consistency', label: 'Risk Consistency', enabled: true, order: 3 },
  ],
  psychology: [
    { id: 'summary', label: 'Psychology Summary', enabled: true, order: 0 },
    { id: 'patterns', label: 'Emotional Patterns', enabled: true, order: 1 },
    { id: 'trends', label: 'Psychology Trends', enabled: true, order: 2 },
    { id: 'mistakes', label: 'Common Mistakes', enabled: true, order: 3 },
  ],
  strategy: [
    { id: 'summary', label: 'Strategy Summary', enabled: true, order: 0 },
    { id: 'comparison', label: 'Strategy Comparison', enabled: true, order: 1 },
  ],
  journal: [
    { id: 'summary', label: 'Journal Summary', enabled: true, order: 0 },
    { id: 'lessons', label: 'Lessons Learned', enabled: true, order: 1 },
    { id: 'goals', label: 'Goals Progress', enabled: true, order: 2 },
    { id: 'habits', label: 'Habit Completion', enabled: true, order: 3 },
  ],
  account: [
    { id: 'summary', label: 'Account Summary', enabled: true, order: 0 },
    { id: 'performance', label: 'Performance Metrics', enabled: true, order: 1 },
  ],
  ai_review: [
    { id: 'summary', label: 'AI Summary', enabled: true, order: 0 },
    { id: 'insights', label: 'Key Insights', enabled: true, order: 1 },
    { id: 'improvements', label: 'Improvement Areas', enabled: true, order: 2 },
  ],
  custom: [
    { id: 'summary', label: 'Summary', enabled: true, order: 0 },
  ],
};

export const SYSTEM_TEMPLATES: { name: string; report_type: ReportType; description: string; sections: string[] }[] = [
  { name: 'Daily Trading Report', report_type: 'performance', description: 'Daily performance summary with key metrics', sections: ['summary', 'equity'] },
  { name: 'Weekly Trading Report', report_type: 'performance', description: 'Weekly performance review with breakdown', sections: ['summary', 'equity', 'streaks', 'breakdown'] },
  { name: 'Monthly Trading Report', report_type: 'performance', description: 'Monthly performance analysis', sections: ['summary', 'equity', 'streaks', 'breakdown'] },
  { name: 'Quarterly Trading Report', report_type: 'performance', description: 'Quarterly performance review', sections: ['summary', 'equity', 'streaks', 'breakdown'] },
  { name: 'Annual Trading Report', report_type: 'performance', description: 'Annual performance overview', sections: ['summary', 'equity', 'streaks', 'breakdown'] },
  { name: 'Account Performance Report', report_type: 'account', description: 'Individual account performance', sections: ['summary', 'performance'] },
  { name: 'Strategy Review', report_type: 'strategy', description: 'Strategy performance comparison', sections: ['summary', 'comparison'] },
  { name: 'Psychology Review', report_type: 'psychology', description: 'Trading psychology assessment', sections: ['summary', 'patterns', 'trends', 'mistakes'] },
  { name: 'Risk Assessment', report_type: 'risk', description: 'Risk management review', sections: ['summary', 'violations', 'distribution', 'consistency'] },
  { name: 'Trade Log Report', report_type: 'trade', description: 'Detailed trade-by-trade log', sections: ['summary', 'table', 'statistics'] },
  { name: 'Journal Review', report_type: 'journal', description: 'Journaling completeness review', sections: ['summary', 'lessons', 'goals', 'habits'] },
];

export function filtersToFilterOptions(filters: ReportFilters): FilterOptions {
  return {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    instrument: filters.instrument,
    strategy: filters.strategy,
    session: filters.session,
    direction: filters.direction,
    setupType: filters.setupType,
    tags: filters.tags.length > 0 ? filters.tags : null,
    timeframe: filters.timeframe,
  };
}

export function generatePerformanceReport(trades: Trade[], filters: ReportFilters): PerformanceReportData {
  const filtered = filterTrades(trades, filtersToFilterOptions(filters));
  const metrics = computeMetrics(filtered);
  const summary = [
    { label: 'Total Trades', value: String(metrics.totalTrades) },
    { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%` },
    { label: 'Net P&L', value: formatCurrency(metrics.totalPnl) },
    { label: 'Gross Profit', value: formatCurrency(metrics.grossProfit) },
    { label: 'Gross Loss', value: formatCurrency(-metrics.grossLoss) },
    { label: 'Profit Factor', value: metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2) },
    { label: 'Average Win', value: formatCurrency(metrics.avgWin) },
    { label: 'Average Loss', value: formatCurrency(-metrics.avgLoss) },
    { label: 'Average RR', value: metrics.avgRr.toFixed(2) },
    { label: 'Expectancy', value: formatCurrency(metrics.expectancy) },
    { label: 'Max Win Streak', value: String(metrics.maxWinStreak) },
    { label: 'Max Loss Streak', value: String(metrics.maxLossStreak) },
    { label: 'Avg Hold Time', value: metrics.avgHoldTime > 0 ? formatDuration(metrics.avgHoldTime) : 'N/A' },
    { label: 'Avg Trades/Day', value: metrics.avgTradesPerDay.toFixed(1) },
  ];
  return { metrics, summary, equityCurve: metrics.equity };
}

export function generateTradeReport(trades: Trade[], filters: ReportFilters): TradeReportData {
  const filtered = filterTrades(trades, filtersToFilterOptions(filters));
  const metrics = computeMetrics(filtered);
  const summary = [
    { label: 'Total Trades', value: String(filtered.length) },
    { label: 'Closed Trades', value: String(metrics.totalTrades) },
    { label: 'Open Trades', value: String(filtered.filter((t) => t.status === 'open').length) },
    { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%` },
    { label: 'Net P&L', value: formatCurrency(metrics.totalPnl) },
    { label: 'Avg RR', value: metrics.avgRr.toFixed(2) },
  ];
  return { trades: filtered, totalTrades: filtered.length, summary };
}

export function generateRiskReport(
  trades: Trade[],
  filters: ReportFilters,
  accountBalance: number,
  riskRules: RiskRules | null,
): RiskReportData {
  const filtered = filterTrades(trades, filtersToFilterOptions(filters));
  const metrics = computeMetrics(filtered);
  const rules = riskRules || {
    id: '', user_id: '', workspace_id: '',
    max_daily_loss_pct: 3, max_weekly_loss_pct: 6, max_monthly_loss_pct: 10,
    max_risk_per_trade_pct: 2, max_open_trades: 5, max_daily_trades: 10,
    max_position_size_pct: 10, stop_after_losses: 3, stop_after_daily_loss: true,
    warning_threshold_pct: 80, created_at: '', updated_at: '',
  };
  const riskMetrics = computeRiskMetrics(filtered, accountBalance, rules, metrics);
  const summary = [
    { label: 'Avg Risk Per Trade', value: `${riskMetrics.avgRiskPct.toFixed(2)}%` },
    { label: 'Largest Risk Taken', value: formatCurrency(riskMetrics.largestRiskTaken) },
    { label: 'Max Drawdown', value: `${riskMetrics.maxDrawdown.toFixed(2)}%` },
    { label: 'Current Drawdown', value: `${riskMetrics.currentDrawdown.toFixed(2)}%` },
    { label: 'Daily Risk Used', value: formatCurrency(riskMetrics.dailyRiskUsed) },
    { label: 'Weekly Risk Used', value: formatCurrency(riskMetrics.weeklyRiskUsed) },
    { label: 'Monthly Risk Used', value: formatCurrency(riskMetrics.monthlyRiskUsed) },
    { label: 'Risk Consistency', value: `${riskMetrics.riskConsistency.toFixed(1)}%` },
    { label: 'Over-Risking Frequency', value: `${riskMetrics.overRiskingFrequency.toFixed(1)}%` },
    { label: 'Max Consecutive Losses', value: String(metrics.maxLossStreak) },
  ];
  const violations: { title: string; message: string; severity: string }[] = [];
  if (riskMetrics.overRiskingFrequency > 20) violations.push({ title: 'Frequent Over-Risking', message: `${riskMetrics.overRiskingFrequency.toFixed(1)}% of trades exceed your max risk per trade.`, severity: 'warning' });
  if (metrics.maxLossStreak >= 5) violations.push({ title: 'Long Losing Streak', message: `Max losing streak of ${metrics.maxLossStreak} trades detected.`, severity: 'critical' });
  if (riskMetrics.maxDrawdown < -10) violations.push({ title: 'Significant Drawdown', message: `Max drawdown of ${riskMetrics.maxDrawdown.toFixed(2)}% detected.`, severity: 'critical' });
  if (riskMetrics.riskConsistency < 50) violations.push({ title: 'Inconsistent Risk Sizing', message: `Risk consistency is ${riskMetrics.riskConsistency.toFixed(1)}% — aim for higher consistency.`, severity: 'warning' });
  return { riskMetrics, riskRules: rules, summary, violations };
}

export function generatePsychologyReport(
  psychologyLogs: PsychologyLog[],
  mistakes: Mistake[],
): PsychologyReportData {
  const logs = [...psychologyLogs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  const avg = (key: keyof PsychologyLog) => {
    const vals = logs.map((l) => l[key]).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const summary = [
    { label: 'Psychology Logs', value: String(logs.length) },
    { label: 'Avg Confidence', value: `${avg('confidence').toFixed(1)}/10` },
    { label: 'Avg Discipline', value: `${avg('discipline').toFixed(1)}/10` },
    { label: 'Avg FOMO', value: `${avg('fomo').toFixed(1)}/10` },
    { label: 'Avg Patience', value: `${avg('patience').toFixed(1)}/10` },
    { label: 'Tracked Mistakes', value: String(mistakes.length) },
    { label: 'Total Mistake Occurrences', value: String(mistakes.reduce((s, m) => s + m.frequency, 0)) },
  ];
  const patterns: string[] = [];
  if (avg('fomo') > 5) patterns.push('High FOMO tendency detected — consider waiting for setups rather than chasing');
  if (avg('discipline') < 5) patterns.push('Low discipline self-rating — reinforce pre-trade checklist usage');
  if (avg('confidence') < 5) patterns.push('Low confidence levels — review your winning trades to rebuild conviction');
  if (avg('patience') < 5) patterns.push('Low patience — practice waiting for A+ setups only');
  const allViolations = logs.flatMap((l) => l.rule_violations || []);
  if (allViolations.length > 0) {
    const counts: Record<string, number> = {};
    for (const v of allViolations) counts[v] = (counts[v] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    patterns.push(`Most common rule violation: "${top[0]}" (${top[1]} times)`);
  }
  const trends = logs.slice(0, 30).reverse().map((l) => ({
    date: l.log_date,
    confidence: l.confidence,
    discipline: l.discipline,
    fomo: l.fomo,
  }));
  return { logs, mistakes, summary, patterns, trends };
}

export function generateStrategyReport(
  trades: Trade[],
  strategies: Strategy[],
  filters: ReportFilters,
): StrategyReportData {
  const filtered = filterTrades(trades, filtersToFilterOptions(filters));
  const perStrategy = strategies.map((s) => {
    const stratTrades = filtered.filter((t) => (t.strategy_tags || []).includes(s.name));
    const m = computeMetrics(stratTrades);
    return {
      name: s.name,
      trades: m.totalTrades,
      pnl: m.totalPnl,
      winRate: m.winRate,
      avgRr: m.avgRr,
      profitFactor: m.profitFactor,
      avgWin: m.avgWin,
      avgLoss: m.avgLoss,
    };
  }).filter((s) => s.trades > 0);
  const summary = [
    { label: 'Strategies Tracked', value: String(strategies.length) },
    { label: 'Strategies With Trades', value: String(perStrategy.length) },
    { label: 'Best Strategy', value: perStrategy.length > 0 ? perStrategy.sort((a, b) => b.pnl - a.pnl)[0].name : 'N/A' },
    { label: 'Worst Strategy', value: perStrategy.length > 0 ? perStrategy.sort((a, b) => a.pnl - b.pnl)[0].name : 'N/A' },
  ];
  return { strategies, perStrategy, summary };
}

export function generateJournalReport(
  trades: Trade[],
  mistakes: Mistake[],
  goals: TradingGoal[],
  habits: Habit[],
  dailyJournals: DailyJournal[],
  filters: ReportFilters,
): JournalReportData {
  const filtered = filterTrades(trades, filtersToFilterOptions(filters));
  const journaled = filtered.filter((t) => t.before_notes || t.during_notes || t.after_notes);
  const completionRate = filtered.length > 0 ? (journaled.length / filtered.length) * 100 : 0;
  const lessons = filtered
    .filter((t) => t.lessons_learned)
    .map((t) => ({ trade: t, lesson: t.lessons_learned! }))
    .slice(0, 50);
  const summary = [
    { label: 'Total Trades', value: String(filtered.length) },
    { label: 'Journaled Trades', value: String(journaled.length) },
    { label: 'Completion Rate', value: `${completionRate.toFixed(0)}%` },
    { label: 'Lessons Captured', value: String(lessons.length) },
    { label: 'Tracked Mistakes', value: String(mistakes.length) },
    { label: 'Active Goals', value: String(goals.filter((g) => !g.completed).length) },
    { label: 'Completed Goals', value: String(goals.filter((g) => g.completed).length) },
    { label: 'Active Habits', value: String(habits.filter((h) => h.active).length) },
    { label: 'Daily Journals', value: String(dailyJournals.length) },
  ];
  return { totalTrades: filtered.length, journaledTrades: journaled.length, completionRate, lessons, mistakes, goals, habits, dailyJournals, summary };
}

export function generateAccountReport(
  trades: Trade[],
  accountName: string,
  startingBalance: number,
  currentBalance: number,
  filters: ReportFilters,
): AccountReportData {
  const filtered = filterTrades(trades, filtersToFilterOptions(filters));
  const metrics = computeMetrics(filtered);
  const summary = [
    { label: 'Account', value: accountName },
    { label: 'Starting Balance', value: formatCurrency(startingBalance) },
    { label: 'Current Balance', value: formatCurrency(currentBalance) },
    { label: 'Net P&L', value: formatCurrency(metrics.totalPnl) },
    { label: 'Total Trades', value: String(metrics.totalTrades) },
    { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%` },
    { label: 'Profit Factor', value: metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2) },
    { label: 'Avg RR', value: metrics.avgRr.toFixed(2) },
    { label: 'Max Win Streak', value: String(metrics.maxWinStreak) },
    { label: 'Max Loss Streak', value: String(metrics.maxLossStreak) },
  ];
  return { accountName, startingBalance, currentBalance, metrics, summary };
}

export function exportReportCSV(reportType: ReportType, data: ReportData): string {
  if (data.type === 'performance') {
    const lines = ['Metric,Value'];
    data.data.summary.forEach((s) => lines.push(`${s.label},${s.value}`));
    return lines.join('\n');
  }
  if (data.type === 'trade') {
    const headers = ['Date', 'Instrument', 'Direction', 'Entry', 'Exit', 'PnL', 'RR', 'Status', 'Session', 'Strategy'];
    const rows = data.data.trades.map((t) => [
      t.executed_at, t.instrument, t.direction, t.entry_price, t.exit_price ?? '',
      t.pnl, t.rr, t.status, t.session ?? '', (t.strategy_tags || []).join('; '),
    ]);
    return [headers, ...rows].map((r) => r.map((c) => String(c ?? '').includes(',') ? `"${c}"` : String(c ?? '')).join(',')).join('\n');
  }
  if (data.type === 'risk' || data.type === 'psychology' || data.type === 'strategy' || data.type === 'journal' || data.type === 'account') {
    const summary = (data.data as { summary: { label: string; value: string }[] }).summary;
    const lines = ['Metric,Value'];
    summary.forEach((s) => lines.push(`${s.label},${s.value}`));
    return lines.join('\n');
  }
  return '';
}

export function exportReportExcel(reportType: ReportType, data: ReportData): string {
  if (data.type === 'trade') {
    const headers = ['Date', 'Instrument', 'Direction', 'Entry', 'Exit', 'PnL', 'RR', 'Status', 'Session', 'Strategy'];
    const rows = data.data.trades.map((t) => [
      t.executed_at, t.instrument, t.direction, t.entry_price, t.exit_price ?? '',
      t.pnl, t.rr, t.status, t.session ?? '', (t.strategy_tags || []).join('; '),
    ]);
    return `<table xmlns:x="urn:schemas-microsoft-com:office:excel"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  const summary = (data.data as { summary: { label: string; value: string }[] }).summary;
  return `<table xmlns:x="urn:schemas-microsoft-com:office:excel"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${summary.map((s) => `<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join('')}</tbody></table>`;
}

export function generateReportHTML(name: string, reportType: ReportType, data: ReportData, sections: string[], includeAI: boolean): string {
  const sectionHtml: string[] = [];
  const renderSummary = (summary: { label: string; value: string }[]) =>
    `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tbody>${summary.map((s) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666;">${s.label}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:600;text-align:right;">${s.value}</td></tr>`).join('')}</tbody></table>`;

  for (const sectionId of sections) {
    if (data.type === 'performance') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Summary Metrics</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'equity') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Equity Curve</h3><p style="font-size:13px;color:#666;">${data.data.equityCurve.length} data points from ${data.data.equityCurve[0]?.date || 'N/A'} to ${data.data.equityCurve[data.data.equityCurve.length - 1]?.date || 'N/A'}</p>`);
      if (sectionId === 'streaks') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Streaks & Drawdown</h3><p style="font-size:13px;color:#666;">Max Win Streak: ${data.data.metrics.maxWinStreak} | Max Loss Streak: ${data.data.metrics.maxLossStreak} | Current Streak: ${data.data.metrics.currentStreak}</p>`);
      if (sectionId === 'breakdown') {
        const bySession = Object.entries(data.data.metrics.bySession).map(([k, v]) => `<tr><td style="padding:4px 8px;font-size:12px;">${k}</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${v.trades}</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${formatCurrency(v.pnl)}</td></tr>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Performance Breakdown</h3><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="padding:4px 8px;font-size:12px;text-align:left;">Session</th><th style="padding:4px 8px;font-size:12px;text-align:right;">Trades</th><th style="padding:4px 8px;font-size:12px;text-align:right;">P&L</th></tr></thead><tbody>${bySession}</tbody></table>`);
      }
    } else if (data.type === 'trade') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Trade Summary</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'table') {
        const rows = data.data.trades.slice(0, 50).map((t) => `<tr><td style="padding:4px 8px;font-size:11px;">${formatDate(t.executed_at)}</td><td style="padding:4px 8px;font-size:11px;">${t.instrument}</td><td style="padding:4px 8px;font-size:11px;">${t.direction}</td><td style="padding:4px 8px;font-size:11px;text-align:right;">${t.pnl}</td><td style="padding:4px 8px;font-size:11px;text-align:right;">${t.rr}</td><td style="padding:4px 8px;font-size:11px;">${t.status}</td></tr>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Trade Table (${Math.min(data.data.trades.length, 50)} of ${data.data.trades.length})</h3><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="padding:4px 8px;font-size:11px;text-align:left;">Date</th><th style="padding:4px 8px;font-size:11px;text-align:left;">Instrument</th><th style="padding:4px 8px;font-size:11px;text-align:left;">Dir</th><th style="padding:4px 8px;font-size:11px;text-align:right;">PnL</th><th style="padding:4px 8px;font-size:11px;text-align:right;">RR</th><th style="padding:4px 8px;font-size:11px;text-align:left;">Status</th></tr></thead><tbody>${rows}</tbody></table>`);
      }
      if (sectionId === 'statistics') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Trade Statistics</h3>${renderSummary(data.data.summary)}`);
    } else if (data.type === 'risk') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Risk Summary</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'violations') {
        const v = data.data.violations.map((v) => `<li style="font-size:12px;color:${v.severity === 'critical' ? '#dc2626' : '#f59e0b'};">${v.title}: ${v.message}</li>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Risk Violations</h3><ul>${v || '<li style="font-size:12px;color:#666;">No violations detected.</li>'}</ul>`);
      }
      if (sectionId === 'distribution') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Risk Distribution</h3><p style="font-size:12px;color:#666;">Avg Risk: ${data.data.riskMetrics.avgRiskPct.toFixed(2)}% | Over-Risking: ${data.data.riskMetrics.overRiskingFrequency.toFixed(1)}%</p>`);
      if (sectionId === 'consistency') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Risk Consistency</h3><p style="font-size:12px;color:#666;">Consistency Score: ${data.data.riskMetrics.riskConsistency.toFixed(1)}%</p>`);
    } else if (data.type === 'psychology') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Psychology Summary</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'patterns') {
        const p = data.data.patterns.map((p) => `<li style="font-size:12px;color:#666;">${p}</li>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Emotional Patterns</h3><ul>${p || '<li style="font-size:12px;color:#666;">No significant patterns detected.</li>'}</ul>`);
      }
      if (sectionId === 'trends') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Psychology Trends</h3><p style="font-size:12px;color:#666;">${data.data.trends.length} data points tracked over time.</p>`);
      if (sectionId === 'mistakes') {
        const m = data.data.mistakes.slice(0, 10).map((m) => `<li style="font-size:12px;color:#666;">${m.name} (${m.frequency}x) — ${m.solution || 'No solution set'}</li>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Common Mistakes</h3><ul>${m || '<li style="font-size:12px;color:#666;">No mistakes tracked.</li>'}</ul>`);
      }
    } else if (data.type === 'strategy') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Strategy Summary</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'comparison') {
        const rows = data.data.perStrategy.map((s) => `<tr><td style="padding:4px 8px;font-size:12px;">${s.name}</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${s.trades}</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${formatCurrency(s.pnl)}</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${s.winRate.toFixed(0)}%</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${s.avgRr.toFixed(2)}</td><td style="padding:4px 8px;font-size:12px;text-align:right;">${isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '∞'}</td></tr>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Strategy Comparison</h3><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="padding:4px 8px;font-size:12px;text-align:left;">Strategy</th><th style="padding:4px 8px;font-size:12px;text-align:right;">Trades</th><th style="padding:4px 8px;font-size:12px;text-align:right;">P&L</th><th style="padding:4px 8px;font-size:12px;text-align:right;">WR</th><th style="padding:4px 8px;font-size:12px;text-align:right;">RR</th><th style="padding:4px 8px;font-size:12px;text-align:right;">PF</th></tr></thead><tbody>${rows}</tbody></table>`);
      }
    } else if (data.type === 'journal') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Journal Summary</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'lessons') {
        const l = data.data.lessons.slice(0, 20).map((l) => `<li style="font-size:12px;color:#666;"><strong>${l.trade.instrument}</strong> (${formatDate(l.trade.executed_at)}): ${l.lesson}</li>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Lessons Learned</h3><ul>${l || '<li style="font-size:12px;color:#666;">No lessons captured yet.</li>'}</ul>`);
      }
      if (sectionId === 'goals') {
        const g = data.data.goals.map((g) => `<li style="font-size:12px;color:#666;">${g.title} — ${g.completed ? 'Completed' : `${g.current_value}/${g.target_value} (${((g.current_value / g.target_value) * 100).toFixed(0)}%)`}</li>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Goals Progress</h3><ul>${g || '<li style="font-size:12px;color:#666;">No goals set.</li>'}</ul>`);
      }
      if (sectionId === 'habits') {
        const h = data.data.habits.map((h) => `<li style="font-size:12px;color:#666;">${h.name} — ${h.active ? 'Active' : 'Inactive'}</li>`).join('');
        sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Habit Tracking</h3><ul>${h || '<li style="font-size:12px;color:#666;">No habits tracked.</li>'}</ul>`);
      }
    } else if (data.type === 'account') {
      if (sectionId === 'summary') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Account Summary</h3>${renderSummary(data.data.summary)}`);
      if (sectionId === 'performance') sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">Performance Metrics</h3><p style="font-size:12px;color:#666;">Win Rate: ${data.data.metrics.winRate.toFixed(1)}% | Profit Factor: ${data.data.metrics.profitFactor.toFixed(2)} | Avg RR: ${data.data.metrics.avgRr.toFixed(2)}</p>`);
    }
  }

  if (includeAI) {
    sectionHtml.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;">AI Summary</h3><p style="font-size:12px;color:#666;font-style:italic;">AI summary is generated on demand from your trading data. This section will be populated when AI review is enabled during report generation.</p>`);
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name}</title><style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; background: white; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #888; margin-bottom: 24px; }
    h3 { border-bottom: 2px solid #f0f0f0; padding-bottom: 4px; }
    @media print { body { padding: 20px; } }
  </style></head><body>
    <h1>${name}</h1>
    <div class="meta">Generated on ${formatDate(new Date())} | TraderOS Reports</div>
    ${sectionHtml.join('\n')}
  </body></html>`;
}
