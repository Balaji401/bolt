'use client';
import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Save, Star } from 'lucide-react';
import type { Trade, TradeReview } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function TradeReviewEditor({ trade, onSaved }: { trade: Trade; onSaved?: () => void }) {
  const [review, setReview] = useState<TradeReview | null>(null);
  const [form, setForm] = useState({
    why_taken: '', followed_setup: 'null', respected_risk: 'null',
    entered_early: 'null', exited_early: 'null', improvements: '', rating: 7,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('trade_reviews').select('*').eq('trade_id', trade.id).maybeSingle();
    if (data) {
      setReview(data as TradeReview);
      setForm({
        why_taken: data.why_taken || '',
        followed_setup: data.followed_setup === null ? 'null' : String(data.followed_setup),
        respected_risk: data.respected_risk === null ? 'null' : String(data.respected_risk),
        entered_early: data.entered_early === null ? 'null' : String(data.entered_early),
        exited_early: data.exited_early === null ? 'null' : String(data.exited_early),
        improvements: data.improvements || '',
        rating: data.rating || 7,
      });
    }
  }, [trade.id]);

  useEffect(() => { load(); }, [load]);

  const update = (key: string, value: any) => { setForm((p) => ({ ...p, [key]: value })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    const payload = {
      trade_id: trade.id,
      why_taken: form.why_taken || null,
      followed_setup: form.followed_setup === 'null' ? null : form.followed_setup === 'true',
      respected_risk: form.respected_risk === 'null' ? null : form.respected_risk === 'true',
      entered_early: form.entered_early === 'null' ? null : form.entered_early === 'true',
      exited_early: form.exited_early === 'null' ? null : form.exited_early === 'true',
      improvements: form.improvements || null,
      rating: form.rating,
    };
    if (review) {
      await supabase.from('trade_reviews').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', review.id);
    } else {
      const { data } = await supabase.from('trade_reviews').insert(payload).select().maybeSingle();
      if (data) setReview(data as TradeReview);
    }
    setSaving(false); setSaved(true);
    onSaved?.();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Trade Review — {trade.instrument}</CardTitle>
        </div>
        <Button size="sm" onClick={save} disabled={saving}>
          <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Why did I take this trade?</Label>
          <Textarea value={form.why_taken} onChange={(e) => update('why_taken', e.target.value)} placeholder="Explain your reasoning…" className="min-h-[80px]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <YesNoField label="Followed setup?" value={form.followed_setup} onChange={(v) => update('followed_setup', v)} />
          <YesNoField label="Respected risk?" value={form.respected_risk} onChange={(v) => update('respected_risk', v)} />
          <YesNoField label="Entered too early?" value={form.entered_early} onChange={(v) => update('entered_early', v)} />
          <YesNoField label="Exited too early?" value={form.exited_early} onChange={(v) => update('exited_early', v)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">What could be improved?</Label>
          <Textarea value={form.improvements} onChange={(e) => update('improvements', e.target.value)} placeholder="Areas for improvement…" className="min-h-[60px]" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5"><Star className="w-3 h-3" /> Final Rating (1-10)</Label>
          <div className="flex items-center gap-2">
            <input type="range" min={1} max={10} value={form.rating} onChange={(e) => update('rating', parseInt(e.target.value))} className="flex-1 accent-primary" />
            <span className="text-lg font-bold w-8 text-right">{form.rating}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function YesNoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="null">—</SelectItem>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
