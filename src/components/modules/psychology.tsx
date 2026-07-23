'use client';
import { useState, useEffect } from 'react';
import { HeartPulse, Plus, Save } from 'lucide-react';
import type { PsychologyLog } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState, LoadingState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';

const METRICS = ['confidence', 'fear', 'greed', 'fomo', 'discipline', 'patience', 'execution_quality'] as const;

export function Psychology() {
  const [logs, setLogs] = useState<PsychologyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ confidence: 70, fear: 30, greed: 20, fomo: 25, discipline: 80, patience: 75, execution_quality: 70, emotional_state: '', notes: '' });

  useEffect(() => {
    supabase.from('psychology_logs').select('*').order('log_date', { ascending: false }).then(({ data }) => {
      setLogs((data || []) as PsychologyLog[]);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const { error } = await supabase.from('psychology_logs').insert({
      confidence: form.confidence, fear: form.fear, greed: form.greed, fomo: form.fomo,
      discipline: form.discipline, patience: form.patience, execution_quality: form.execution_quality,
      emotional_state: form.emotional_state || null, notes: form.notes || null, rule_violations: [],
    });
    if (error) return;
    emit('psychology:logged', form, 'psychology');
    const { data } = await supabase.from('psychology_logs').select('*').order('log_date', { ascending: false });
    setLogs((data || []) as PsychologyLog[]);
    setForm({ confidence: 70, fear: 30, greed: 20, fomo: 25, discipline: 80, patience: 75, execution_quality: 70, emotional_state: '', notes: '' });
  };

  if (loading) return <LoadingState label="Loading psychology logs..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><HeartPulse className="w-5 h-5 text-primary" /><div><h2 className="text-lg font-semibold">Trading Psychology</h2><p className="text-sm text-muted-foreground">Track and improve your mental game</p></div></div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Daily Check-in</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <div key={m} className="space-y-2">
                <Label className="capitalize">{m.replace('_', ' ')}</Label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={form[m]} onChange={(e) => setForm({ ...form, [m]: parseInt(e.target.value) })} className="flex-1 accent-primary" />
                  <span className="text-sm font-semibold w-8 text-right">{form[m]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Emotional State</Label><Input value={form.emotional_state} onChange={(e) => setForm({ ...form, emotional_state: e.target.value })} placeholder="Calm, focused, anxious..." /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What's on your mind?" /></div>
          </div>
          <Button onClick={save}><Save className="w-4 h-4 mr-2" /> Save Check-in</Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Check-ins</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                  <div className="text-xs text-muted-foreground w-20">{log.log_date}</div>
                  <div className="flex flex-wrap gap-3 flex-1">
                    {METRICS.map((m) => <div key={m} className="flex items-center gap-1 text-xs"><span className="text-muted-foreground capitalize">{m.replace('_', ' ').slice(0, 3)}</span><span className={cn('font-semibold', (log[m] || 0) >= 70 ? 'text-success' : (log[m] || 0) >= 40 ? 'text-warning' : 'text-destructive')}>{log[m]}</span></div>)}
                  </div>
                  {log.emotional_state && <span className="text-xs text-muted-foreground">{log.emotional_state}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
