'use client';

import { useMemo, useState } from 'react';
import { Calculator, DollarSign, Percent, Scale, TrendingUp, Coins, Activity, Layers } from 'lucide-react';
import { fmtCurrency, fmtNum } from '@/lib/format';
import { cn } from '@/lib/utils';

type CalcKey = 'position' | 'risk' | 'lot' | 'margin' | 'drawdown' | 'profit' | 'compound' | 'pip' | 'rr';

const calcs: { key: CalcKey; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: 'position', label: 'Position Size', icon: Layers, desc: 'Calculate lot size from account risk' },
  { key: 'risk', label: 'Risk Calculator', icon: Activity, desc: 'Money at risk for a given stop' },
  { key: 'lot', label: 'Lot Size', icon: Scale, desc: 'Units from lot size' },
  { key: 'margin', label: 'Margin', icon: DollarSign, desc: 'Required margin for a position' },
  { key: 'drawdown', label: 'Drawdown', icon: TrendingUp, desc: 'Recovery from drawdown' },
  { key: 'profit', label: 'Profit Target', icon: Percent, desc: 'Required return to hit a goal' },
  { key: 'compound', label: 'Compound Growth', icon: Calculator, desc: 'Project compounded equity' },
  { key: 'pip', label: 'Pip Value', icon: Coins, desc: 'Per-pip monetary value' },
  { key: 'rr', label: 'Risk : Reward', icon: Scale, desc: 'Evaluate a trade setup' },
];

