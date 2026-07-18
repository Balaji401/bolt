'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeMetrics } from '@/lib/analytics';
import type { Trade } from '@/lib/supabase';
import { fmtCurrency, fmtNum, fmtPct } from '@/lib/format';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Analytics({ trades }: { trades: Trade[] }) {
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const [tab, setTab] = useState<'overview' | 'instrument' | 'session' | 'weekday' | 'strategy'>('overview');

  const radarData = [
    { metric: 'Win Rate', value: m.winRate },
    { metric: 'Profit Factor', value: Math.min(m.profitFactor * 40, 100) },
    { metric: 'Avg RR', value: Math.min(m.avgRr * 30, 100) },
    { metric: 'Expectancy', value: Math.max(0, Math.min((m.expectancy / 100) * 100 + 50, 100)) },
    { metric: 'Discipline', value: 84 },
    { metric: 'Confidence', value: 76 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Net P&L" value={fmtCurrency(m.totalPnl)} tone={m.totalPnl >= 0 ? 'success' : 'destructive'} />
        <Metric label="Profit Factor" value={fmtNum(m.profitFactor, 2)} tone="primary" />
        <Metric label="Expectancy" value={fmtCurrency(m.expectancy)} tone={m.expectancy >= 0 ? 'success' : 'destructive'} />
        <Metric label="Avg R:R" value={`1:${fmtNum(m.avgRr, 2)}`} tone="chart" />
        <Metric label="Best Trade" value={fmtCurrency(m.bestTrade)} tone="success" />
        <Metric label="Worst Trade" value={fmtCurrency(m.worstTrade)} tone="destructive" />
        <Metric label="Max Drawdown" value={fmtCurrency(m.maxDrawdown)} tone="warning" />
        <Metric label="Total Trades" value={String(m.totalTrades)} tone="primary" />
      </div>

      <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-1 w-fit">
        {(['overview', 'instrument', 'session', 'weekday', 'strategy'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'weekday' ? 'By Day' : t === 'instrument' ? 'By Instrument' : t === 'session' ? 'By Session' : t === 'strategy' ? 'By Strategy' : 'Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Performance Radar" subtitle="Multi-dimensional trading metrics">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="hsl(222 14% 22%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215 16% 65%)', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="hsl(199 89% 56%)" fill="hsl(199 89% 56%)" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Daily P&L" subtitle="Per-trade profit/loss sequence">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.equityCurve.map((p) => ({ i: p.i, pnl: p.pnl }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                  <XAxis dataKey="i" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {m.equityCurve.map((p, i) => (
                      <Cell key={i} fill={p.pnl >= 0 ? 'hsl(152 65% 48%)' : 'hsl(0 72% 60%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'instrument' && (
        <Panel title="Instrument Analysis" subtitle="P&L, win rate, and trade count by instrument">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.byInstrument} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                <XAxis dataKey="key" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={50} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                  {m.byInstrument.map((s, i) => (
                    <Cell key={i} fill={s.pnl >= 0 ? 'hsl(152 65% 48%)' : 'hsl(0 72% 60%)'} />
                  ))}
                </Bar>
                <Bar yAxisId="left" dataKey="trades" name="Trades" fill="hsl(280 65% 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <InstrumentTable rows={m.byInstrument} />
        </Panel>
      )}

      {tab === 'session' && (
        <Panel title="Session Analysis" subtitle="Which trading sessions are most profitable for you">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.bySession} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                  <XAxis dataKey="key" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]} fill="hsl(199 89% 56%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {m.bySession.map((s) => (
                <div key={s.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                  <div className="capitalize font-medium">{s.key}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{s.trades} trades</span>
                    <span className="text-muted-foreground">{fmtPct(s.winRate)}</span>
                    <span className={`font-semibold ${s.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtCurrency(s.pnl)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {tab === 'weekday' && (
        <Panel title="Weekday Performance" subtitle="Identify your best and worst trading days">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.byWeekday} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {m.byWeekday.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? 'hsl(152 65% 48%)' : 'hsl(0 72% 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {tab === 'strategy' && (
        <Panel title="Strategy Performance" subtitle="Compare your trading strategies">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.byStrategy} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="key" tick={{ fill: 'hsl(215 16% 65%)', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'hsl(222 14% 18% / 0.3)' }} formatter={(v: number) => [fmtCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                  {m.byStrategy.map((s, i) => (
                    <Cell key={i} fill={s.pnl >= 0 ? 'hsl(152 65% 48%)' : 'hsl(0 72% 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'success' | 'destructive' | 'warning' | 'primary' | 'chart' }) {
  const toneMap: Record<string, string> = {
    success: 'text-success',
    destructive: 'text-destructive',
    warning: 'text-warning',
    primary: 'text-primary',
    chart: 'text-chart-4',
  };
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-semibold ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}

function InstrumentTable({ rows }: { rows: { key: string; pnl: number; trades: number; winRate: number }[] }) {
  return (
    <div className="mt-4 overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="font-medium pb-2 pr-4">Instrument</th>
            <th className="font-medium pb-2 pr-4 text-right">Trades</th>
            <th className="font-medium pb-2 pr-4 text-right">Win Rate</th>
            <th className="font-medium pb-2 pr-4 text-right">P&L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/40">
              <td className="py-2 pr-4 font-medium">{r.key}</td>
              <td className="py-2 pr-4 text-right text-muted-foreground">{r.trades}</td>
              <td className="py-2 pr-4 text-right text-muted-foreground">{fmtPct(r.winRate)}</td>
              <td className={`py-2 pr-4 text-right font-semibold ${r.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtCurrency(r.pnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
