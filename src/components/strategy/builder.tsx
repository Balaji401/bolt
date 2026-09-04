'use client';
import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { Strategy } from '@/lib/supabase';
import { DEFAULT_STRATEGY_CATEGORIES, INSTRUMENT_TYPES, STRATEGY_STATUSES, TIMEFRAMES } from '@/lib/strategy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StrategyBuilder({ strategy, onSave, onCancel }: { strategy: Strategy | null; onSave: (data: Partial<Strategy>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm({
      name: strategy?.name || '', category: strategy?.category || DEFAULT_STRATEGY_CATEGORIES[0], description: strategy?.description || '', market: strategy?.market || '', instrument_type: strategy?.instrument_type || 'Forex', timeframe: strategy?.timeframe || '1h', status: strategy?.status || 'active', market_conditions: strategy?.market_conditions || '', entry_conditions: strategy?.entry_conditions || '', exit_conditions: strategy?.exit_conditions || '', risk_rules: strategy?.risk_rules || '', position_rules: strategy?.position_rules || '', advantages: strategy?.advantages || '', weaknesses: strategy?.weaknesses || '', common_mistakes: strategy?.common_mistakes || '', improvements: strategy?.improvements || '', tags: (strategy?.tags || []).join(', '),
    });
  }, [strategy]);
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const save = async () => { if (!form.name.trim()) return; setSaving(true); await onSave({ ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }); setSaving(false); };
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">{strategy ? 'Edit Strategy' : 'Build New Strategy'}</CardTitle><Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button></CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-primary">General</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Strategy Name *</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="London Breakout" /></div><div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(value) => update('category', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEFAULT_STRATEGY_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Market</Label><Input value={form.market || ''} onChange={(e) => update('market', e.target.value)} placeholder="EUR/USD, BTC/USD, S&P 500" /></div><div className="space-y-2"><Label>Instrument Type</Label><Select value={form.instrument_type} onValueChange={(value) => update('instrument_type', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INSTRUMENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Timeframe</Label><Select value={form.timeframe} onValueChange={(value) => update('timeframe', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMEFRAMES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STRATEGY_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="What is this strategy designed to capture?" /></div><div className="space-y-2"><Label>Tags</Label><Input value={form.tags || ''} onChange={(e) => update('tags', e.target.value)} placeholder="breakout, London, momentum" /></div></section>
        <section className="space-y-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Trading Rules</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[['market_conditions','Market Conditions','When does this strategy work best?'],['entry_conditions','Entry Conditions','What must be true before entry?'],['exit_conditions','Exit Conditions','Where and why do you exit?'],['risk_rules','Risk Rules','Define stop loss, risk %, and max exposure.'],['position_rules','Position Rules','Define sizing and scaling rules.']].map(([key, label, placeholder]) => <div key={key} className="space-y-2"><Label>{label}</Label><Textarea value={form[key] || ''} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} className="min-h-[90px]" /></div>)}</div></section>
        <section className="space-y-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Additional Notes</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[['advantages','Advantages'],['weaknesses','Weaknesses'],['common_mistakes','Common Mistakes'],['improvements','Improvements']].map(([key, label]) => <div key={key} className="space-y-2"><Label>{label}</Label><Textarea value={form[key] || ''} onChange={(e) => update(key, e.target.value)} className="min-h-[90px]" /></div>)}</div></section>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={save} disabled={saving || !form.name?.trim()}><Save className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : 'Save Strategy'}</Button></div>
      </CardContent>
    </Card>
  );
}
