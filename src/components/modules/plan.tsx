'use client';
import { useState, useEffect } from 'react';
import { Target, Plus, Check, Trash2 } from 'lucide-react';
import type { TradingGoal } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';

export function Plan() {
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', goal_type: 'profit', target_value: '1000', period: 'monthly' });

  const load = async () => {
    setError(false);
    const { data, error } = await supabase.from('trading_goals').select('*').order('created_at', { ascending: false });
    if (error) { setError(true); setLoading(false); return; }
    setGoals((data || []) as TradingGoal[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addGoal = async () => {
    const { error } = await supabase.from('trading_goals').insert({
      title: form.title, goal_type: form.goal_type as any,
      target_value: parseFloat(form.target_value), current_value: 0,
      period: form.period as any, completed: false,
    });
    if (error) return;
    emit('goal:created', form, 'plan');
    setShowAdd(false);
    const { data } = await supabase.from('trading_goals').select('*').order('created_at', { ascending: false });
    setGoals((data || []) as TradingGoal[]);
    setForm({ title: '', goal_type: 'profit', target_value: '1000', period: 'monthly' });
  };

  const toggleGoal = async (g: TradingGoal) => {
    const completed = !g.completed;
    await supabase.from('trading_goals').update({ completed }).eq('id', g.id);
    if (completed) emit('goal:completed', g, 'plan');
    setGoals((prev) => prev.map((x) => x.id === g.id ? { ...x, completed } : x));
  };

  const deleteGoal = async (g: TradingGoal) => {
    await supabase.from('trading_goals').delete().eq('id', g.id);
    setGoals((prev) => prev.filter((x) => x.id !== g.id));
  };

  if (loading) return <div className="grid place-items-center h-64"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="grid place-items-center h-64 text-center"><div className="space-y-3"><p className="text-sm text-muted-foreground">Failed to load goals.</p><Button onClick={load} variant="outline" size="sm">Retry</Button></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><div><h2 className="text-lg font-semibold">Trading Goals</h2><p className="text-sm text-muted-foreground">Define your rules, follow your plan</p></div></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Goal</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set trading goals to track your progress and stay disciplined." action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Goal</Button>} />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const progress = g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0;
            return (
              <Card key={g.id} className={cn('transition-all', g.completed && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button onClick={() => toggleGoal(g)} className={cn('grid place-items-center w-6 h-6 rounded-full border-2 shrink-0 transition-colors', g.completed ? 'bg-success border-success text-success-foreground' : 'border-border hover:border-primary')}>
                        {g.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <div className={cn('text-sm font-medium', g.completed && 'line-through')}>{g.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{g.goal_type.replace('_', ' ')} · {g.period || 'no period'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right"><div className="text-sm font-semibold">{progress.toFixed(0)}%</div><div className="text-[10px] text-muted-foreground">{g.current_value} / {g.target_value}</div></div>
                      <button onClick={() => deleteGoal(g)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden"><div className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${progress}%` }} /></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Dialog open onOpenChange={() => setShowAdd(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Goal Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Make $1000 this month" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label><Select value={form.goal_type} onValueChange={(v) => setForm({ ...form, goal_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="profit">Profit</SelectItem><SelectItem value="win_rate">Win Rate</SelectItem><SelectItem value="trades">Number of Trades</SelectItem><SelectItem value="rr">Risk:Reward</SelectItem><SelectItem value="discipline">Discipline</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Target Value</Label><Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Period</Label><Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addGoal}>Add Goal</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
