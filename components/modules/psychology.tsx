'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
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
import { HeartPulse, Brain, Flame, ShieldCheck, AlertCircle, Plus, X } from 'lucide-react';
import { supabase, type PsychologyLog } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const METRICS = ['confidence', 'discipline', 'patience', 'execution_quality', 'fear', 'greed', 'fomo'] as const;

export function Psychology() {
  const [logs, setLogs] = useState<PsychologyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('psychology_logs').select('*').order('log_date', { ascending: true });
    setLogs((data || []) as PsychologyLog[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const latest = logs[logs.length - 1];
  const radarData = useMemo(() => {
    if (!latest) return [];
    return [
      { metric: 'Confidence', value: latest.confidence },
      { metric: 'Discipline', value: latest.discipline ?? 0 },
      { metric: 'Patience', value: latest.patience ?? 0 },
      { metric: 'Execution', value: latest.execution_quality ?? 0 },
      { metric: 'Calm', value: 100 - (latest.fear ?? 0) },
      { metric: 'Control', value: 100 - (latest.fomo ?? 0) },
    ];
  }, [latest]);

  const trendData = useMemo(() => logs.map((l) => ({
    date: fmtDate(l.log_date),
    confidence: l.confidence,
    discipline: l.discipline ?? 0,
    fomo: l.fomo ?? 0,
  })), [logs]);

  const avg = (key: keyof PsychologyLog) => {
    const vals = logs.map((l) => Number(l[key] || 0));
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Pill icon={Brain} label="Avg Confidence" value={avg('confidence')} tone="primary" />
        <Pill icon={ShieldCheck} label="Avg Discipline" value={avg('discipline')} tone="success" />
        <Pill icon={HeartPulse} label="Avg Patience" value={avg('patience')} tone="chart" />
        <Pill icon={Flame} label="Avg FOMO" value={avg('fomo')} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-1">Psychology Snapshot</h3>
          <p className="text-xs text-muted-foreground mb-4">{latest ? `Latest check-in: ${fmtDate(latest.log_date)}` : 'No check-ins yet'}</p>
          {radarData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="hsl(222 14% 22%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215 16% 65%)', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="hsl(199 89% 56%)" fill="hsl(199 89% 56%)" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 grid place-items-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-1">Trend Over Time</h3>
          <p className="text-xs text-muted-foreground mb-4">Last {logs.length} check-ins</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 18%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215 16% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 22% 9%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="confidence" stroke="hsl(199 89% 56%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="discipline" stroke="hsl(152 65% 48%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fomo" stroke="hsl(0 72% 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rule violations */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <h3 className="font-semibold">Rule Violations Log</h3>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> New Check-in
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
          {logs.slice().reverse().map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{fmtDate(l.log_date)}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{l.emotional_state || '—'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(l.rule_violations || []).length === 0 ? (
                    <span className="text-xs text-success">No violations</span>
                  ) : (
                    (l.rule_violations || []).map((v) => (
                      <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">{v}</span>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <Metric label="Conf" value={l.confidence} />
                <Metric label="Disc" value={l.discipline ?? 0} />
                <Metric label="FOMO" value={l.fomo ?? 0} tone="destructive" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && <CheckinForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function Pill({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: 'primary' | 'success' | 'chart' | 'destructive' }) {
  const toneMap: Record<string, string> = { primary: 'text-primary', success: 'text-success', chart: 'text-chart-4', destructive: 'text-destructive' };
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', toneMap[tone])} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn('text-2xl font-semibold', toneMap[tone])}>{value}</div>
    </div>
  );
}

function Metric({ label, value, tone = 'muted' }: { label: string; value: number; tone?: 'muted' | 'destructive' }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn('text-sm font-semibold', tone === 'destructive' ? 'text-destructive' : 'text-foreground')}>{value}</div>
    </div>
  );
}

function CheckinForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    confidence: 75,
    fear: 25,
    greed: 20,
    fomo: 30,
    discipline: 80,
    patience: 75,
    execution_quality: 78,
    emotional_state: 'Focused',
    rule_violations: [] as string[],
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const violations = ['Moved stop loss', 'Revenge trade', 'Skipped plan', 'Overtraded', 'Oversized position', 'Traded against plan'];

  const save = async () => {
    setSaving(true);
    await supabase.from('psychology_logs').insert({
      log_date: form.log_date,
      confidence: Number(form.confidence),
      fear: Number(form.fear),
      greed: Number(form.greed),
      fomo: Number(form.fomo),
      discipline: Number(form.discipline),
      patience: Number(form.patience),
      execution_quality: Number(form.execution_quality),
      emotional_state: form.emotional_state,
      rule_violations: form.rule_violations,
      notes: form.notes,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Daily Psychology Check-in</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Date</span><input type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} className="input" /></label>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Emotional State</span>
            <select value={form.emotional_state} onChange={(e) => setForm({ ...form, emotional_state: e.target.value })} className="input">
              {['Calm', 'Focused', 'Confident', 'Disciplined', 'Anxious', 'Tilted', 'FOMO', 'Greedy'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {([
              ['confidence', 'Confidence'],
              ['discipline', 'Discipline'],
              ['patience', 'Patience'],
              ['execution_quality', 'Execution Quality'],
              ['fear', 'Fear'],
              ['greed', 'Greed'],
              ['fomo', 'FOMO'],
            ] as const).map(([k, l]) => (
              <label key={k} className="block">
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">{l}: {form[k]}</span>
                <input type="range" min={0} max={100} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="w-full accent-primary" />
              </label>
            ))}
          </div>
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Rule Violations</span>
            <div className="flex flex-wrap gap-1.5">
              {violations.map((v) => (
                <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, rule_violations: f.rule_violations.includes(v) ? f.rule_violations.filter((x) => x !== v) : [...f.rule_violations, v] }))} className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-colors', form.rule_violations.includes(v) ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground')}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="input resize-none" placeholder="How did today feel? What patterns did you notice?" /></label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Check-in'}
          </button>
        </div>
      </div>
    </div>
  );
}
