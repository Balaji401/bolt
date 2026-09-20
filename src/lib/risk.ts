import type { Trade, RiskRules, RiskAlert } from './supabase';
import { computeMetrics, type Metrics } from './analytics';

export type RiskMetrics = {
  accountBalance: number;
  accountEquity: number;
  dailyRiskUsed: number;
  weeklyRiskUsed: number;
  monthlyRiskUsed: number;
  totalExposure: number;
  avgRiskPerTrade: number;
  largestRiskTaken: number;
  maxDrawdown: number;
  currentDrawdown: number;
  recoveryProgress: number;
  safeRiskIndicator: 'safe' | 'warning' | 'danger';
  drawdownSeries: { date: string; drawdown: number }[];
  recoveryDays: number;
  maxDrawdownDate: string | null;
  recoveryCompleteDate: string | null;
  riskConsistency: number;
  avgRiskPct: number;
  overRiskingFrequency: number;
  underRiskingFrequency: number;
  winningStreakBehavior: { avgPnlAfterWin: number; count: number };
  losingStreakBehavior: { avgPnlAfterLoss: number; count: number };
  riskDistribution: { bucket: string; count: number }[];
  advancedStats: AdvancedStats;
};

export type AdvancedStats = {
  profitFactor: number;
  recoveryFactor: number;
  expectancy: number;
  sharpeRatio: number | null;
  avgHoldingTime: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgRisk: number;
  avgReward: number;
  rrDistribution: { bucket: string; count: number }[];
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
};

const DEFAULT_RULES: RiskRules = {
  id: '',
  user_id: '',
  workspace_id: '',
  account_id: null,
  max_daily_loss_pct: 3,
  max_weekly_loss_pct: 6,
  max_monthly_loss_pct: 10,
  max_risk_per_trade_pct: 2,
  max_open_trades: 5,
  max_daily_trades: 10,
  max_position_size_pct: 10,
  stop_after_losses: 3,
  stop_after_daily_loss: true,
  warning_threshold_pct: 80,
  created_at: '',
  updated_at: '',
};

export function getDefaultRules(): RiskRules {
  return { ...DEFAULT_RULES };
}

