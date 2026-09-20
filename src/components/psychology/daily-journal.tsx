'use client';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Save, Moon, Zap, Heart, Target, Brain, Smile, Frown, TrendingUp } from 'lucide-react';
import type { DailyJournal } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

const EMPTY_FORM = {
  sleep_quality: 7, energy_level: 7, emotional_state_pre: '', confidence_pre: 7, stress_level: 3,
  trading_plan: '', market_bias: '', goals_today: '',
  overall_mood: '', biggest_mistake: '', biggest_success: '', lessons_learned: '',
  improvements: '', followed_plan: 'null' as string, overall_satisfaction: 7, notes: '',
};

export function DailyJournal() {
  const { workspace, activeAccount } = useWorkspace();
  const [journals, setJournals] = useState<DailyJournal[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspace || !activeAccount) return;
    const { data } = await supabase.from('daily_journals').select('*').eq('workspace_id', workspace.id).order('journal_date', { ascending: false }).limit(30);
    setJournals((data || []) as DailyJournal[]);
    setLoading(false);
  }, [workspace, activeAccount?.id]);

  useEffect(() => { load(); }, [load]);

  const update = (key: string, value: any) => { setForm((p) => ({ ...p, [key]: value })); setSaved(false); };

  const save = async () => {
    if (!workspace) return;
    setSaving(true);
    const payload = {
      ...form,
      followed_plan: form.followed_plan === 'null' ? null : form.followed_plan === 'true',
      workspace_id: workspace.id,
      user_id: workspace.user_id,
      account_id: activeAccount.id,
    };
    if (editingId) {
      await supabase.from('daily_journals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
    } else {
      const { data } = await supabase.from('daily_journals').insert(payload).select().maybeSingle();
      if (data) setEditingId(data.id);
    }
    setSaving(false); setSaved(true);
    load();
  };

  const newJournal = () => { setForm(EMPTY_FORM); setEditingId(null); setSaved(false); };
  const editJournal = (j: DailyJournal) => {
    setForm({
      sleep_quality: j.sleep_quality || 7, energy_level: j.energy_level || 7, emotional_state_pre: j.emotional_state_pre || '',
      confidence_pre: j.confidence_pre || 7, stress_level: j.stress_level || 3, trading_plan: j.trading_plan || '',
      market_bias: j.market_bias || '', goals_today: j.goals_today || '', overall_mood: j.overall_mood || '',
      biggest_mistake: j.biggest_mistake || '', biggest_success: j.biggest_success || '',
      lessons_learned: j.lessons_learned || '', improvements: j.improvements || '',
      followed_plan: j.followed_plan === null ? 'null' : String(j.followed_plan),
      overall_satisfaction: j.overall_satisfaction || 7, notes: j.notes || '',
    });
    setEditingId(j.id); setSaved(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Daily Trading Journal</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={newJournal}>New Entry</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Before Trading */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Before Trading</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SliderField label="Sleep Quality" icon={Moon} value={form.sleep_quality} onChange={(v) => update('sleep_quality', v)} />
              <SliderField label="Energy Level" icon={Zap} value={form.energy_level} onChange={(v) => update('energy_level', v)} />
              <SliderField label="Confidence" icon={Target} value={form.confidence_pre} onChange={(v) => update('confidence_pre', v)} />
              <SliderField label="Stress Level" icon={Brain} value={form.stress_level} onChange={(v) => update('stress_level', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <TextField label="Emotional State" icon={Heart} value={form.emotional_state_pre} onChange={(v) => update('emotional_state_pre', v)} placeholder="Calm, focused, anxious…" />
              <TextField label="Market Bias" value={form.market_bias} onChange={(v) => update('market_bias', v)} placeholder="Bullish, bearish, neutral…" />
              <TextField label="Goals For Today" value={form.goals_today} onChange={(v) => update('goals_today', v)} placeholder="2 quality trades, no overtrading…" />
            </div>
            <div className="mt-4">
              <Label className="text-xs">Trading Plan</Label>
              <Textarea value={form.trading_plan} onChange={(e) => update('trading_plan', e.target.value)} placeholder="Your trading plan for today…" className="mt-1 min-h-[80px]" />
            </div>
          </div>

          {/* After Trading */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5"><Smile className="w-3.5 h-3.5" /> After Trading</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField label="Overall Mood" value={form.overall_mood} onChange={(v) => update('overall_mood', v)} placeholder="Satisfied, frustrated, neutral…" />
              <div className="space-y-2">
                <Label className="text-xs">Did I Follow My Plan?</Label>
                <Select value={form.followed_plan} onValueChange={(v) => update('followed_plan', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Not yet</SelectItem>
                    <SelectItem value="true">Yes, followed plan</SelectItem>
                    <SelectItem value="false">No, deviated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextAreaField label="Biggest Mistake" icon={Frown} value={form.biggest_mistake} onChange={(v) => update('biggest_mistake', v)} placeholder="What went wrong?" />
              <TextAreaField label="Biggest Success" icon={TrendingUp} value={form.biggest_success} onChange={(v) => update('biggest_success', v)} placeholder="What went well?" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextAreaField label="Lessons Learned" value={form.lessons_learned} onChange={(v) => update('lessons_learned', v)} placeholder="Key takeaways…" />
              <TextAreaField label="Improvements" value={form.improvements} onChange={(v) => update('improvements', v)} placeholder="What to improve next time…" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <SliderField label="Overall Satisfaction" icon={Smile} value={form.overall_satisfaction} onChange={(v) => update('overall_satisfaction', v)} />
              <div className="space-y-2">
                <Label className="text-xs">Additional Notes</Label>
                <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Any other thoughts…" className="min-h-[40px]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent journals */}
      {!loading && journals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Journal Entries</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {journals.slice(0, 7).map((j) => (
                <button key={j.id} onClick={() => editJournal(j)} className={cn('w-full flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all text-left', editingId === j.id && 'border-primary/50 bg-primary/5')}>
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{formatDate(j.journal_date)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{j.emotional_state_pre || j.overall_mood || 'No mood recorded'}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{j.goals_today || j.trading_plan || 'No plan recorded'}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {j.sleep_quality != null && <span className="text-[10px] text-muted-foreground">Sleep: {j.sleep_quality}/10</span>}
                    {j.followed_plan === true && <span className="text-[10px] text-success">Followed</span>}
                    {j.followed_plan === false && <span className="text-[10px] text-destructive">Deviated</span>}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SliderField({ label, icon: Icon, value, onChange }: { label: string; icon: React.ComponentType<{ className?: string }>; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1.5"><Icon className="w-3 h-3" /> {label}</Label>
      <div className="flex items-center gap-2">
        <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="flex-1 accent-primary" />
        <span className="text-sm font-semibold w-6 text-right">{value}</span>
      </div>
    </div>
  );
}

function TextField({ label, icon: Icon, value, onChange, placeholder }: { label: string; icon?: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1.5">{Icon && <Icon className="w-3 h-3" />}{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextAreaField({ label, icon: Icon, value, onChange, placeholder }: { label: string; icon?: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1.5">{Icon && <Icon className="w-3 h-3" />}{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-[60px]" />
    </div>
  );
}
