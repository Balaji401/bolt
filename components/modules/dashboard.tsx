'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Flame,
  Award,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Crosshair,
  Trophy,
  Circle,
} from 'lucide-react';
import type { Trade, AiInsight, OpenPosition, TradingGoal } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { fmtCurrency, fmtPct, fmtNum } from '@/lib/format';
import { StatCard } from '@/components/stat-card';

const sessionColors: Record<string, string> = {
  london: 'hsl(199 89% 56%)',
  new_york: 'hsl(152 65% 48%)',
  asia: 'hsl(38 92% 55%)',
  sydney: 'hsl(280 65% 65%)',
  other: 'hsl(215 16% 50%)',
};

export function Dashboard({ trades, insights, positions, goals }: { trades: Trade[]; insights: AiInsight[]; positions: OpenPosition[]; goals: TradingGoal[] }) {
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const recent = useMemo(() => [...trades].sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()).slice(0, 6), [trades]);
  const topInsights = insights.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Account Balance" value={fmtCurrency(10000 + m.totalPnl)} delta={fmtPct((m.totalPnl / 10000) * 100)} deltaPositive={m.totalPnl >= 0} icon={Wallet} accent="primary" />
        <StatCard label="Today P&L" value={fmtCurrency(m.todayPnl)} icon={m.todayPnl >= 0 ? TrendingUp : TrendingDown} accent={m.todayPnl >= 0 ? 'success' : 'destructive'} />
        <StatCard label="This Week" value={fmtCurrency(m.weekPnl)} icon={Activity} accent={m.weekPnl >= 0 ? 'success' : 'destructive'} />
        <StatCard label="Win Rate" value={fmtPct(m.winRate)} icon={Target} accent="primary" sub={`${m.wins}W / ${m.losses}L`} />
        <StatCard label="Profit Factor" value={fmtNum(m.profitFactor, 2)} icon={Award} accent="chart" />
        <StatCard label="Max Drawdown" value={fmtCurrency(m.maxDrawdown)} icon={AlertTriangle} accent="warning" />
      </div>

      {/* Equity curve + AI summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Equity Curve</h3>
              <p className="text-xs text-muted-foreground">Cumulative account balance over all closed trades</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${m.totalPnl >= 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
                {m.totalPnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {fmtCurrency(m.totalPnl)}
              </span>
            </div>
          </div>
          <div className="h-64">
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
                  labelStyle={{ color: 'hsl(215 16% 65%)' }}
                  formatter={(v: number) => [fmtCurrency(v), 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="hsl(199 89% 56%)" strokeWidth={2} fill="url(#eq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/15 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">AI Performance Summary</h3>
              <p className="text-xs text-muted-foreground">Auto-generated daily review</p>
            </div>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {topInsights.map((ins) => (
              <InsightCard key={ins.id} insight={ins} compact />
            ))}
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Avg R:R" value={`1:${fmtNum(m.avgRr, 1)}`} icon={Target} accent="chart" />
        <StatCard label="Expectancy" value={fmtCurrency(m.expectancy)} icon={Activity} accent={m.expectancy >= 0 ? 'success' : 'destructive'} />
        <StatCard
          label="Current Streak"
          value={`${m.currentStreak} ${m.streakType === 'win' ? 'Wins' : m.streakType === 'loss' ? 'Losses' : ''}`}
          icon={Flame}
          accent={m.streakType === 'win' ? 'success' : 'destructive'}
        />
        <StatCard label="Avg Win / Loss" value={`${fmtCurrency(m.avgWin)} / ${fmtCurrency(m.avgLoss)}`} icon={Award} accent="primary" />
      </div>

      {/* Session + instrument breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-1">By Session</h3>
          <p className="text-xs text-muted-foreground mb-4">P&L distribution by trading session</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.bySession} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                <XAxis dataKey="key" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {m.bySession.map((s, i) => (
                    <Cell key={i} fill={sessionColors[s.key] || 'hsl(215 16% 50%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-1">By Instrument</h3>
          <p className="text-xs text-muted-foreground mb-4">Top instruments by P&L</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.byInstrument.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="key" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                  {m.byInstrument.slice(0, 6).map((s, i) => (
                    <Cell key={i} fill={s.pnl >= 0 ? 'hsl(152 65% 48%)' : 'hsl(0 72% 60%)'} />
                  ))}
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
                    { name: 'Wins', value: m.wins, color: 'hsl(152 65% 48%)' },
                    { name: 'Losses', value: m.losses, color: 'hsl(0 72% 60%)' },
                    { name: 'Breakeven', value: m.breakeven, color: 'hsl(215 16% 50%)' },
                  ]}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  stroke="none"
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

      {/* Open positions + Trading goals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" />
              <div>
                <h3 className="font-semibold">Open Positions</h3>
                <p className="text-xs text-muted-foreground">Live positions from connected brokers</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success font-medium">{positions.length} open</span>
          </div>
          {positions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No open positions. Connect a broker to see live trades.</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {positions.map((p) => {
                const pnl = Number(p.floating_pnl);
                const pnlPct = Number(p.entry_price) ? ((Number(p.current_price) - Number(p.entry_price)) / Number(p.entry_price)) * 100 : 0;
                const dirPct = p.direction === 'long' ? pnlPct : -pnlPct;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                    <div className="grid place-items-center w-9 h-9 rounded-lg bg-secondary/60">
                      <Circle className={`w-2 h-2 fill-current ${pnl >= 0 ? 'text-success' : 'text-destructive'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.instrument}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${p.direction === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                          {p.direction === 'long' ? <ArrowUpRight className="w-2.5 h-2.5 inline" /> : <ArrowDownRight className="w-2.5 h-2.5 inline" />} {p.direction}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fmtNum(Number(p.volume), 2)} lots @ {fmtNum(Number(p.entry_price))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {pnl >= 0 ? '+' : ''}{fmtCurrency(pnl)}
                      </div>
                      <div className={`text-xs ${dirPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {dirPct >= 0 ? '+' : ''}{fmtNum(dirPct, 2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" />
              <div>
                <h3 className="font-semibold">Trading Goals</h3>
                <p className="text-xs text-muted-foreground">Track progress toward your targets</p>
              </div>
            </div>
          </div>
          {goals.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No goals set. Create goals in your trading plan.</div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const pct = g.target_value > 0 ? Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100) : 0;
                const isProfit = g.goal_type === 'profit';
                const display = isProfit ? (n: number) => fmtCurrency(n) : (n: number) => fmtPct(n);
                return (
                  <div key={g.id} className="p-3 rounded-lg bg-secondary/40 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{g.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{g.period}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{display(Number(g.current_value))} / {display(Number(g.target_value))}</span>
                      <span className={`font-medium ${g.completed ? 'text-success' : pct >= 100 ? 'text-success' : 'text-primary'}`}>
                        {g.completed ? 'Done' : `${fmtNum(pct, 0)}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${g.completed || pct >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Recent Trades</h3>
            <p className="text-xs text-muted-foreground">Latest executed positions</p>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="font-medium pb-2 pr-4">Instrument</th>
                <th className="font-medium pb-2 pr-4">Direction</th>
                <th className="font-medium pb-2 pr-4">Session</th>
                <th className="font-medium pb-2 pr-4">R:R</th>
                <th className="font-medium pb-2 pr-4">Confidence</th>
                <th className="font-medium pb-2 pr-4 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 pr-4 font-medium">{t.instrument}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${t.direction === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                      {t.direction === 'long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 capitalize text-muted-foreground">{t.session || '—'}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">1:{fmtNum(t.rr, 1)}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${t.confidence}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{t.confidence}%</span>
                    </div>
                  </td>
                  <td className={`py-2.5 pr-4 text-right font-semibold ${Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {fmtCurrency(Number(t.pnl))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight, compact }: { insight: AiInsight; compact?: boolean }) {
  const accent: Record<string, string> = {
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    critical: 'border-destructive/30 bg-destructive/5',
    info: 'border-primary/30 bg-primary/5',
  };
  return (
    <div className={`rounded-lg border p-3 ${accent[insight.severity]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{insight.insight_type}</span>
      </div>
      <div className="text-sm font-medium mb-1">{insight.title}</div>
      {!compact && <p className="text-xs text-muted-foreground leading-relaxed">{insight.body}</p>}
      {compact && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{insight.body}</p>}
    </div>
  );
}
