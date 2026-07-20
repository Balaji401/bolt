'use client';

import { useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Target, Activity, Flame, Award,
  AlertTriangle, Sparkles, ArrowUpRight, ArrowDownRight, Crosshair,
  Trophy, Circle, BarChart3, Zap, Clock, Calendar, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, LayoutGrid, Eye, EyeOff,
} from 'lucide-react';
import type { Trade, AiInsight, OpenPosition, TradingGoal } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { fmtCurrency, fmtPct, fmtNum } from '@/lib/format';
import { useTimezone } from '@/components/timezone-provider';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';

const SESSION_COLORS: Record<string, string> = {
  london:   'hsl(199 89% 56%)',
  new_york: 'hsl(152 65% 48%)',
  asia:     'hsl(38 92% 55%)',
  sydney:   'hsl(280 65% 65%)',
  other:    'hsl(215 16% 50%)',
};

function fmtDuration(minutes: number) {
  if (!minutes || minutes === 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

export function Dashboard({
  trades, insights, positions, goals,
}: {
  trades: Trade[];
  insights: AiInsight[];
  positions: OpenPosition[];
  goals: TradingGoal[];
}) {
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const recent = useMemo(() => [...trades]
    .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())
    .slice(0, 5), [trades]);
  const { formatDateTime } = useTimezone();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAllTrades, setShowAllTrades] = useState(false);

  const topInsights = insights.slice(0, 3);
  const bestDay  = m.byWeekday.reduce((a, b) => b.pnl > a.pnl ? b : a, m.byWeekday[0] || { day: '—', pnl: 0, trades: 0, winRate: 0 });
  const worstDay = m.byWeekday.reduce((a, b) => b.pnl < a.pnl ? b : a, m.byWeekday[0] || { day: '—', pnl: 0, trades: 0, winRate: 0 });

  const displayedTrades = showAllTrades ? trades.slice(0, 20) : recent;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Essential KPIs - always visible */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Metrics</h2>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 border border-border hover:border-primary/40 transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Account Balance"   value={fmtCurrency(10000 + m.totalPnl)} delta={fmtPct((m.totalPnl / 10000) * 100)} deltaPositive={m.totalPnl >= 0} icon={Wallet}     accent="primary"     />
          <StatCard label="Net P&L"            value={fmtCurrency(m.netPnl)}            icon={m.netPnl >= 0 ? TrendingUp : TrendingDown} accent={m.netPnl >= 0 ? 'success' : 'destructive'} />
          <StatCard label="Today P&L"          value={fmtCurrency(m.todayPnl)}          icon={Activity}     accent={m.todayPnl >= 0 ? 'success' : 'destructive'} sub={`${m.todayTrades} trades`} />
          <StatCard label="Win Rate"           value={fmtPct(m.winRate)}                icon={Target}       accent="primary"     sub={`${m.wins}W / ${m.losses}L`} />
          <StatCard label="Profit Factor"      value={fmtNum(m.profitFactor, 2)}        icon={Award}        accent="chart"       />
          <StatCard label="Total Trades"       value={m.totalTrades.toString()}         icon={BarChart3}    accent="primary"     sub={`${m.wins} wins · ${m.losses} losses`} />
        </div>
      </div>

      {/* Advanced KPIs - toggleable */}
      {showAdvanced && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <StatCard label="Total Profit"       value={fmtCurrency(m.grossProfit)}       icon={ArrowUpRight}   accent="success"     />
            <StatCard label="Total Loss"         value={fmtCurrency(m.grossLoss)}         icon={ArrowDownRight} accent="destructive" />
            <StatCard label="Largest Win"        value={fmtCurrency(m.bestTrade)}         icon={ThumbsUp}       accent="success"     />
            <StatCard label="Largest Loss"       value={fmtCurrency(Math.abs(m.worstTrade))} icon={ThumbsDown}  accent="destructive" />
            <StatCard label="Avg R:R"            value={`1:${fmtNum(m.avgRR, 1)}`}        icon={Target}         accent="chart"       />
            <StatCard label="Expectancy"         value={fmtCurrency(m.expectancy)}        icon={Zap}            accent={m.expectancy >= 0 ? 'success' : 'destructive'} />
            <StatCard label="Max Drawdown"       value={fmtPct(m.maxDrawdownPct)}         icon={AlertTriangle}  accent="warning"     />
            <StatCard label="Avg Hold Time"      value={fmtDuration(m.avgHoldingMinutes)} icon={Clock}          accent="chart"       />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Daily P&L"          value={fmtCurrency(m.todayPnl)}    icon={Calendar}   accent={m.todayPnl >= 0 ? 'success' : 'destructive'}  sub="Today" />
            <StatCard label="Weekly P&L"         value={fmtCurrency(m.weekPnl)}     icon={Calendar}   accent={m.weekPnl >= 0 ? 'success' : 'destructive'}   sub="This week" />
            <StatCard label="Monthly P&L"        value={fmtCurrency(m.monthPnl)}    icon={Calendar}   accent={m.monthPnl >= 0 ? 'success' : 'destructive'}  sub="This month" />
            <StatCard
              label="Trading Streak"
              value={`${Math.abs(m.currentStreak)} ${m.streakType === 'win' ? 'W' : m.streakType === 'loss' ? 'L' : ''}`}
              icon={Flame}
              accent={m.streakType === 'win' ? 'success' : m.streakType === 'loss' ? 'destructive' : 'chart'}
              sub={`Longest: ${m.longestWinStreak}W / ${m.longestLossStreak}L`}
            />
          </div>
        </div>
      )}

      {/* Equity curve + AI summary - essential */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Equity Curve</h3>
              <p className="text-xs text-muted-foreground">Cumulative balance over all closed trades</p>
            </div>
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold',
              m.totalPnl >= 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
            )}>
              {m.totalPnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {fmtCurrency(m.totalPnl)}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.equityCurve} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199 89% 56%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(199 89% 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                <XAxis dataKey="i" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [fmtCurrency(v), 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="hsl(199 89% 56%)" strokeWidth={2} fill="url(#eq)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI insights panel */}
        <div className="glass rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">AI Performance Summary</h3>
              <p className="text-xs text-muted-foreground">Auto-generated coaching insights</p>
            </div>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {topInsights.length > 0 ? topInsights.map((ins) => (
              <InsightCard key={ins.id} insight={ins} compact />
            )) : (
              <div className="text-xs text-muted-foreground text-center py-8">
                Go to AI Coach to generate personalized insights.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced sections - toggleable */}
      {showAdvanced && (
        <div className="space-y-4 animate-fade-in">
          {/* Session + Instrument + Win/Loss */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-1">P&L by Session</h3>
              <p className="text-xs text-muted-foreground mb-4">Performance across market sessions</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={m.bySession} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                    <XAxis dataKey="session" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {m.bySession.map((s, i) => <Cell key={i} fill={SESSION_COLORS[s.session] || 'hsl(215 16% 50%)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-1">Top Instruments</h3>
              <p className="text-xs text-muted-foreground mb-4">P&L ranked by instrument</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={m.byInstrument.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="instrument" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                    <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                      {m.byInstrument.slice(0, 6).map((s, i) => <Cell key={i} fill={s.pnl >= 0 ? 'hsl(152 65% 48%)' : 'hsl(0 72% 60%)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-1">Win / Loss Split</h3>
              <p className="text-xs text-muted-foreground mb-4">Outcome distribution</p>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wins',     value: m.wins,     color: 'hsl(152 65% 48%)' },
                        { name: 'Losses',   value: m.losses,   color: 'hsl(0 72% 60%)' },
                        { name: 'Breakeven', value: m.breakeven, color: 'hsl(215 16% 50%)' },
                      ]}
                      dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none"
                    >
                      <Cell fill="hsl(152 65% 48%)" />
                      <Cell fill="hsl(0 72% 60%)" />
                      <Cell fill="hsl(215 16% 50%)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{fmtPct(m.winRate)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Best/Worst day + Weekday heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5 flex flex-col gap-3">
              <h3 className="font-semibold">Best &amp; Worst Day</h3>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-center">
                  <ThumbsUp className="w-5 h-5 text-success mx-auto mb-2" />
                  <div className="text-lg font-semibold text-success">{bestDay.day}</div>
                  <div className="text-xs text-muted-foreground">{fmtCurrency(bestDay.pnl)}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{fmtPct(bestDay.winRate)} win rate</div>
                </div>
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
                  <ThumbsDown className="w-5 h-5 text-destructive mx-auto mb-2" />
                  <div className="text-lg font-semibold text-destructive">{worstDay.day}</div>
                  <div className="text-xs text-muted-foreground">{fmtCurrency(worstDay.pnl)}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{fmtPct(worstDay.winRate)} win rate</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="glass rounded-lg p-2.5 text-center">
                  <div className="font-semibold text-success">{m.longestWinStreak}</div>
                  <div className="text-muted-foreground">Best streak</div>
                </div>
                <div className="glass rounded-lg p-2.5 text-center">
                  <div className="font-semibold text-destructive">{m.longestLossStreak}</div>
                  <div className="text-muted-foreground">Worst streak</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 glass rounded-xl p-5">
              <h3 className="font-semibold mb-1">Trading Heatmap</h3>
              <p className="text-xs text-muted-foreground mb-4">P&L and trade count by weekday</p>
              <div className="grid grid-cols-7 gap-2">
                {m.byWeekday.map((d) => {
                  const intensity = Math.min(Math.abs(d.pnl) / 500, 1);
                  const color = d.pnl > 0
                    ? `hsl(152 65% 48% / ${0.15 + intensity * 0.6})`
                    : d.pnl < 0
                      ? `hsl(0 72% 60% / ${0.15 + intensity * 0.6})`
                      : 'hsl(222 14% 18%)';
                  return (
                    <div key={d.day} className="flex flex-col items-center gap-1.5">
                      <div className="text-[10px] font-medium text-muted-foreground">{d.day}</div>
                      <div
                        className="w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 cursor-default"
                        style={{ background: color, border: '1px solid hsl(222 14% 20%)' }}
                        title={`${d.day}: ${fmtCurrency(d.pnl)} (${d.trades} trades, ${fmtPct(d.winRate)} WR)`}
                      >
                        <span className="text-xs font-bold">{d.trades}</span>
                        <span className="text-[9px] text-muted-foreground">trades</span>
                      </div>
                      <div className={cn('text-[10px] font-medium', d.pnl > 0 ? 'text-success' : d.pnl < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                        {d.pnl > 0 ? '+' : ''}{fmtCurrency(d.pnl)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Strategy × Session matrix */}
          <StrategySessionMatrix trades={trades} />
        </div>
      )}

      {/* Open positions + Goals - essential */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Open positions */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" />
              <div>
                <h3 className="font-semibold">Open Positions</h3>
                <p className="text-xs text-muted-foreground">Live floating P&L from brokers</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success font-medium">
              {positions.length} open
            </span>
          </div>
          {positions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No open positions. Connect a broker to see live trades.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {positions.map((p) => {
                const pnl = Number(p.floating_pnl);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                    <Circle className={cn('w-2 h-2 fill-current shrink-0', pnl >= 0 ? 'text-success' : 'text-destructive')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.instrument}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', p.direction === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive')}>
                          {p.direction === 'long' ? '↑' : '↓'} {p.direction}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{fmtNum(Number(p.volume), 2)} lots @ {fmtNum(Number(p.entry_price))}</div>
                    </div>
                    <div className={cn('text-sm font-semibold', pnl >= 0 ? 'text-success' : 'text-destructive')}>
                      {pnl >= 0 ? '+' : ''}{fmtCurrency(pnl)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trading Goals */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-warning" />
            <div>
              <h3 className="font-semibold">Trading Goals</h3>
              <p className="text-xs text-muted-foreground">Track progress toward your targets</p>
            </div>
          </div>
          {goals.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No goals set. Create goals in your trading plan.
            </div>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 5).map((g) => {
                const pct = g.target_value > 0 ? Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100) : 0;
                const fmt = g.goal_type === 'profit' ? (n: number) => fmtCurrency(n) : (n: number) => fmtPct(n);
                return (
                  <div key={g.id} className="p-3 rounded-lg bg-secondary/40 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{g.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{g.period}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{fmt(Number(g.current_value))} / {fmt(Number(g.target_value))}</span>
                      <span className={cn('font-semibold', g.completed || pct >= 100 ? 'text-success' : 'text-primary')}>
                        {g.completed ? 'Done' : `${fmtNum(pct, 0)}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full', g.completed || pct >= 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent trades table - essential, with expandable rows */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Recent Trades</h3>
            <p className="text-xs text-muted-foreground">
              {showAllTrades ? `Showing ${displayedTrades.length} trades` : `Latest ${recent.length} closed positions`}
            </p>
          </div>
          {trades.length > 5 && (
            <button
              onClick={() => setShowAllTrades((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 border border-border hover:border-primary/40 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {showAllTrades ? 'Show less' : `Show all (${trades.length})`}
            </button>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                {['Instrument', 'Direction', 'Session', 'R:R', 'Confidence', 'Date', 'P&L'].map((h) => (
                  <th key={h} className="font-medium pb-2 pr-4 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedTrades.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 pr-4 font-medium">{t.instrument}</td>
                  <td className="py-2.5 pr-4">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', t.direction === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive')}>
                      {t.direction === 'long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {t.direction}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground capitalize text-xs">{t.session || '—'}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground text-xs">1:{fmtNum(t.rr, 1)}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${t.confidence}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{t.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-[11px] text-muted-foreground">
                    {formatDateTime(t.executed_at)}
                  </td>
                  <td className={cn('py-2.5 pr-4 text-right font-semibold text-sm', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
                    {fmtCurrency(Number(t.pnl))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayedTrades.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No trades yet. Add your first trade in the Trading Journal.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InsightCard({ insight, compact }: { insight: AiInsight; compact?: boolean }) {
  const accent: Record<string, string> = {
    success:  'border-success/30 bg-success/5',
    warning:  'border-warning/30 bg-warning/5',
    critical: 'border-destructive/30 bg-destructive/5',
    info:     'border-primary/30 bg-primary/5',
  };
  return (
    <div className={cn('rounded-lg border p-3', accent[insight.severity])}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{insight.insight_type}</div>
      <div className="text-sm font-medium mb-1">{insight.title}</div>
      <p className={cn('text-xs text-muted-foreground leading-relaxed', compact && 'line-clamp-2')}>{insight.body}</p>
    </div>
  );
}

function StrategySessionMatrix({ trades }: { trades: Trade[] }) {
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const sessions = ['asia', 'london', 'new_york', 'sydney'];
  const strategies = Array.from(new Set(m.byStrategySession.map((s) => s.strategy)));
  if (strategies.length === 0) return null;
  const get = (strat: string, sess: string) =>
    m.byStrategySession.find((x) => x.strategy === strat && x.session === sess);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <div>
          <h3 className="font-semibold">Strategy × Session Matrix</h3>
          <p className="text-xs text-muted-foreground">P&L per strategy across each trading session</p>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="font-medium pb-2 pr-6">Strategy</th>
              {sessions.map((s) => <th key={s} className="font-medium pb-2 pr-6 capitalize">{s.replace('_', ' ')}</th>)}
              <th className="font-medium pb-2 pr-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strat) => {
              const rowTotal = sessions.reduce((s, sess) => s + (get(strat, sess)?.pnl || 0), 0);
              return (
                <tr key={strat} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 pr-6 font-medium">{strat}</td>
                  {sessions.map((sess) => {
                    const cell = get(strat, sess);
                    if (!cell) return <td key={sess} className="py-2.5 pr-6 text-muted-foreground/40 text-xs">—</td>;
                    return (
                      <td key={sess} className="py-2.5 pr-6">
                        <div className={cn('font-semibold text-sm', cell.pnl >= 0 ? 'text-success' : 'text-destructive')}>{fmtCurrency(cell.pnl)}</div>
                        <div className="text-[10px] text-muted-foreground">{cell.trades}t · {fmtPct(cell.winRate)}</div>
                      </td>
                    );
                  })}
                  <td className={cn('py-2.5 pr-4 text-right font-semibold', rowTotal >= 0 ? 'text-success' : 'text-destructive')}>{fmtCurrency(rowTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
