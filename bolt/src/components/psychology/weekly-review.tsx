'use client';
import { useState, useEffect, useCallback } from 'react';
import { CalendarRange, Save, Sparkles } from 'lucide-react';
import type { Trade, WeeklyReview } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

export function WeeklyReviewEditor({ trades }: { trades: Trade[] }) {
  const { workspace } = useWorkspace();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekRange = getWeekRange(new Date());
  const [form, setForm] = useState({
    week_start: weekRange.start, week_end: weekRange.end,
    trades_taken: 0, win_rate: 0, biggest_win: '', biggest_loss: '',
    best_decision: '', worst_decision: '', psychology_notes: '',
    lessons_learned: '', goals_next_week: '', notes: '',
  });

  const load = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase.from('weekly_reviews').select('*').eq('workspace_id', workspace.id).order('week_start', { ascending: false }).limit(12);
    setReviews((data || []) as WeeklyReview[]);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const generate = () => {
    const weekTrades = trades.filter((t) => {
      const d = new Date(t.closed_at || t.executed_at);
      return d >= new Date(form.week_start) && d <= new Date(form.week_end + 'T23:59:59');
    });
    const closed = weekTrades.filter((t) => t.status === 'closed');
    const wins = closed.filter((t) => Number(t.pnl) > 0);
    const losses = closed.filter((t) => Number(t.pnl) < 0);
    const biggestWin = wins.length > 0 ? wins.reduce((max, t) => Number(t.pnl) > Number(max.pnl) ? t : max) : null;
    const biggestLoss = losses.length > 0 ? losses.reduce((min, t) => Number(t.pnl) < Number(min.pnl) ? t : min) : null;

    setForm((p) => ({
      ...p,
      trades_taken: closed.length,
      win_rate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
      biggest_win: biggestWin ? `${biggestWin.instrument} (+${formatCurrency(Number(biggestWin.pnl))})` : '',
      biggest_loss: biggestLoss ? `${biggestLoss.instrument} (${formatCurrency(Number(biggestLoss.pnl))})` : '',
    }));
  };

  const update = (key: string, value: any) => { setForm((p) => ({ ...p, [key]: value })); setSaved(false); };

  const save = async () => {
    if (!workspace) return;
    setSaving(true);
    const payload = { ...form, workspace_id: workspace.id, user_id: workspace.user_id };
    if (editingId) {
      await supabase.from('weekly_reviews').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
    } else {
      const { data } = await supabase.from('weekly_reviews').insert(payload).select().maybeSingle();
      if (data) setEditingId(data.id);
    }
    setSaving(false); setSaved(true); load();
  };

  const newReview = () => {
    setForm({ week_start: weekRange.start, week_end: weekRange.end, trades_taken: 0, win_rate: 0, biggest_win: '', biggest_loss: '', best_decision: '', worst_decision: '', psychology_notes: '', lessons_learned: '', goals_next_week: '', notes: '' });
    setEditingId(null); setSaved(false);
  };

  const editReview = (r: WeeklyReview) => {
    setForm({
      week_start: r.week_start, week_end: r.week_end, trades_taken: r.trades_taken, win_rate: Number(r.win_rate),
      biggest_win: r.biggest_win || '', biggest_loss: r.biggest_loss || '', best_decision: r.best_decision || '',
      worst_decision: r.worst_decision || '', psychology_notes: r.psychology_notes || '',
      lessons_learned: r.lessons_learned || '', goals_next_week: r.goals_next_week || '', notes: r.notes || '',
    });
    setEditingId(r.id); setSaved(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Weekly Review</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={newReview}>New</Button>
          <Button variant="outline" size="sm" onClick={generate}><Sparkles className="w-3 h-3 mr-1" /> Auto-Generate</Button>
          <Button size="sm" onClick={save} disabled={saving}><Save className="w-3 h-3 mr-1" /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs">Week Start</Label><Input type="date" value={form.week_start} onChange={(e) => update('week_start', e.target.value)} /></div>
          <div className="space-y-2"><Label className="text-xs">Week End</Label><Input type="date" value={form.week_end} onChange={(e) => update('week_end', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs">Trades Taken</Label><Input type="number" value={form.trades_taken} onChange={(e) => update('trades_taken', parseInt(e.target.value) || 0)} /></div>
          <div className="space-y-2"><Label className="text-xs">Win Rate (%)</Label><Input type="number" value={form.win_rate} onChange={(e) => update('win_rate', parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Biggest Win" value={form.biggest_win} onChange={(v) => update('biggest_win', v)} />
          <ReviewField label="Biggest Loss" value={form.biggest_loss} onChange={(v) => update('biggest_loss', v)} />
          <ReviewField label="Best Decision" value={form.best_decision} onChange={(v) => update('best_decision', v)} />
          <ReviewField label="Worst Decision" value={form.worst_decision} onChange={(v) => update('worst_decision', v)} />
        </div>
        <ReviewField label="Psychology Notes" value={form.psychology_notes} onChange={(v) => update('psychology_notes', v)} textarea />
        <ReviewField label="Lessons Learned" value={form.lessons_learned} onChange={(v) => update('lessons_learned', v)} textarea />
        <ReviewField label="Goals For Next Week" value={form.goals_next_week} onChange={(v) => update('goals_next_week', v)} textarea />
        <ReviewField label="Additional Notes" value={form.notes} onChange={(v) => update('notes', v)} textarea />
      </CardContent>

      {!loading && reviews.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Reviews</h4>
          <div className="space-y-1">
            {reviews.slice(0, 6).map((r) => (
              <button key={r.id} onClick={() => editReview(r)} className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all text-left text-xs">
                <span className="text-muted-foreground">{r.week_start} → {r.week_end}</span>
                <span className="font-medium">{r.trades_taken} trades</span>
                <span className="text-muted-foreground">{Number(r.win_rate).toFixed(0)}% win</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function ReviewField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {textarea ? <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[60px]" /> : <Input value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function getWeekRange(d: Date): { start: string; end: string } {
  const date = new Date(d);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
}
