'use client';
import { Wallet, TrendingDown, ShieldCheck, Activity, DollarSign } from 'lucide-react';
import type { RiskMetrics } from '@/lib/risk';
import type { RiskRules } from '@/lib/supabase';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function RiskDashboard({ metrics, rules, accountBalance }: { metrics: RiskMetrics; rules: RiskRules; accountBalance: number }) {
  const dailyLimit = accountBalance * (Number(rules.max_daily_loss_pct || 0) / 100);
  const remainingRisk = dailyLimit > 0 ? Math.max(dailyLimit - metrics.dailyRiskUsed, 0) : 0;
  const usagePercent = dailyLimit > 0 ? (metrics.dailyRiskUsed / dailyLimit) * 100 : 0;
  const status = dailyLimit > 0
    ? usagePercent >= 100 ? 'Limit Reached' : usagePercent >= Number(rules.warning_threshold_pct || 80) ? 'Approaching Limit' : 'Within Plan'
    : 'No daily limit configured';

  const statusColor = status === 'Limit Reached' ? 'text-destructive bg-destructive/10 border-destructive/30' : status === 'Approaching Limit' ? 'text-warning bg-warning/10 border-warning/30' : 'text-success bg-success/10 border-success/30';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Risk Management</div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">Monitor account risk, drawdown and trading discipline.</h3>
          </div>
          <div className={cn('inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium', statusColor)}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {status}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Account Risk</div>
            <dl className="mt-3 space-y-2">
              <MetricRow label="Balance" value={formatCurrency(metrics.accountBalance)} />
              <MetricRow label="Equity" value={formatCurrency(metrics.accountEquity)} />
              <MetricRow label="Current Drawdown" value={formatPercent(metrics.currentDrawdown, 1)} align="right" valueClassName={metrics.currentDrawdown < 0 ? 'text-destructive' : 'text-success'} />
              <MetricRow label="Maximum Drawdown" value={formatPercent(metrics.maxDrawdown, 1)} align="right" valueClassName={metrics.maxDrawdown < 0 ? 'text-destructive' : 'text-success'} />
              <MetricRow label="Peak Equity" value={formatCurrency(metrics.peakEquity)} />
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Daily Risk</div>
            <dl className="mt-3 space-y-2">
              <MetricRow label="Daily Risk Used" value={formatCurrency(metrics.dailyRiskUsed)} align="right" valueClassName={metrics.dailyRiskUsed > 0 ? 'text-destructive' : 'text-success'} />
              <MetricRow label="Daily Limit" value={dailyLimit > 0 ? formatCurrency(dailyLimit) : 'Not configured'} />
              <MetricRow label="Remaining" value={dailyLimit > 0 ? formatCurrency(remainingRisk) : '—'} align="right" valueClassName={remainingRisk > 0 ? 'text-success' : 'text-destructive'} />
            </dl>

            {dailyLimit > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Daily Risk Usage</span>
                  <span>{usagePercent.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div className={cn('h-full rounded-full transition-all', usagePercent >= 100 ? 'bg-destructive' : usagePercent >= Number(rules.warning_threshold_pct || 80) ? 'bg-warning' : 'bg-success')} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">
                Daily risk limit not configured.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={Wallet} label="Balance" value={formatCurrency(metrics.accountBalance)} accent="primary" />
        <SummaryTile icon={DollarSign} label="Equity" value={formatCurrency(metrics.accountEquity)} accent="primary" />
        <SummaryTile icon={TrendingDown} label="Max Drawdown" value={formatPercent(metrics.maxDrawdown, 1)} accent={metrics.maxDrawdown < -10 ? 'destructive' : 'warning'} />
        <SummaryTile icon={Activity} label="Avg Risk / Trade" value={formatCurrency(metrics.avgRiskPerTrade)} accent="primary" />
      </div>
    </div>
  );
}

function MetricRow({ label, value, align = 'left', valueClassName = '' }: { label: string; value: string; align?: 'left' | 'right'; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5 last:border-b-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm font-medium tabular-nums text-foreground', align === 'right' && 'text-right', valueClassName)}>{value}</dd>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: 'primary' | 'success' | 'warning' | 'destructive'; }) {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn('grid h-7 w-7 place-items-center rounded-lg', colors[accent])}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <div className="mt-3 text-lg font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
