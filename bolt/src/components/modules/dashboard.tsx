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

  const setupSteps = [
    { label: 'Add a trading account', done: accounts.length > 0 },
    { label: 'Log your first trade', done: trades.length > 0 },
    { label: 'Create your first strategy', done: false },
    { label: 'Complete your first trade review', done: false },
  ];

  const completedSetup = setupSteps.filter((step) => step.done).length;

  const previewCards = [
    {
      title: 'Performance',
      description: 'Your equity curve will appear here once trades are recorded.',
      icon: LineChart,
      body: (
        <div className="rounded-xl border border-border bg-secondary/25 p-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>Equity</span>
            <span>Pending</span>
          </div>
          <svg viewBox="0 0 220 80" className="h-20 w-full opacity-60" aria-label="Equity placeholder silhouette">
            <path d="M0 52 C30 45, 45 60, 70 42 S115 18, 135 22 S180 10, 220 36 L220 80 L0 80 Z" fill="rgba(148,163,184,0.14)" stroke="rgba(148,163,184,0.4)" strokeWidth="1.2" fillOpacity="0.5" />
          </svg>
        </div>
      ),
    },
    {
      title: 'Risk',
      description: 'Track drawdown, exposure and risk consistency.',
      icon: AlertTriangle,
      body: (
        <div className="rounded-xl border border-border bg-secondary/25 p-3">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>Drawdown</span>
            <span>Awaiting data</span>
          </div>
          <div className="flex h-16 items-end gap-1">
            {[18, 26, 34, 28, 44, 36, 52, 40].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-muted/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Psychology',
      description: 'Identify behavioral patterns across your trades.',
      icon: StickyNote,
      body: (
        <div className="rounded-xl border border-border bg-secondary/25 p-3">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary/70" />
                <span>Behavioral review will appear after enough data.</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'AI Intelligence',
      description: 'TraderOS will analyze your trading history and surface evidence-based insights.',
      icon: Sparkles,
      body: (
        <div className="rounded-xl border border-border bg-secondary/25 p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div>
            <div className="text-[11px] text-muted-foreground">Insights become available as TraderOS learns from your history.</div>
          </div>
        </div>
      ),
    },
  ];

  if (trades.length === 0 && accounts.length === 0) {
    return (
      <div className="space-y-5">
        <div className="panel-surface relative overflow-hidden p-4 md:p-5">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%)]" />
            <svg className="absolute right-4 top-4 h-28 w-36 md:right-8 md:top-5" viewBox="0 0 220 120" aria-hidden="true">
              <g opacity="0.45" fill="rgba(148,163,184,0.28)">
                <rect x="18" y="72" width="12" height="28" rx="3" />
                <rect x="40" y="62" width="12" height="38" rx="3" />
                <rect x="62" y="54" width="12" height="46" rx="3" />
                <rect x="84" y="46" width="12" height="54" rx="3" />
                <rect x="106" y="58" width="12" height="42" rx="3" />
                <rect x="128" y="50" width="12" height="50" rx="3" />
                <rect x="150" y="40" width="12" height="60" rx="3" />
                <rect x="172" y="62" width="12" height="38" rx="3" />
                <rect x="194" y="48" width="12" height="52" rx="3" />
              </g>
              <path d="M0 86 C28 82, 52 68, 75 72 S120 80, 145 70 S185 52, 220 62" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative grid gap-4 lg:grid-cols-[1.45fr_0.75fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                TraderOS workspace
              </div>
              <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-foreground md:text-[2rem]">Welcome to TraderOS</h2>
              <p className="mt-2 max-w-[620px] text-sm leading-6 text-muted-foreground">Build your trading intelligence workspace. Connect your account and start logging trades to build performance, risk and behavioral insights.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => onNavigate?.('accounts')}>Add Trading Account</Button>
                <Button variant="outline" onClick={() => onNavigate?.('journal')}>Log First Trade</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-3.5 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>Getting started</span>
                <span>{completedSetup} of {setupSteps.length} complete</span>
              </div>

              <div className="space-y-2.5">
                {setupSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium', step.done ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-secondary/50 text-muted-foreground')}>
                      {step.done ? '✓' : index + 1}
                    </div>
                    <span className={cn('text-sm', step.done ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {previewCards.map(({ title, description, icon: Icon, body }) => (
            <div key={title} className="panel-surface flex h-full flex-col p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary/40">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">{title}</div>
              </div>
              <div className="mb-3 text-xs leading-5 text-muted-foreground">{description}</div>
              <div className="mt-auto">{body}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardWidget title="Performance" description="No performance data yet" icon={BarChart3} state="empty">
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-3">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Equity preview</div>
              <svg viewBox="0 0 220 80" className="h-20 w-full opacity-70" aria-label="Performance placeholder">
                <path d="M0 50 C25 55, 42 58, 60 40 S105 22, 130 36 S178 18, 220 28 L220 80 L0 80 Z" fill="rgba(148,163,184,0.12)" stroke="rgba(148,163,184,0.45)" strokeWidth="1.2" />
              </svg>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">Start logging trades to build your performance history.</p>
            </div>
          </DashboardWidget>

          <DashboardWidget title="Risk" description="No risk data yet" icon={AlertTriangle} state="empty">
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-3">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk preview</div>
              <div className="flex h-16 items-end gap-1">
                {[10, 18, 22, 28, 21, 30, 40, 34].map((h, idx) => (
                  <div key={idx} className="flex-1 rounded-t-md bg-muted/50" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">Track drawdown, exposure and risk consistency as your account grows.</p>
            </div>
          </DashboardWidget>

          <DashboardWidget title="Psychology" description="No behavioral data yet" icon={StickyNote} state="empty">
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-3">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary/80" /> Emotional consistency</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning/80" /> Execution quality</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success/80" /> Decision review</div>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">TraderOS will learn from your trade history and surface behavioral patterns.</p>
            </div>
          </DashboardWidget>

          <DashboardWidget title="AI Intelligence" description="No AI insights yet" icon={Sparkles} state="empty">
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div>
                <div className="text-xs leading-5 text-muted-foreground">AI insights become available as TraderOS learns from your trading history.</div>
              </div>
            </div>
          </DashboardWidget>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="panel-surface overflow-hidden p-4 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Account connected
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">Your workspace is ready.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Start logging trades to build your performance history, review execution quality, and let TraderOS surface the right insights.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onNavigate?.('journal')}>Log First Trade</Button>
              <Button variant="outline" onClick={() => onNavigate?.('accounts')}>Manage Account</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {previewCards.map(({ title, description, icon: Icon, body }) => (
            <div key={title} className="panel-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary/40">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">{title}</div>
              </div>
              <div className="mb-3 text-xs leading-5 text-muted-foreground">{description}</div>
              {body}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel-surface overflow-hidden p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Market Pulse
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{greeting}, {firstName}</h2>
            <p className="mt-1 text-sm text-slate-300">Your execution engine is active and your trading desk is ready for the next setup.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            Session open · London / New York overlap
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { symbol: 'EUR/USD', price: '1.0918', change: '+0.42%', up: true, bars: [38, 52, 45, 62, 58, 70, 64, 78] },
            { symbol: 'GBP/USD', price: '1.2745', change: '+0.18%', up: true, bars: [35, 40, 38, 58, 53, 67, 60, 72] },
            { symbol: 'USD/JPY', price: '146.21', change: '-0.24%', up: false, bars: [50, 48, 45, 39, 42, 38, 34, 30] },
            { symbol: 'XAU/USD', price: '2354.3', change: '+1.12%', up: true, bars: [30, 28, 42, 38, 60, 58, 72, 82] },
          ].map((pair) => (
            <div key={pair.symbol} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{pair.symbol}</span>
                <span className={cn('text-[10px] font-semibold', pair.up ? 'text-emerald-400' : 'text-rose-400')}>{pair.change}</span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-xl font-bold text-white">{pair.price}</div>
                <div className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', pair.up ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300')}>{pair.up ? 'Bullish' : 'Soft'}</div>
              </div>
              <div className="mt-3 flex h-10 items-end gap-1">
                {pair.bars.map((bar, idx) => (
                  <div key={idx} className={cn('w-full rounded-t-md', pair.up ? 'bg-gradient-to-t from-emerald-500/70 to-cyan-400/90' : 'bg-gradient-to-t from-rose-500/70 to-orange-400/90')} style={{ height: `${bar}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
    <div className="panel-surface bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('grid place-items-center w-10 h-10 rounded-xl border', colors[accent])}><Icon className="w-4 h-4" /></div>
      </div>
      <div className="text-2xl font-bold tracking-tight tabular-nums text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{label}</div>
      {delta && <div className="mt-2 text-[10px] text-slate-300">{delta}</div>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-left transition-all hover:border-cyan-400/30 hover:bg-slate-900 group">
      <Icon className="w-4 h-4 text-slate-300 group-hover:text-cyan-300 shrink-0" />
      <span className="text-xs font-medium text-slate-200">{label}</span>
      <ChevronRight className="w-3 h-3 text-slate-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