export function RiskManagement() {
  const [active, setActive] = useState<CalcKey>('position');
  const current = calcs.find((c) => c.key === active)!;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {calcs.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={cn(
                'group glass rounded-xl p-3 text-left transition-all hover:border-primary/40',
                isActive && 'border-primary bg-primary/5'
              )}
            >
              <div className={cn('grid place-items-center w-9 h-9 rounded-lg mb-2 transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground')}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{c.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid place-items-center w-10 h-10 rounded-lg bg-primary/15 text-primary">
            <current.icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{current.label} Calculator</h3>
            <p className="text-xs text-muted-foreground">{current.desc}</p>
          </div>
        </div>
        {active === 'position' && <PositionCalc />}
        {active === 'risk' && <RiskCalc />}
        {active === 'lot' && <LotCalc />}
        {active === 'margin' && <MarginCalc />}
        {active === 'drawdown' && <DrawdownCalc />}
        {active === 'profit' && <ProfitCalc />}
        {active === 'compound' && <CompoundCalc />}
        {active === 'pip' && <PipCalc />}
        {active === 'rr' && <RrCalc />}
      </div>
    </div>
  );
}

function ResultCard({ label, value, sub, tone = 'primary' }: { label: string; value: string; sub?: string; tone?: 'primary' | 'success' | 'warning' | 'destructive' }) {
  const toneMap: Record<string, string> = {
    primary: 'from-primary/20 to-transparent text-primary',
    success: 'from-success/20 to-transparent text-success',
    warning: 'from-warning/20 to-transparent text-warning',
    destructive: 'from-destructive/20 to-transparent text-destructive',
  };
  return (
    <div className="relative overflow-hidden glass rounded-xl p-5">
      <div className={cn('absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br blur-3xl opacity-50', toneMap[tone])} />
      <div className="relative">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

function PositionCalc() {
  const [balance, setBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [entry, setEntry] = useState('1.0850');
  const [stop, setStop] = useState('1.0800');
  const [pipValue, setPipValue] = useState('10');
  const risk = (Number(balance) * Number(riskPct)) / 100;
  const stopPips = Math.abs(Number(entry) - Number(stop)) * 10000;
  const lots = stopPips > 0 ? risk / (stopPips * Number(pipValue)) : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Account Balance ($)"><input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="input" /></Field>
        <Field label="Risk per Trade (%)"><input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className="input" /></Field>
        <Field label="Entry Price"><input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} className="input" /></Field>
        <Field label="Stop Loss Price"><input type="number" value={stop} onChange={(e) => setStop(e.target.value)} className="input" /></Field>
        <Field label="Pip Value ($/pip per lot)"><input type="number" value={pipValue} onChange={(e) => setPipValue(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Position Size" value={fmtNum(lots, 2) + ' lots'} sub={`${fmtNum(lots * 100000, 0)} units`} tone="primary" />
        <ResultCard label="Risk Amount" value={fmtCurrency(risk)} sub={`${riskPct}% of ${fmtCurrency(Number(balance))}`} tone="warning" />
        <ResultCard label="Stop Distance" value={fmtNum(stopPips, 0) + ' pips'} sub={`$${fmtNum(stopPips * Number(pipValue) * lots, 2)} per lot`} tone="success" />
      </div>
    </div>
  );
}

function RiskCalc() {
  const [balance, setBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('2');
  const [entry, setEntry] = useState('1.0850');
  const [stop, setStop] = useState('1.0820');
  const risk = (Number(balance) * Number(riskPct)) / 100;
  const stopPips = Math.abs(Number(entry) - Number(stop)) * 10000;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Account Balance ($)"><input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="input" /></Field>
        <Field label="Risk per Trade (%)"><input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className="input" /></Field>
        <Field label="Entry Price"><input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} className="input" /></Field>
        <Field label="Stop Loss Price"><input type="number" value={stop} onChange={(e) => setStop(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Risk Amount" value={fmtCurrency(risk)} tone="warning" />
        <ResultCard label="Stop Distance" value={fmtNum(stopPips, 0) + ' pips'} tone="primary" />
        <ResultCard label="Risk %" value={riskPct + '%'} sub={`of ${fmtCurrency(Number(balance))}`} tone="success" />
      </div>
    </div>
  );
}

function LotCalc() {
  const [lots, setLots] = useState('1');
  const units = Number(lots) * 100000;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Lot Size"><input type="number" value={lots} onChange={(e) => setLots(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Units" value={fmtNum(units, 0)} sub="Standard lot = 100,000 units" tone="primary" />
        <ResultCard label="Mini Lots" value={fmtNum(Number(lots) * 10, 1)} sub="10,000 units each" tone="success" />
        <ResultCard label="Micro Lots" value={fmtNum(Number(lots) * 100, 0)} sub="1,000 units each" tone="warning" />
      </div>
    </div>
  );
}

function MarginCalc() {
  const [lots, setLots] = useState('1');
  const [price, setPrice] = useState('1.0850');
  const [leverage, setLeverage] = useState('30');
  const notional = Number(lots) * 100000 * Number(price);
  const margin = notional / Number(leverage);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Lot Size"><input type="number" value={lots} onChange={(e) => setLots(e.target.value)} className="input" /></Field>
        <Field label="Current Price"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input" /></Field>
        <Field label="Leverage (1:x)"><input type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Required Margin" value={fmtCurrency(margin)} tone="warning" />
        <ResultCard label="Notional Value" value={fmtCurrency(notional)} tone="primary" />
        <ResultCard label="Leverage Used" value={`1:${leverage}`} tone="success" />
      </div>
    </div>
  );
}

function DrawdownCalc() {
  const [peak, setPeak] = useState('15000');
  const [trough, setTrough] = useState('12000');
  const ddPct = Number(peak) > 0 ? ((Number(peak) - Number(trough)) / Number(peak)) * 100 : 0;
  const recoveryPct = Number(trough) > 0 ? (Number(peak) / Number(trough) - 1) * 100 : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Peak Equity ($)"><input type="number" value={peak} onChange={(e) => setPeak(e.target.value)} className="input" /></Field>
        <Field label="Trough Equity ($)"><input type="number" value={trough} onChange={(e) => setTrough(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Drawdown" value={fmtNum(ddPct, 1) + '%'} sub={fmtCurrency(Number(peak) - Number(trough)) + ' lost'} tone="destructive" />
        <ResultCard label="Recovery Required" value={fmtNum(recoveryPct, 1) + '%'} sub="Gain needed to reach peak" tone="warning" />
      </div>
    </div>
  );
}

function ProfitCalc() {
  const [start, setStart] = useState('10000');
  const [target, setTarget] = useState('15000');
  const gain = Number(start) > 0 ? ((Number(target) - Number(start)) / Number(start)) * 100 : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Starting Balance ($)"><input type="number" value={start} onChange={(e) => setStart(e.target.value)} className="input" /></Field>
        <Field label="Target Balance ($)"><input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Required Return" value={fmtNum(gain, 1) + '%'} tone="success" />
        <ResultCard label="Profit Target" value={fmtCurrency(Number(target) - Number(start))} tone="primary" />
      </div>
    </div>
  );
}

function CompoundCalc() {
  const [start, setStart] = useState('10000');
  const [monthlyReturn, setMonthlyReturn] = useState('5');
  const [months, setMonths] = useState('12');
  const final = Number(start) * Math.pow(1 + Number(monthlyReturn) / 100, Number(months));
  const series = useMemo(() => {
    const arr = [{ m: 0, v: Number(start) }];
    for (let i = 1; i <= Number(months); i++) arr.push({ m: i, v: Number(start) * Math.pow(1 + Number(monthlyReturn) / 100, i) });
    return arr;
  }, [start, monthlyReturn, months]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Starting Balance ($)"><input type="number" value={start} onChange={(e) => setStart(e.target.value)} className="input" /></Field>
        <Field label="Monthly Return (%)"><input type="number" value={monthlyReturn} onChange={(e) => setMonthlyReturn(e.target.value)} className="input" /></Field>
        <Field label="Months"><input type="number" value={months} onChange={(e) => setMonths(e.target.value)} className="input" /></Field>
        <div className="pt-2 max-h-40 overflow-y-auto scrollbar-thin space-y-1">
          {series.slice(1).map((s) => (
            <div key={s.m} className="flex justify-between text-xs px-2 py-1 rounded bg-secondary/40">
              <span className="text-muted-foreground">Month {s.m}</span>
              <span className="font-medium">{fmtCurrency(s.v)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <ResultCard label="Final Balance" value={fmtCurrency(final)} sub={`After ${months} months`} tone="success" />
        <ResultCard label="Total Growth" value={fmtNum(((final - Number(start)) / Number(start)) * 100, 1) + '%'} tone="primary" />
        <ResultCard label="Total Profit" value={fmtCurrency(final - Number(start))} tone="warning" />
      </div>
    </div>
  );
}

function PipCalc() {
  const [lots, setLots] = useState('1');
  const [pair, setPair] = useState('EURUSD');
  const [rate, setRate] = useState('1.0850');
  const pipValue = pair.endsWith('JPY') ? (Number(lots) * 100000 * 0.01) / Number(rate) : Number(lots) * 100000 * 0.0001;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Lot Size"><input type="number" value={lots} onChange={(e) => setLots(e.target.value)} className="input" /></Field>
        <Field label="Currency Pair">
          <select value={pair} onChange={(e) => setPair(e.target.value)} className="input">
            <option value="EURUSD">EURUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="USDJPY">USDJPY</option>
            <option value="XAUUSD">XAUUSD</option>
          </select>
        </Field>
        <Field label="Current Rate"><input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Pip Value" value={fmtCurrency(pipValue)} sub="Per pip per lot" tone="primary" />
        <ResultCard label="Per 10 Pips" value={fmtCurrency(pipValue * 10)} tone="success" />
        <ResultCard label="Per 50 Pips" value={fmtCurrency(pipValue * 50)} tone="warning" />
      </div>
    </div>
  );
}

function RrCalc() {
  const [entry, setEntry] = useState('1.0850');
  const [stop, setStop] = useState('1.0820');
  const [target, setTarget] = useState('1.0920');
  const risk = Math.abs(Number(entry) - Number(stop));
  const reward = Math.abs(Number(target) - Number(entry));
  const rr = risk > 0 ? reward / risk : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Field label="Entry Price"><input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} className="input" /></Field>
        <Field label="Stop Loss"><input type="number" value={stop} onChange={(e) => setStop(e.target.value)} className="input" /></Field>
        <Field label="Take Profit"><input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="input" /></Field>
      </div>
      <div className="space-y-3">
        <ResultCard label="Risk : Reward" value={`1 : ${fmtNum(rr, 2)}`} sub={rr >= 2 ? 'Excellent setup' : rr >= 1 ? 'Acceptable' : 'Poor setup'} tone={rr >= 2 ? 'success' : rr >= 1 ? 'warning' : 'destructive'} />
        <ResultCard label="Risk (pips)" value={fmtNum(risk * 10000, 0)} tone="destructive" />
        <ResultCard label="Reward (pips)" value={fmtNum(reward * 10000, 0)} tone="success" />
      </div>
    </div>
  );
}
