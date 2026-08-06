'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Plus, Tag as TagIcon } from 'lucide-react';
import type { Trade, TradeTag } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';
import { logger } from '@/lib/logger';

const DIRECTIONS = ['long', 'short'] as const;
const STATUSES = ['open', 'closed', 'pending'] as const;
const SESSIONS = ['asia', 'london', 'new_york', 'sydney', 'other'] as const;
const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];
const MARKETS = ['Forex', 'Crypto', 'Stocks', 'Futures', 'Options', 'Commodities', 'Indices'];
const COMMON_MISTAKES = ['FOMO entry', 'Moved stop loss', 'Oversized position', 'Revenge trade', 'Early exit', 'Late entry', 'No stop loss', 'Ignored plan'];

type FormData = {
  instrument: string;
  market: string;
  direction: string;
  entry_price: string;
  exit_price: string;
  stop_loss: string;
  take_profit: string;
  quantity: string;
  risk_pct: string;
  pnl: string;
  rr: string;
  status: string;
  session: string;
  timeframe: string;
  setup_type: string;
  strategy_tags: string[];
  confidence: string;
  executed_at: string;
  closed_at: string;
  notes: string;
  before_notes: string;
  during_notes: string;
  after_notes: string;
  mistakes: string[];
  lessons_learned: string;
  screenshots: string[];
};

