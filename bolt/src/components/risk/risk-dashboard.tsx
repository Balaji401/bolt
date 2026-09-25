'use client';
import { Wallet, TrendingDown, AlertTriangle, ShieldCheck, Activity, DollarSign, BarChart3, Clock, RotateCcw, Percent } from 'lucide-react';
import type { RiskMetrics } from '@/lib/risk';
import { formatCurrency, formatPercent, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

export function RiskDashboard({ metrics }: { metrics: RiskMetrics }) {
  const safeColor = (metrics.safeRiskIndicator === 'safe' ? 'success' : metrics.safeRiskIndicator === 'warning' ? 'warning' : 'destructive') as 'success' | 'warning' | 'destructive';
  const cards = [
    { label: 'Account Balance', value: formatCurrency(metrics.accountBalance), icon: Wallet, accent: 'primary' as const },
    { label: 'Account Equity', value: formatCurrency(metrics.accountEquity), icon: DollarSign, accent: 'primary' as const },
    { label: 'Daily Risk Used', value: formatCurrency(metrics.dailyRiskUsed), icon: TrendingDown, accent: metrics.dailyRiskUsed > 0 ? 'destructive' as const : 'primary' as const },
    { label: 'Weekly Risk Used', value: formatCurrency(metrics.weeklyRiskUsed), icon: TrendingDown, accent: metrics.weeklyRiskUsed > 0 ? 'destructive' as const : 'primary' as const },
    { label: 'Monthly Risk Used', value: formatCurrency(metrics.monthlyRiskUsed), icon: TrendingDown, accent: metrics.monthlyRiskUsed > 0 ? 'destructive' as const : 'primary' as const },
    { label: 'Total Exposure', value: formatCurrency(metrics.totalExposure), icon: Activity, accent: metrics.totalExposure > 0 ? 'warning' as const : 'primary' as const },
    { label: 'Avg Risk / Trade', value: formatCurrency(metrics.avgRiskPerTrade), icon: Percent, accent: 'primary' as const },
    { label: 'Largest Risk Taken', value: formatCurrency(metrics.largestRiskTaken), icon: AlertTriangle, accent: metrics.largestRiskTaken > 0 ? 'destructive' as const : 'primary' as const },
    { label: 'Max Drawdown', value: formatPercent(metrics.maxDrawdown, 1), icon: TrendingDown, accent: metrics.maxDrawdown < -10 ? 'destructive' as const : 'warning' as const },
    { label: 'Current Drawdown', value: formatPercent(metrics.currentDrawdown, 1), icon: TrendingDown, accent: metrics.currentDrawdown < -10 ? 'destructive' as const : 'warning' as const },
    { label: 'Recovery Progress', value: `${metrics.recoveryProgress.toFixed(0)}%`, icon: RotateCcw, accent: metrics.recoveryProgress >= 100 ? 'success' as const : 'warning' as const },
    { label: 'Safe Risk Status', value: metrics.safeRiskIndicator.toUpperCase(), icon: ShieldCheck, accent: safeColor },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <RiskCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function RiskCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  accent: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn('grid place-items-center w-7 h-7 rounded-lg', colors[accent])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
