'use client';
import { useState, useEffect, useCallback } from 'react';
import { Repeat, Plus, Trash2, Check } from 'lucide-react';
import type { Habit, HabitLog } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { DEFAULT_HABITS } from '@/lib/psychology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

export function HabitTracker() {
  const { workspace } = useWorkspace();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    if (!workspace) return;
    const [hRes, lRes] = await Promise.all([
      supabase.from('habits').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').gte('log_date', last7Days()[0]).order('log_date', { ascending: false }),
    ]);
    setHabits((hRes.data || []) as Habit[]);
    setLogs((lRes.data || []) as HabitLog[]);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const addHabit = async () => {
    if (!workspace || !newName.trim()) return;
    const { data } = await supabase.from('habits').insert({ name: newName.trim(), workspace_id: workspace.id, user_id: workspace.user_id }).select().maybeSingle();
    if (data) setHabits((prev) => [...prev, data as Habit]);
    setNewName('');
  };

  const seedDefaults = async () => {
    if (!workspace) return;
    for (const name of DEFAULT_HABITS) {
      await supabase.from('habits').insert({ name, workspace_id: workspace.id, user_id: workspace.user_id });
    }
    load();
  };

  const deleteHabit = async (h: Habit) => {
    await supabase.from('habits').delete().eq('id', h.id);
    setHabits((prev) => prev.filter((x) => x.id !== h.id));
  };

  const toggleLog = async (habit: Habit, date: string) => {
    const existing = logs.find((l) => l.habit_id === habit.id && l.log_date === date);
    if (existing) {
      const completed = !existing.completed;
      await supabase.from('habit_logs').update({ completed }).eq('id', existing.id);
      setLogs((prev) => prev.map((l) => l.id === existing.id ? { ...l, completed } : l));
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habit.id, log_date: date, completed: true, user_id: workspace?.user_id }).select().maybeSingle();
      if (data) setLogs((prev) => [data as HabitLog, ...prev]);
    }
  };

  const days = last7Days();

  if (loading) return <div className="grid place-items-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Habit Tracker</CardTitle>
        </div>
        {habits.length === 0 && <Button size="sm" variant="ghost" onClick={seedDefaults}>Seed Default Habits</Button>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add a new habit…" className="h-8 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') addHabit(); }} />
          <Button size="sm" variant="outline" onClick={addHabit}><Plus className="w-3 h-3" /></Button>
        </div>

        {habits.length === 0 ? (
          <EmptyState icon={Repeat} title="No habits yet" description="Create recurring habits to track your daily routine." />
        ) : (
          <div className="space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 text-[10px] text-muted-foreground uppercase">Habit</div>
              {days.map((d) => (
                <div key={d} className="w-8 text-center text-[10px] text-muted-foreground">
                  {new Date(d).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                </div>
              ))}
              <div className="w-8" />
            </div>
            {habits.map((h) => {
              const weekLogs = logs.filter((l) => l.habit_id === h.id);
              const completedCount = weekLogs.filter((l) => l.completed).length;
              return (
                <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{h.name}</div>
                    <div className="text-[10px] text-muted-foreground">{completedCount}/{days.length} this week</div>
                  </div>
                  {days.map((d) => {
                    const log = weekLogs.find((l) => l.log_date === d);
                    const isToday = d === formatDate(new Date().toISOString());
                    return (
                      <button key={d} onClick={() => toggleLog(h, d)} className={cn(
                        'grid place-items-center w-8 h-8 rounded-lg border transition-all',
                        log?.completed ? 'bg-success border-success text-success-foreground' : 'border-border hover:border-primary/40',
                        isToday && !log?.completed && 'border-primary/40'
                      )}>
                        {log?.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                  <button onClick={() => deleteHabit(h)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}
