'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, X, ArrowUpRight, ArrowDownRight, Pencil, Trash2, Grid3x3 } from 'lucide-react';
import { supabase, type Trade } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { fmtCurrency, fmtDateTime, fmtNum, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';

const INSTRUMENTS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'ETHUSD', 'AAPL', 'TSLA', 'SP500', 'NAS100', 'GBPJPY', 'AUDUSD', 'USDCAD', 'US30', 'BRENT', 'CRUDE'];
const STRATEGIES = ['Breakout', 'Trend Follow', 'Reversal', 'Scalp', 'Swing', 'Position'];
const EMOTIONS = ['Confident', 'Calm', 'FOMO', 'Disciplined', 'Hesitant', 'Greedy', 'Fearful', 'Patient'];
const SESSIONS = ['asia', 'london', 'new_york', 'sydney', 'other'];

export function Journal({ trades, onMutated }: { trades: Trade[]; onMutated: () => void }) {
  const [search, setSearch] = useState('');
  const [filterDir, setFilterDir] = useState<'all' | 'long' | 'short'>('all');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'win' | 'loss'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => (search ? t.instrument.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase()) : true))
      .filter((t) => (filterDir === 'all' ? true : t.direction === filterDir))
      .filter((t) => (filterOutcome === 'all' ? true : filterOutcome === 'win' ? Number(t.pnl) > 0 : Number(t.pnl) < 0))
      .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());
  }, [trades, search, filterDir, filterOutcome]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by instrument or notes..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Segmented
            value={filterDir}
            onChange={setFilterDir}
            options={[{ v: 'all', l: 'All' }, { v: 'long', l: 'Long' }, { v: 'short', l: 'Short' }]}
          />
          <Segmented
            value={filterOutcome}
            onChange={setFilterOutcome}
            options={[{ v: 'all', l: 'All' }, { v: 'win', l: 'Wins' }, { v: 'loss', l: 'Losses' }]}
          />
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Trade
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                <th className="font-medium px-4 py-3">Instrument</th>
                <th className="font-medium px-4 py-3">Direction</th>
                <th className="font-medium px-4 py-3">Entry</th>
                <th className="font-medium px-4 py-3">Exit</th>
                <th className="font-medium px-4 py-3">Qty</th>
                <th className="font-medium px-4 py-3">R:R</th>
                <th className="font-medium px-4 py-3">Session</th>
                <th className="font-medium px-4 py-3">Strategy</th>
                <th className="font-medium px-4 py-3">Executed</th>
                <th className="font-medium px-4 py-3 text-right">P&L</th>
                <th className="font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-muted-foreground py-12 text-sm">No trades match your filters.</td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors group">
                  <td className="px-4 py-3 font-medium">{t.instrument}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', t.direction === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive')}>
                      {t.direction === 'long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtNum(Number(t.entry_price))}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.exit_price ? fmtNum(Number(t.exit_price)) : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtNum(Number(t.quantity), 2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">1:{fmtNum(Number(t.rr), 1)}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{t.session || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(t.strategy_tags || []).slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(t.executed_at)}</td>
                  <td className={cn('px-4 py-3 text-right font-semibold', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
                    {fmtCurrency(Number(t.pnl))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(t); setShowForm(true); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteTrade(t.id, onMutated)} className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TradeForm
          trade={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onMutated(); }}
        />
      )}

      <StrategySessionMatrix trades={trades} />
    </div>
  );
}