export function TradeForm({ trade, onClose, onSaved }: { trade: Trade | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormData>({
    instrument: trade?.instrument || '',
    market: trade?.market || '',
    direction: trade?.direction || 'long',
    entry_price: trade?.entry_price?.toString() || '',
    exit_price: trade?.exit_price?.toString() || '',
    stop_loss: trade?.stop_loss?.toString() || '',
    take_profit: trade?.take_profit?.toString() || '',
    quantity: trade?.quantity?.toString() || '1',
    risk_pct: trade?.risk_pct?.toString() || '',
    pnl: trade?.pnl?.toString() || '0',
    rr: trade?.rr?.toString() || '0',
    status: trade?.status || 'closed',
    session: trade?.session || 'london',
    timeframe: trade?.timeframe || '',
    setup_type: trade?.setup_type || '',
    strategy_tags: trade?.strategy_tags || [],
    confidence: trade?.confidence?.toString() || '',
    executed_at: trade?.executed_at ? toLocalInput(trade.executed_at) : '',
    closed_at: trade?.closed_at ? toLocalInput(trade.closed_at) : '',
    notes: trade?.notes || '',
    before_notes: trade?.before_notes || '',
    during_notes: trade?.during_notes || '',
    after_notes: trade?.after_notes || '',
    mistakes: trade?.mistakes || [],
    lessons_learned: trade?.lessons_learned || '',
    screenshots: trade?.screenshots || [],
  });
  const [tags, setTags] = useState<TradeTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('trade_tags').select('*').order('name').then(({ data }) => setTags((data || []) as TradeTag[]));
  }, []);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTag = (tagName: string) => {
    update('strategy_tags', form.strategy_tags.includes(tagName)
      ? form.strategy_tags.filter((t) => t !== tagName)
      : [...form.strategy_tags, tagName]);
  };

  const addCustomTag = async () => {
    const name = newTag.trim();
    if (!name || form.strategy_tags.includes(name)) return;
    toggleTag(name);
    const { data } = await supabase.from('trade_tags').insert({ name }).select().maybeSingle();
    if (data) setTags((prev) => [...prev, data as TradeTag]);
    setNewTag('');
  };

  const toggleMistake = (m: string) => {
    update('mistakes', (form.mistakes || []).includes(m)
      ? (form.mistakes || []).filter((x) => x !== m)
      : [...(form.mistakes || []), m]);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { setError(`File ${file.name} exceeds 5MB limit.`); continue; }
        const ext = file.name.split('.').pop();
        const path = `trades/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('screenshots').upload(path, file);
        if (upErr) { logger.error('TradeForm', 'Upload failed', { error: upErr.message }); continue; }
        const { data: url } = supabase.storage.from('screenshots').getPublicUrl(path);
        urls.push(url.publicUrl);
      }
      update('screenshots', [...form.screenshots, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (url: string) => {
    update('screenshots', form.screenshots.filter((s) => s !== url));
  };

  const validate = (): string | null => {
    if (!form.instrument.trim()) return 'Instrument is required.';
    if (!form.entry_price || parseFloat(form.entry_price) <= 0) return 'Entry price must be a positive number.';
    if (form.exit_price && parseFloat(form.exit_price) <= 0) return 'Exit price must be positive.';
    if (form.stop_loss && parseFloat(form.stop_loss) <= 0) return 'Stop loss must be positive.';
    if (form.take_profit && parseFloat(form.take_profit) <= 0) return 'Take profit must be positive.';
    if (!form.quantity || parseFloat(form.quantity) <= 0) return 'Position size must be a positive number.';
    if (form.confidence && (parseInt(form.confidence) < 0 || parseInt(form.confidence) > 100)) return 'Confidence must be between 0 and 100.';
    if (form.risk_pct && (parseFloat(form.risk_pct) < 0 || parseFloat(form.risk_pct) > 100)) return 'Risk % must be between 0 and 100.';
    if (form.executed_at && form.closed_at && new Date(form.closed_at) < new Date(form.executed_at)) return 'Exit date cannot be before entry date.';
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    const data: Record<string, unknown> = {
      instrument: form.instrument.toUpperCase().trim(),
      market: form.market || null,
      direction: form.direction,
      entry_price: parseFloat(form.entry_price),
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      quantity: parseFloat(form.quantity) || 1,
      risk_pct: form.risk_pct ? parseFloat(form.risk_pct) : null,
      pnl: parseFloat(form.pnl) || 0,
      rr: parseFloat(form.rr) || 0,
      status: form.status,
      session: form.session,
      timeframe: form.timeframe || null,
      setup_type: form.setup_type || null,
      strategy_tags: form.strategy_tags,
      confidence: form.confidence ? parseInt(form.confidence) : null,
      executed_at: form.executed_at ? new Date(form.executed_at).toISOString() : new Date().toISOString(),
      closed_at: form.closed_at ? new Date(form.closed_at).toISOString() : form.status === 'closed' ? new Date().toISOString() : null,
      notes: form.notes || null,
      before_notes: form.before_notes || null,
      during_notes: form.during_notes || null,
      after_notes: form.after_notes || null,
      mistakes: form.mistakes,
      lessons_learned: form.lessons_learned || null,
      screenshots: form.screenshots,
    };
    try {
      if (trade) {
        const { error: upErr } = await supabase.from('trades').update(data).eq('id', trade.id);
        if (upErr) throw upErr;
        emit('trade:updated', { id: trade.id, ...data }, 'journal');
      } else {
        const { error: inErr } = await supabase.from('trades').insert(data);
        if (inErr) throw inErr;
        emit('trade:created', data, 'journal');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trade');
      logger.error('TradeForm', 'Save failed', { error: err });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle>{trade ? 'Edit Trade' : 'Add Trade'}</DialogTitle></DialogHeader>
        <div className="space-y-6">
          {/* Basic */}
          <Section title="Basic">
            <Field label="Instrument *" className="col-span-2 sm:col-span-1"><Input value={form.instrument} onChange={(e) => update('instrument', e.target.value)} placeholder="EURUSD" /></Field>
            <Field label="Market" className="col-span-2 sm:col-span-1">
              <Select value={form.market} onValueChange={(v) => update('market', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Direction" className="col-span-2 sm:col-span-1">
              <Select value={form.direction} onValueChange={(v) => update('direction', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d === 'long' ? 'Buy (Long)' : 'Sell (Short)'}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status" className="col-span-2 sm:col-span-1">
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </Section>

          {/* Trade Details */}
          <Section title="Trade Details">
            <Field label="Entry Price *"><Input type="number" step="any" value={form.entry_price} onChange={(e) => update('entry_price', e.target.value)} placeholder="1.0850" /></Field>
            <Field label="Exit Price"><Input type="number" step="any" value={form.exit_price} onChange={(e) => update('exit_price', e.target.value)} placeholder="1.0900" /></Field>
            <Field label="Stop Loss"><Input type="number" step="any" value={form.stop_loss} onChange={(e) => update('stop_loss', e.target.value)} placeholder="1.0800" /></Field>
            <Field label="Take Profit"><Input type="number" step="any" value={form.take_profit} onChange={(e) => update('take_profit', e.target.value)} placeholder="1.1000" /></Field>
            <Field label="Position Size"><Input type="number" step="any" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} placeholder="1.0" /></Field>
            <Field label="Risk %"><Input type="number" step="any" value={form.risk_pct} onChange={(e) => update('risk_pct', e.target.value)} placeholder="1.0" /></Field>
            <Field label="P&L"><Input type="number" step="any" value={form.pnl} onChange={(e) => update('pnl', e.target.value)} placeholder="500" /></Field>
            <Field label="R:R Ratio"><Input type="number" step="any" value={form.rr} onChange={(e) => update('rr', e.target.value)} placeholder="2.0" /></Field>
          </Section>

          {/* Timing */}
          <Section title="Trade Timing">
            <Field label="Entry Date & Time"><Input type="datetime-local" value={form.executed_at} onChange={(e) => update('executed_at', e.target.value)} /></Field>
            <Field label="Exit Date & Time"><Input type="datetime-local" value={form.closed_at} onChange={(e) => update('closed_at', e.target.value)} /></Field>
          </Section>

          {/* Classification */}
          <Section title="Classification">
            <Field label="Session">
              <Select value={form.session} onValueChange={(v) => update('session', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Timeframe">
              <Select value={form.timeframe} onValueChange={(v) => update('timeframe', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{TIMEFRAMES.map((tf) => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Setup Type" className="col-span-2"><Input value={form.setup_type} onChange={(e) => update('setup_type', e.target.value)} placeholder="Breakout, Pullback, Reversal..." /></Field>
            <Field label="Confidence (0-100)"><Input type="number" value={form.confidence} onChange={(e) => update('confidence', e.target.value)} placeholder="75" /></Field>
          </Section>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><TagIcon className="w-3.5 h-3.5" /> Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button key={tag.id} onClick={() => toggleTag(tag.name)} className={cn('transition-all', )}>
                  <Badge variant={form.strategy_tags.includes(tag.name) ? 'default' : 'outline'} className="cursor-pointer hover:opacity-80">{tag.name}</Badge>
                </button>
              ))}
              {form.strategy_tags.filter((t) => !tags.some((tag) => tag.name === t)).map((t) => (
                <button key={t} onClick={() => toggleTag(t)}>
                  <Badge variant="default" className="cursor-pointer hover:opacity-80">{t}</Badge>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }} placeholder="Add custom tag..." className="text-xs" />
              <Button size="sm" variant="outline" onClick={addCustomTag}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          {/* Notes */}
          <Section title="Notes">
            <Field label="Trade Notes" className="col-span-2"><textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Trade rationale and observations..." rows={2} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></Field>
            <Field label="Before Notes" className="col-span-2"><textarea value={form.before_notes} onChange={(e) => update('before_notes', e.target.value)} placeholder="What was your plan before entering?" rows={2} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></Field>
            <Field label="During Notes" className="col-span-2"><textarea value={form.during_notes} onChange={(e) => update('during_notes', e.target.value)} placeholder="What happened during the trade?" rows={2} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></Field>
            <Field label="After Notes" className="col-span-2"><textarea value={form.after_notes} onChange={(e) => update('after_notes', e.target.value)} placeholder="Post-trade reflection..." rows={2} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></Field>
            <Field label="Lessons Learned" className="col-span-2"><textarea value={form.lessons_learned} onChange={(e) => update('lessons_learned', e.target.value)} placeholder="What did you learn from this trade?" rows={2} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></Field>
          </Section>

          {/* Mistakes */}
          <div className="space-y-2">
            <Label>Mistakes</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MISTAKES.map((m) => (
                <button key={m} onClick={() => toggleMistake(m)}>
                  <Badge variant={(form.mistakes || []).includes(m) ? 'destructive' : 'outline'} className="cursor-pointer hover:opacity-80">{m}</Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <Label>Chart Screenshots</Label>
            <div className="flex flex-wrap gap-2">
              {form.screenshots.map((url) => (
                <div key={url} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                  <button onClick={() => removeScreenshot(url)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </div>
              ))}
              <label className={cn('w-20 h-20 rounded-lg border-2 border-dashed border-border grid place-items-center cursor-pointer hover:border-primary/40 transition-colors', uploading && 'opacity-50')}>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
                {uploading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">Upload chart screenshots (max 5MB each).</p>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Save Trade'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