export function computeRiskMetrics(
  trades: Trade[],
  accountBalance: number,
  rules: RiskRules,
  metrics?: Metrics
): RiskMetrics {
  const m = metrics || computeMetrics(trades);
  const closed = trades.filter((t) => t.status === 'closed');
  const open = trades.filter((t) => t.status === 'open');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const todayTrades = closed.filter((t) => (t.closed_at || t.executed_at).split('T')[0] === todayStr);
  const weekTrades = closed.filter((t) => new Date(t.closed_at || t.executed_at) >= weekAgo);
  const monthTrades = closed.filter((t) => new Date(t.closed_at || t.executed_at) >= monthAgo);

  const dailyRiskUsed = Math.abs(todayTrades.reduce((s, t) => s + Number(t.pnl), 0));
  const weeklyRiskUsed = Math.abs(weekTrades.reduce((s, t) => s + Number(t.pnl), 0));
  const monthlyRiskUsed = Math.abs(monthTrades.reduce((s, t) => s + Number(t.pnl), 0));

  const totalExposure = open.reduce((s, t) => {
    const risk = Number(t.risk_pct) || 0;
    return s + (accountBalance * risk / 100);
  }, 0);

  const riskPcts = closed.map((t) => Number(t.risk_pct || 0)).filter((r) => r > 0);
  const avgRiskPerTrade = riskPcts.length > 0
    ? riskPcts.reduce((s, r) => s + r, 0) / riskPcts.length * accountBalance / 100
    : 0;
  const largestRiskTaken = riskPcts.length > 0
    ? Math.max(...riskPcts) * accountBalance / 100
    : 0;

  // Drawdown calculation from equity curve
  const drawdownSeries: { date: string; drawdown: number }[] = [];
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownDate: string | null = null;
  let recoveryCompleteDate: string | null = null;

  for (const point of m.equity) {
    if (point.cumulative > peak) peak = point.cumulative;
    const dd = peak > 0 ? ((point.cumulative - peak) / Math.abs(peak)) * 100 : 0;
    drawdownSeries.push({ date: point.date, drawdown: dd });
    if (dd < maxDrawdown) {
      maxDrawdown = dd;
      maxDrawdownDate = point.date;
    }
  }

  const currentDrawdown = drawdownSeries.length > 0 ? drawdownSeries[drawdownSeries.length - 1].drawdown : 0;

  // Recovery: find when drawdown returned to 0 after max drawdown
  if (maxDrawdownDate) {
    const maxIdx = drawdownSeries.findIndex((d) => d.date === maxDrawdownDate);
    for (let i = maxIdx + 1; i < drawdownSeries.length; i++) {
      if (drawdownSeries[i].drawdown >= 0) {
        recoveryCompleteDate = drawdownSeries[i].date;
        break;
      }
    }
  }

  const recoveryDays = recoveryCompleteDate && maxDrawdownDate
    ? Math.round((new Date(recoveryCompleteDate).getTime() - new Date(maxDrawdownDate).getTime()) / 86400000)
    : 0;

  const recoveryProgress = maxDrawdown < 0
    ? Math.min(((currentDrawdown - maxDrawdown) / Math.abs(maxDrawdown)) * 100, 100)
    : 100;

  // Safe risk indicator
  const dailyLimit = accountBalance * (rules.max_daily_loss_pct / 100);
  const dailyUsage = dailyLimit > 0 ? (dailyRiskUsed / dailyLimit) * 100 : 0;
  const safeRiskIndicator: 'safe' | 'warning' | 'danger' =
    dailyUsage >= 100 ? 'danger' :
    dailyUsage >= rules.warning_threshold_pct ? 'warning' : 'safe';

  // Risk consistency (std dev of risk percentages)
  const avgRiskPct = riskPcts.length > 0 ? riskPcts.reduce((s, r) => s + r, 0) / riskPcts.length : 0;
  const riskStdDev = riskPcts.length > 1
    ? Math.sqrt(riskPcts.reduce((s, r) => s + Math.pow(r - avgRiskPct, 2), 0) / riskPcts.length)
    : 0;
  const riskConsistency = avgRiskPct > 0 ? Math.max(0, 100 - (riskStdDev / avgRiskPct) * 100) : 0;

  const overRiskingFrequency = riskPcts.length > 0
    ? (riskPcts.filter((r) => r > rules.max_risk_per_trade_pct).length / riskPcts.length) * 100
    : 0;
  const underRiskingFrequency = riskPcts.length > 0
    ? (riskPcts.filter((r) => r < rules.max_risk_per_trade_pct * 0.5).length / riskPcts.length) * 100
    : 0;

  // Streak behavior
  const sorted = [...closed].sort((a, b) =>
    new Date(a.closed_at || a.executed_at).getTime() - new Date(b.closed_at || b.executed_at).getTime()
  );
  let winAfterWinSum = 0, winAfterWinCount = 0;
  let lossAfterLossSum = 0, lossAfterLossCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.pnl > 0 && curr.pnl > 0) { winAfterWinSum += Number(curr.pnl); winAfterWinCount++; }
    if (prev.pnl < 0 && curr.pnl < 0) { lossAfterLossSum += Number(curr.pnl); lossAfterLossCount++; }
  }
  const winningStreakBehavior = { avgPnlAfterWin: winAfterWinCount > 0 ? winAfterWinSum / winAfterWinCount : 0, count: winAfterWinCount };
  const losingStreakBehavior = { avgPnlAfterLoss: lossAfterLossCount > 0 ? lossAfterLossSum / lossAfterLossCount : 0, count: lossAfterLossCount };

  // Risk distribution buckets
  const riskBuckets = [
    { bucket: '0-0.5%', min: 0, max: 0.5, count: 0 },
    { bucket: '0.5-1%', min: 0.5, max: 1, count: 0 },
    { bucket: '1-1.5%', min: 1, max: 1.5, count: 0 },
    { bucket: '1.5-2%', min: 1.5, max: 2, count: 0 },
    { bucket: '2-3%', min: 2, max: 3, count: 0 },
    { bucket: '3%+', min: 3, max: Infinity, count: 0 },
  ];
  for (const r of riskPcts) {
    for (const b of riskBuckets) {
      if (r >= b.min && r < b.max) { b.count++; break; }
    }
  }
  const riskDistribution = riskBuckets.map((b) => ({ bucket: b.bucket, count: b.count }));

  // Advanced stats
  const totalPnl = m.totalPnl;
  const recoveryFactor = maxDrawdown !== 0 ? Math.abs(totalPnl / (maxDrawdown / 100 * accountBalance)) : 0;

  // Sharpe ratio (simplified, using daily P&L)
  const dailyReturns = m.dailyPnl.map((d) => d.pnl);
  const sharpeRatio = dailyReturns.length > 1
    ? (() => {
        const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
        const std = Math.sqrt(dailyReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / dailyReturns.length);
        return std > 0 ? (mean / std) * Math.sqrt(252) : null;
      })()
    : null;

  // RR distribution
  const rrs = closed.map((t) => Number(t.rr || 0)).filter((r) => r > 0);
  const rrBuckets = [
    { bucket: '< 1:1', min: 0, max: 1, count: 0 },
    { bucket: '1:1 - 1:2', min: 1, max: 2, count: 0 },
    { bucket: '1:2 - 1:3', min: 2, max: 3, count: 0 },
    { bucket: '1:3+', min: 3, max: Infinity, count: 0 },
  ];
  for (const r of rrs) {
    for (const b of rrBuckets) {
      if (r >= b.min && r < b.max) { b.count++; break; }
    }
  }

  const advancedStats: AdvancedStats = {
    profitFactor: m.profitFactor,
    recoveryFactor,
    expectancy: m.expectancy,
    sharpeRatio,
    avgHoldingTime: m.avgHoldTime,
    avgWin: m.avgWin,
    avgLoss: m.avgLoss,
    largestWin: m.largestWin,
    largestLoss: m.largestLoss,
    avgRisk: avgRiskPct,
    avgReward: rrs.length > 0 ? rrs.reduce((s, r) => s + r, 0) / rrs.length : 0,
    rrDistribution: rrBuckets.map((b) => ({ bucket: b.bucket, count: b.count })),
    maxConsecutiveWins: m.maxWinStreak,
    maxConsecutiveLosses: m.maxLossStreak,
  };

  return {
    accountBalance,
    accountEquity: accountBalance + totalPnl,
    dailyRiskUsed,
    weeklyRiskUsed,
    monthlyRiskUsed,
    totalExposure,
    avgRiskPerTrade,
    largestRiskTaken,
    maxDrawdown,
    currentDrawdown,
    recoveryProgress,
    safeRiskIndicator,
    drawdownSeries,
    recoveryDays,
    maxDrawdownDate,
    recoveryCompleteDate,
    riskConsistency,
    avgRiskPct,
    overRiskingFrequency,
    underRiskingFrequency,
    winningStreakBehavior,
    losingStreakBehavior,
    riskDistribution,
    advancedStats,
  };
}