function StrategySessionMatrix({ trades }: { trades: Trade[] }) {
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const sessions = ['asia', 'london', 'new_york', 'sydney', 'other'];
  const strategies = Array.from(new Set(m.byStrategySession.map((s) => s.strategy)));
  if (strategies.length === 0) return null;

  const get = (strat: string, sess: string) => m.byStrategySession.find((x) => x.strategy === strat && x.session === sess);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="w-4 h-4 text-primary" />
        <div>
          <h3 className="font-semibold">Strategy × Session Breakdown</h3>
          <p className="text-xs text-muted-foreground">P&L per strategy across each trading session</p>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="font-medium pb-2 pr-4">Strategy</th>
              {sessions.map((s) => (
                <th key={s} className="font-medium pb-2 pr-4 capitalize">{s}</th>
              ))}
              <th className="font-medium pb-2 pr-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strat) => {
              const rowTotal = sessions.reduce((sum, s) => sum + (get(strat, s)?.pnl || 0), 0);
              return (
                <tr key={strat} className="border-b border-border/40 hover:bg-secondary/20">
                  <td className="py-2.5 pr-4 font-medium">{strat}</td>
                  {sessions.map((s) => {
                    const cell = get(strat, s);
                    if (!cell) return <td key={s} className="py-2.5 pr-4 text-muted-foreground/40">—</td>;
                    return (
                      <td key={s} className="py-2.5 pr-4">
                        <div className={cn('font-semibold', cell.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                          {fmtCurrency(cell.pnl)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{cell.trades}t • {fmtPct(cell.winRate)}</div>
                      </td>
                    );
                  })}
                  <td className={cn('py-2.5 pr-4 text-right font-semibold', rowTotal >= 0 ? 'text-success' : 'text-destructive')}>
                    {fmtCurrency(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex items-center bg-secondary/60 border border-border rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', value === o.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

async function deleteTrade(id: string, onMutated: () => void) {
  if (!confirm('Delete this trade?')) return;
  await supabase.from('trades').delete().eq('id', id);
  onMutated();
}

function TradeForm({ trade, onClose, onSaved }: { trade: Trade | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    instrument: trade?.instrument || 'EURUSD',
    direction: trade?.direction || 'long',
    entry_price: trade?.entry_price?.toString() || '',
    exit_price: trade?.exit_price?.toString() || '',
    quantity: trade?.quantity?.toString() || '1',
    stop_loss: trade?.stop_loss?.toString() || '',
    take_profit: trade?.take_profit?.toString() || '',
    pnl: trade?.pnl?.toString() || '0',
    rr: trade?.rr?.toString() || '2',
    status: trade?.status || 'closed',
    session: trade?.session || 'london',
    strategy_tags: trade?.strategy_tags || [],
    emotions: trade?.emotions || [],
    confidence: trade?.confidence?.toString() || '70',
    notes: trade?.notes || '',
    executed_at: trade?.executed_at ? new Date(trade.executed_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  const toggleArr = (field: 'strategy_tags' | 'emotions', v: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(v) ? f[field].filter((x) => x !== v) : [...f[field], v],
    }));
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      instrument: form.instrument,
      direction: form.direction,
      entry_price: Number(form.entry_price) || 0,
      exit_price: form.exit_price ? Number(form.exit_price) : null,
      quantity: Number(form.quantity) || 1,
      stop_loss: form.stop_loss ? Number(form.stop_loss) : null,
      take_profit: form.take_profit ? Number(form.take_profit) : null,
      pnl: Number(form.pnl) || 0,
      rr: Number(form.rr) || 0,
      status: form.status,
      session: form.session,
      strategy_tags: form.strategy_tags,
      emotions: form.emotions,
      confidence: Number(form.confidence) || 0,
      notes: form.notes,
      executed_at: new Date(form.executed_at).toISOString(),
      closed_at: form.status === 'closed' ? new Date().toISOString() : null,
    };
    if (trade) {
      await supabase.from('trades').update(payload).eq('id', trade.id);
    } else {
      await supabase.from('trades').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">{trade ? 'Edit Trade' : 'New Trade'}</h2>
            <p className="text-xs text-muted-foreground">Log every detail for AI-powered insights</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Instrument">
              <select value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} className="input">
                {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as 'long' | 'short' })} className="input">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'open' | 'closed' | 'pending' })} className="input">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </Field>
            <Field label="Entry Price"><input type="number" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} className="input" /></Field>
            <Field label="Exit Price"><input type="number" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} className="input" /></Field>
            <Field label="Quantity"><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" /></Field>
            <Field label="Stop Loss"><input type="number" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} className="input" /></Field>
            <Field label="Take Profit"><input type="number" value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: e.target.value })} className="input" /></Field>
            <Field label="Risk : Reward (1:x)"><input type="number" value={form.rr} onChange={(e) => setForm({ ...form, rr: e.target.value })} className="input" /></Field>
            <Field label="P&L ($)"><input type="number" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} className="input" /></Field>
            <Field label="Confidence (%)"><input type="number" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} className="input" /></Field>
            <Field label="Session">
              <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value as any })} className="input">
                {SESSIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </Field>
            <Field label="Executed At"><input type="datetime-local" value={form.executed_at} onChange={(e) => setForm({ ...form, executed_at: e.target.value })} className="input" /></Field>
          </div>

          <Field label="Strategy Tags">
            <div className="flex flex-wrap gap-1.5">
              {STRATEGIES.map((s) => (
                <Chip key={s} active={form.strategy_tags.includes(s)} onClick={() => toggleArr('strategy_tags', s)}>{s}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Emotions">
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((s) => (
                <Chip key={s} active={form.emotions.includes(s)} onClick={() => toggleArr('emotions', s)}>{s}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="input resize-none" placeholder="What was your thesis? How did execution feel?" />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : trade ? 'Save Changes' : 'Add Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-colors', active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground')}
    >
      {children}
    </button>
  );
}
