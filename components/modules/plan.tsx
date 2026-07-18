'use client';

import { useEffect, useState } from 'react';
import { Target, Plus, Check, X, Shield, ListChecks, Calendar } from 'lucide-react';
import { supabase, type TradingPlan } from '@/lib/supabase';
import { fmtCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Plan() {
  const [plans, setPlans] = useState<TradingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('trading_plan').select('*').order('created_at', { ascending: false });
    setPlans((data || []) as TradingPlan[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatTile icon={Shield} label="Max Daily Loss" value={fmtCurrency(500)} tone="destructive" />
        <StatTile icon={Target} label="Max Risk / Trade" value="1.5%" tone="warning" />
        <StatTile icon={Calendar} label="Weekly Target" value={fmtCurrency(2000)} tone="success" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Trading Plans</h3>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No trading plans yet. Create your first plan to define your rules and limits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((p) => <PlanCard key={p.id} plan={p} onChange={load} />)}
        </div>
      )}

      {showForm && <PlanForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'success' | 'warning' | 'destructive' }) {
  const toneMap: Record<string, string> = { success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' };
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className="grid place-items-center w-10 h-10 rounded-lg bg-secondary/60">
        <Icon className={cn('w-5 h-5', toneMap[tone])} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={cn('text-lg font-semibold', toneMap[tone])}>{value}</div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onChange }: { plan: TradingPlan; onChange: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (list: string, item: string) => setChecked((c) => ({ ...c, [`${list}:${item}`]: !c[`${list}:${item}`] }));

  const lists: { key: keyof TradingPlan; title: string }[] = [
    { key: 'entry_checklist', title: 'Entry Checklist' },
    { key: 'exit_checklist', title: 'Exit Checklist' },
    { key: 'session_checklist', title: 'Session Checklist' },
    { key: 'rules', title: 'Trading Rules' },
  ];

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded', plan.plan_type === 'daily' ? 'bg-primary/15 text-primary' : plan.plan_type === 'weekly' ? 'bg-success/15 text-success' : 'bg-chart-4/15 text-chart-4')}>
              {plan.plan_type}
            </span>
            {plan.active && <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-success/15 text-success">Active</span>}
          </div>
          <h3 className="font-semibold mt-2">{plan.title}</h3>
        </div>
        <button onClick={async () => { await supabase.from('trading_plan').delete().eq('id', plan.id); onChange(); }} className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive">
          <X className="w-4 h-4" />
        </button>
      </div>

      {(plan.max_daily_loss || plan.max_weekly_loss || plan.max_risk_per_trade) && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {plan.max_daily_loss != null && <Mini label="Max Daily Loss" value={fmtCurrency(Number(plan.max_daily_loss))} />}
          {plan.max_weekly_loss != null && <Mini label="Max Weekly Loss" value={fmtCurrency(Number(plan.max_weekly_loss))} />}
          {plan.max_risk_per_trade != null && <Mini label="Risk / Trade" value={`${plan.max_risk_per_trade}%`} />}
        </div>
      )}

      <div className="space-y-4">
        {lists.map(({ key, title }) => {
          const items = (plan[key] as string[]) || [];
          if (!items.length) return null;
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => {
                  const k = `${key}:${item}`;
                  return (
                    <button key={item} onClick={() => toggle(key, item)} className="flex items-center gap-2 w-full text-left text-sm group">
                      <span className={cn('grid place-items-center w-4 h-4 rounded border transition-colors shrink-0', checked[k] ? 'bg-success border-success' : 'border-border group-hover:border-primary')}>
                        {checked[k] && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className={cn(checked[k] && 'line-through text-muted-foreground')}>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function PlanForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    plan_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    title: '',
    max_daily_loss: '500',
    max_weekly_loss: '2000',
    max_risk_per_trade: '1.5',
    entry_checklist: 'Trend alignment on higher timeframe\nClear support/resistance level\nRisk under 1.5%\nNo major news within 30 min',
    exit_checklist: 'Hit target or stop\nTrailing stop in profit\nTime-based exit after 4 hours',
    session_checklist: 'London open\nNew York open',
    rules: 'No revenge trading\nMax 5 trades per day\nNo trading after 2 losses in a row',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('trading_plan').insert({
      plan_type: form.plan_type,
      title: form.title || `${form.plan_type} plan`,
      max_daily_loss: Number(form.max_daily_loss) || null,
      max_weekly_loss: Number(form.max_weekly_loss) || null,
      max_risk_per_trade: Number(form.max_risk_per_trade) || null,
      entry_checklist: form.entry_checklist.split('\n').filter(Boolean),
      exit_checklist: form.exit_checklist.split('\n').filter(Boolean),
      session_checklist: form.session_checklist.split('\n').filter(Boolean),
      rules: form.rules.split('\n').filter(Boolean),
      goals: [],
      active: true,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">New Trading Plan</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-muted-foreground mb-1.5">Plan Type</span>
              <select value={form.plan_type} onChange={(e) => setForm({ ...form, plan_type: e.target.value as any })} className="input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-muted-foreground mb-1.5">Title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. London breakout plan" className="input" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Max Daily Loss ($)</span><input type="number" value={form.max_daily_loss} onChange={(e) => setForm({ ...form, max_daily_loss: e.target.value })} className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Max Weekly Loss ($)</span><input type="number" value={form.max_weekly_loss} onChange={(e) => setForm({ ...form, max_weekly_loss: e.target.value })} className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Risk / Trade (%)</span><input type="number" value={form.max_risk_per_trade} onChange={(e) => setForm({ ...form, max_risk_per_trade: e.target.value })} className="input" /></label>
          </div>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Entry Checklist (one per line)</span><textarea value={form.entry_checklist} onChange={(e) => setForm({ ...form, entry_checklist: e.target.value })} rows={4} className="input resize-none" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Exit Checklist</span><textarea value={form.exit_checklist} onChange={(e) => setForm({ ...form, exit_checklist: e.target.value })} rows={3} className="input resize-none" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Session Checklist</span><textarea value={form.session_checklist} onChange={(e) => setForm({ ...form, session_checklist: e.target.value })} rows={2} className="input resize-none" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Trading Rules</span><textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={3} className="input resize-none" /></label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