export type RiskAlertInput = {
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric_value?: number;
  threshold_value?: number;
};

export function generateRiskAlerts(
  riskMetrics: RiskMetrics,
  rules: RiskRules,
  trades: Trade[]
): RiskAlertInput[] {
  const alerts: RiskAlertInput[] = [];
  const accountBalance = riskMetrics.accountBalance;

  // Daily loss exceeded
  const dailyLimit = accountBalance * (rules.max_daily_loss_pct / 100);
  if (dailyLimit > 0 && riskMetrics.dailyRiskUsed >= dailyLimit) {
    alerts.push({
      alert_type: 'daily_loss',
      severity: 'critical',
      title: 'Daily Loss Limit Exceeded',
      message: `Daily loss of ${riskMetrics.dailyRiskUsed.toFixed(2)} has reached your limit of ${dailyLimit.toFixed(2)}. Consider stopping for the day.`,
      metric_value: riskMetrics.dailyRiskUsed,
      threshold_value: dailyLimit,
    });
  } else if (dailyLimit > 0 && riskMetrics.dailyRiskUsed >= dailyLimit * (rules.warning_threshold_pct / 100)) {
    alerts.push({
      alert_type: 'daily_loss',
      severity: 'warning',
      title: 'Approaching Daily Loss Limit',
      message: `Daily loss of ${riskMetrics.dailyRiskUsed.toFixed(2)} is ${(riskMetrics.dailyRiskUsed / dailyLimit * 100).toFixed(0)}% of your limit.`,
      metric_value: riskMetrics.dailyRiskUsed,
      threshold_value: dailyLimit,
    });
  }

  // Weekly loss exceeded
  const weeklyLimit = accountBalance * (rules.max_weekly_loss_pct / 100);
  if (weeklyLimit > 0 && riskMetrics.weeklyRiskUsed >= weeklyLimit) {
    alerts.push({
      alert_type: 'weekly_loss',
      severity: 'critical',
      title: 'Weekly Loss Limit Exceeded',
      message: `Weekly loss of ${riskMetrics.weeklyRiskUsed.toFixed(2)} has reached your limit of ${weeklyLimit.toFixed(2)}.`,
      metric_value: riskMetrics.weeklyRiskUsed,
      threshold_value: weeklyLimit,
    });
  }

  // Monthly loss exceeded
  const monthlyLimit = accountBalance * (rules.max_monthly_loss_pct / 100);
  if (monthlyLimit > 0 && riskMetrics.monthlyRiskUsed >= monthlyLimit) {
    alerts.push({
      alert_type: 'monthly_loss',
      severity: 'critical',
      title: 'Monthly Loss Limit Exceeded',
      message: `Monthly loss of ${riskMetrics.monthlyRiskUsed.toFixed(2)} has reached your limit of ${monthlyLimit.toFixed(2)}.`,
      metric_value: riskMetrics.monthlyRiskUsed,
      threshold_value: monthlyLimit,
    });
  }

  // Consecutive losses exceeded
  if (rules.stop_after_losses > 0 && riskMetrics.advancedStats.maxConsecutiveLosses >= rules.stop_after_losses) {
    alerts.push({
      alert_type: 'consecutive_losses',
      severity: 'critical',
      title: 'Consecutive Loss Limit Reached',
      message: `You've had ${riskMetrics.advancedStats.maxConsecutiveLosses} consecutive losses. Your rule says to stop after ${rules.stop_after_losses}.`,
      metric_value: riskMetrics.advancedStats.maxConsecutiveLosses,
      threshold_value: rules.stop_after_losses,
    });
  }

  // Large drawdown
  if (riskMetrics.maxDrawdown <= -20) {
    alerts.push({
      alert_type: 'large_drawdown',
      severity: 'critical',
      title: 'Large Drawdown Detected',
      message: `Maximum drawdown of ${riskMetrics.maxDrawdown.toFixed(1)}% detected. Review your risk management.`,
      metric_value: riskMetrics.maxDrawdown,
    });
  } else if (riskMetrics.maxDrawdown <= -10) {
    alerts.push({
      alert_type: 'large_drawdown',
      severity: 'warning',
      title: 'Significant Drawdown',
      message: `Maximum drawdown of ${riskMetrics.maxDrawdown.toFixed(1)}% detected.`,
      metric_value: riskMetrics.maxDrawdown,
    });
  }

  // High exposure
  const exposureLimit = accountBalance * (rules.max_position_size_pct / 100);
  if (exposureLimit > 0 && riskMetrics.totalExposure >= exposureLimit) {
    alerts.push({
      alert_type: 'high_exposure',
      severity: 'warning',
      title: 'High Exposure Detected',
      message: `Total exposure of ${riskMetrics.totalExposure.toFixed(2)} exceeds your position size limit of ${exposureLimit.toFixed(2)}.`,
      metric_value: riskMetrics.totalExposure,
      threshold_value: exposureLimit,
    });
  }

  // Over-risking frequency
  if (riskMetrics.overRiskingFrequency > 20) {
    alerts.push({
      alert_type: 'max_risk_per_trade',
      severity: 'warning',
      title: 'Frequent Over-Risking',
      message: `${riskMetrics.overRiskingFrequency.toFixed(0)}% of your trades exceed your max risk per trade of ${rules.max_risk_per_trade_pct}%.`,
      metric_value: riskMetrics.overRiskingFrequency,
      threshold_value: rules.max_risk_per_trade_pct,
    });
  }

  // Max daily trades
  const todayCount = trades.filter((t) => (t.closed_at || t.executed_at).split('T')[0] === new Date().toISOString().split('T')[0]).length;
  if (rules.max_daily_trades > 0 && todayCount >= rules.max_daily_trades) {
    alerts.push({
      alert_type: 'max_daily_trades',
      severity: 'info',
      title: 'Daily Trade Limit Reached',
      message: `You've placed ${todayCount} trades today, reaching your limit of ${rules.max_daily_trades}.`,
      metric_value: todayCount,
      threshold_value: rules.max_daily_trades,
    });
  }

  return alerts;
}
