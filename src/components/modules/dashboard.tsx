'use client';
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, Award, AlertTriangle, Sparkles, ArrowUpRight, ArrowDownRight, Wallet, Zap, CheckCircle2, CalendarDays, Newspaper, LineChart, StickyNote, Clock, ChevronRight, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import type { Trade, AiInsight, OpenPosition, TradingGoal } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { formatCurrency, formatPercent, formatCompact, formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { DashboardWidget } from '@/components/dashboard/widget';
import { useWorkspace } from '@/components/workspace-provider';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

export function Dashboard({ trades, insights, positions, goals, onNavigate }: { trades: Trade[]; insights: AiInsight[]; positions: OpenPosition[]; goals: TradingGoal[]; onNavigate?: (key: any) => void }) {
  const metrics = useMemo(() => computeMetrics(trades), [trades]);
  const { activeAccount, accounts } = useWorkspace();
  const { profile } = useAuth();

  const openPositions = positions.filter((p) => p);
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);
  const firstName = (profile?.display_name || profile?.full_name || 'Trader').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (trades.length === 0 && accounts.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Welcome to TraderOS"
        description="Start by adding a trading account and logging your first trade. Your dashboard will come alive with performance metrics, equity curves, and AI insights."
        action={
          <div className="flex gap-2">
            <Button onClick={() => onNavigate?.('accounts')}>Add Trading Account</Button>
            <Button variant="outline" onClick={() => onNavigate?.('journal')}>Log First Trade</Button>
          </div>
        }
      />
    );
  }

  if (trades.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No trades yet"
        description="Start by adding your first trade in the Trading Journal. Your dashboard will come alive with performance metrics, equity curves, and AI insights."
        action={<Button onClick={() => onNavigate?.('journal')}>Log Your First Trade</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total P&L" value={formatCurrency(metrics.totalPnl)} accent={metrics.totalPnl >= 0 ? 'success' : 'destructive'} delta={metrics.totalTrades > 0 ? `${metrics.totalTrades} trades` : ''} />
        <KpiCard icon={Target} label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} accent="primary" delta={`${metrics.totalWins}W / ${metrics.totalLosses}L`} />
        <KpiCard icon={Activity} label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)} accent={metrics.profitFactor >= 1 ? 'success' : 'destructive'} delta={`Avg: ${formatCurrency(metrics.expectancy)}`} />
        <KpiCard icon={Award} label="Best Streak" value={`${metrics.maxWinStreak}`} accent="warning" delta={`Worst: ${metrics.maxLossStreak}`} />
      </div>

      {/* Row 2: Welcome + Account Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardWidget title={`${greeting}, ${firstName}`} description="Here's your trading snapshot" icon={Sparkles}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've logged <span className="font-semibold text-foreground">{metrics.totalTrades}</span> trades with a{' '}
              <span className={cn('font-semibold', metrics.winRate >= 50 ? 'text-success' : 'text-destructive')}>
                {metrics.winRate.toFixed(1)}% win rate
              </span>
              . {metrics.totalPnl >= 0 ? 'Keep up the great work!' : 'Stay disciplined and trust your process.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onNavigate?.('journal')}>View Journal</Button>
              <Button size="sm" variant="outline" onClick={() => onNavigate?.('analytics')}>Performance</Button>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget title="Account Summary" description={activeAccount?.account_name || 'No account selected'} icon={Wallet}>
          {activeAccount ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">{activeAccount.platform}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold tabular-nums">{formatCurrency(Number(activeAccount.current_balance), activeAccount.base_currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Initial</span>
                <span className="font-medium tabular-nums">{formatCurrency(Number(activeAccount.initial_balance), activeAccount.base_currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="text-[10px] uppercase">{activeAccount.account_type.replace('_', ' ')}</Badge>
              </div>
            </div>
          ) : (
            <EmptyState title="No account selected" description="Select or create a trading account." className="py-6" />
          )}
        </DashboardWidget>

        <DashboardWidget title="Quick Actions" description="Jump to common tasks" icon={Zap}>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon={TrendingUp} label="New Trade" onClick={() => onNavigate?.('journal')} />
            <QuickAction icon={LineChart} label="Analytics" onClick={() => onNavigate?.('analytics')} />
            <QuickAction icon={Wallet} label="Accounts" onClick={() => onNavigate?.('accounts')} />
            <QuickAction icon={Target} label="Risk Calc" onClick={() => onNavigate?.('risk')} />
          </div>
        </DashboardWidget>
      </div>

      {/* Row 3: Recent Trades + Performance Snapshot + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardWidget title="Recent Trades" description="Your latest activity" icon={Clock}>
          <div className="space-y-2">
            {metrics.recentTrades.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0', t.pnl >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                    {t.direction === 'long' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.instrument}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(t.executed_at)}</div>
                  </div>
                </div>
                <div className={cn('text-sm font-semibold tabular-nums', t.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(t.pnl))}</div>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Performance Snapshot" description="Key metrics at a glance" icon={BarChart3}>
          <div className="space-y-3">
            <MetricRow label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} positive={metrics.winRate >= 50} />
            <MetricRow label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)} positive={metrics.profitFactor >= 1} />
            <MetricRow label="Avg Win" value={formatCurrency(metrics.avgWin)} positive />
            <MetricRow label="Avg Loss" value={formatCurrency(metrics.avgLoss)} positive={false} />
            <MetricRow label="Expectancy" value={formatCurrency(metrics.expectancy)} positive={metrics.expectancy >= 0} />
          </div>
        </DashboardWidget>

        <DashboardWidget title="Active Goals" description="Track your progress" icon={Target}>
          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.map((g) => {
                const progress = g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0;
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.title}</span>
                      <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No active goals" description="Set trading goals to track your progress." className="py-6" />
          )}
        </DashboardWidget>
      </div>

      {/* Row 4: Open Positions + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardWidget title="Open Positions" description="Live positions from broker sync" icon={Activity}>
          {openPositions.length > 0 ? (
            <div className="space-y-2">
              {openPositions.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={p.direction === 'long' ? 'success' : 'destructive'}>{p.direction.toUpperCase()}</Badge>
                    <span className="text-sm font-medium">{p.instrument}</span>
                  </div>
                  <span className={cn('text-sm font-semibold tabular-nums', Number(p.floating_pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(p.floating_pnl))}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No open positions" description="Connect a broker to see live positions." className="py-6" />
          )}
        </DashboardWidget>

        <DashboardWidget title="AI Insights" description="Personalized coaching tips" icon={Sparkles}>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 4).map((insight) => {
                const Icon = insight.severity === 'critical' ? AlertTriangle : insight.severity === 'warning' ? AlertTriangle : insight.severity === 'success' ? Award : Sparkles;
                return (
                  <div key={insight.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', insight.severity === 'critical' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : insight.severity === 'success' ? 'text-success' : 'text-primary')} />
                    <div>
                      <div className="text-sm font-medium">{insight.title}</div>
                      <div className="text-xs text-muted-foreground">{insight.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No insights yet" description="AI insights will be generated as you add trades." className="py-6" />
          )}
        </DashboardWidget>
      </div>

      {/* Row 5: Market Overview (placeholder) + Economic Calendar (placeholder) + Trading Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardWidget title="Market Overview" description="Coming soon" icon={LineChart} state="empty">
          <div className="space-y-2">
            {['EUR/USD', 'GBP/USD', 'XAU/USD'].map((sym) => (
              <div key={sym} className="flex items-center justify-between text-sm py-1.5">
                <span className="font-medium">{sym}</span>
                <span className="text-muted-foreground text-xs">Market data coming soon</span>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Economic Calendar" description="Coming soon" icon={CalendarDays} state="empty">
          <div className="space-y-2">
            {['NFP Report', 'FOMC Minutes', 'CPI Data'].map((event) => (
              <div key={event} className="flex items-center gap-2 text-sm py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                <span className="font-medium">{event}</span>
                <span className="text-muted-foreground text-xs ml-auto">Calendar coming soon</span>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Trading Checklist" description="Pre-trade discipline" icon={CheckCircle2}>
          <div className="space-y-2">
            {[
              'Risk per trade defined',
              'Trading plan followed',
              'No revenge trades',
              'Journal entries complete',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <CheckCircle2 className={cn('w-4 h-4 shrink-0', i < 2 ? 'text-success' : 'text-muted-foreground/40')} />
                <span className={cn(i < 2 ? 'text-foreground' : 'text-muted-foreground')}>{item}</span>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent, delta }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: 'primary' | 'success' | 'warning' | 'destructive'; delta?: string }) {
  const colors = { primary: 'text-primary bg-primary/10', success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', destructive: 'text-destructive bg-destructive/10' };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('grid place-items-center w-9 h-9 rounded-lg', colors[accent])}><Icon className="w-4 h-4" /></div>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {delta && <div className="text-[10px] text-muted-foreground mt-1">{delta}</div>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/30 transition-all text-left group">
      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
      <span className="text-xs font-medium">{label}</span>
      <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

function MetricRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', positive ? 'text-success' : 'text-destructive')}>{value}</span>
    </div>
  );
}
