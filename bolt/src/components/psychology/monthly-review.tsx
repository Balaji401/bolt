'use client';
import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Save, Sparkles } from 'lucide-react';
import type { Trade, MonthlyReview } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

export function MonthlyReviewEditor({ trades }: { trades: Trade[] }) {
  const { workspace } = useWorkspace();
  const [reviews, setReviews] = useState<MonthlyReview[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const monthYear = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const [form, setForm] = useState({
    month_year: monthYear, performance_summary: '', discipline_review: '',
    psychology_review: '', goal_progress: '', habit_completion: '',
    biggest_improvements: '', biggest_problems: '', action_plan: '', notes: '',
  });

  const load = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase.from('monthly_reviews').select('*').eq('workspace_id', workspace.id).order('month_year', { ascending: false }).limit(12);
    setReviews((data || []) as MonthlyReview[]);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const generate = () => {
    const now = new Date();
    const monthTrades = trades.filter((t) => {
      const d = new Date(t.closed_at || t.executed_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.status === 'closed';
    });
    const wins = monthTrades.filter((t) => Number(t.pnl) > 0);
    const losses = monthTrades.filter((t) => Number(t.pnl) < 0);
    const netPnl = monthTrades.reduce((s, t) => s + Number(t.pnl), 0);
    const winRate = monthTrades.length > 0 ? (wins.length / monthTrades.length) * 100 : 0;

    setForm((p) => ({
      ...p,
      performance_summary: `${monthTrades.length} trades · ${winRate.toFixed(1)}% win rate · Net ${formatCurrency(netPnl)} · ${wins.length}W / ${losses.length}L`,
      discipline_review: `${monthTrades.filter((t) => !(t.mistakes || []).length).length} of ${monthTrades.length} trades followed rules.`,
      psychology_review: monthTrades.flatMap((t) => t.emotions || []).length > 0
        ? `Most common emotions: ${topEmotions(monthTrades)}`
        : 'No emotion data recorded this month.',
    }));
  };

  const update = (key: string, value: any) => { setForm((p) => ({ ...p, [key]: value })); setSaved(false); };

  const save = async () => {
    if (!workspace) return;
    setSaving(true);
    const payload = { ...form, workspace_id: workspace.id, user_id: workspace.user_id };
    if (editingId) {
      await supabase.from('monthly_reviews').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
    } else {
      const { data } = await supabase.from('monthly_reviews').insert(payload).select().maybeSingle();
      if (data) setEditingId(data.id);
    }
    setSaving(false); setSaved(true); load();
  };

  const newReview = () => {
    setForm({ month_year: monthYear, performance_summary: '', discipline_review: '', psychology_review: '', goal_progress: '', habit_completion: '', biggest_improvements: '', biggest_problems: '', action_plan: '', notes: '' });
    setEditingId(null); setSaved(false);
  };

  const editReview = (r: MonthlyReview) => {
    setForm({
      month_year: r.month_year, performance_summary: r.performance_summary || '',
      discipline_review: r.discipline_review || '', psychology_review: r.psychology_review || '',
      goal_progress: r.goal_progress || '', habit_completion: r.habit_completion || '',
      biggest_improvements: r.biggest_improvements || '', biggest_problems: r.biggest_problems || '',
      action_plan: r.action_plan || '', notes: r.notes || '',
    });
    setEditingId(r.id); setSaved(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Monthly Review</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={newReview}>New</Button>
          <Button variant="outline" size="sm" onClick={generate}><Sparkles className="w-3 h-3 mr-1" /> Auto-Generate</Button>
          <Button size="sm" onClick={save} disabled={saving}><Save className="w-3 h-3 mr-1" /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label className="text-xs">Month</Label><Input value={form.month_year} onChange={(e) => update('month_year', e.target.value)} placeholder="September 2026" /></div>
        <ReviewField label="Performance Summary" value={form.performance_summary} onChange={(v) => update('performance_summary', v)} textarea />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Discipline Review" value={form.discipline_review} onChange={(v) => update('discipline_review', v)} textarea />
          <ReviewField label="Psychology Review" value={form.psychology_review} onChange={(v) => update('psychology_review', v)} textarea />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Goal Progress" value={form.goal_progress} onChange={(v) => update('goal_progress', v)} textarea />
          <ReviewField label="Habit Completion" value={form.habit_completion} onChange={(v) => update('habit_completion', v)} textarea />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Biggest Improvements" value={form.biggest_improvements} onChange={(v) => update('biggest_improvements', v)} textarea />
          <ReviewField label="Biggest Problems" value={form.biggest_problems} onChange={(v) => update('biggest_problems', v)} textarea />
        </div>
        <ReviewField label="Action Plan" value={form.action_plan} onChange={(v) => update('action_plan', v)} textarea />
        <ReviewField label="Additional Notes" value={form.notes} onChange={(v) => update('notes', v)} textarea />
      </CardContent>

      {!loading && reviews.length > 0 && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Reviews</h4>
          <div className="space-y-1">
            {reviews.slice(0, 6).map((r) => (
              <button key={r.id} onClick={() => editReview(r)} className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all text-left text-xs">
                <span className="font-medium">{r.month_year}</span>
                <span className="text-muted-foreground truncate">{r.performance_summary || 'No summary'}</span>
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

function topEmotions(trades: Trade[]): string {
  const freq: Record<string, number> = {};
  for (const t of trades) for (const e of t.emotions || []) freq[e] = (freq[e] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).join(', ');
}
