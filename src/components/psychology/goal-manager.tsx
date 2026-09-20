'use client';
import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import type { TradingGoal } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

const GOAL_CATEGORIES = [
  { value: 'trading', label: 'Trading Goals' },
  { value: 'risk', label: 'Risk Goals' },
  { value: 'psychology', label: 'Psychology Goals' },
  { value: 'consistency', label: 'Consistency Goals' },
  { value: 'learning', label: 'Learning Goals' },
  { value: 'habit', label: 'Habit Goals' },
  { value: 'profit', label: 'Profit Goals' },
  { value: 'win_rate', label: 'Win Rate Goals' },
  { value: 'custom', label: 'Custom Goals' },
];

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export function GoalManager() {
  const { workspace, activeAccount } = useWorkspace();
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', goal_type: 'trading', target_value: '1000', period: 'monthly', deadline: '', priority: 'medium', notes: '' });

  const load = useCallback(async () => {
    if (!workspace) return;
    if (!activeAccount) { setGoals([]); setLoading(false); return; }
    const { data } = await supabase.from('trading_goals').select('*').eq('workspace_id', workspace.id).eq('account_id', activeAccount.id).order('created_at', { ascending: false });
    setGoals((data || []) as TradingGoal[]);
    setLoading(false);
  }, [workspace, activeAccount?.id]);

  useEffect(() => { load(); }, [load]);

  const addGoal = async () => {
    if (!workspace || !activeAccount || !form.title.trim()) return;
    await supabase.from('trading_goals').insert({
      user_id: activeAccount.user_id, workspace_id: workspace.id, account_id: activeAccount.id,
      title: form.title, goal_type: form.goal_type as any,
      target_value: parseFloat(form.target_value) || 0, current_value: 0,
      period: form.period as any, completed: false,
      deadline: form.deadline || null, notes: form.notes || null,
    } as any);
    setShowAdd(false);
    setForm({ title: '', goal_type: 'trading', target_value: '1000', period: 'monthly', deadline: '', priority: 'medium', notes: '' });
    load();
  };

  const updateProgress = async (g: TradingGoal, newVal: number) => {
    await supabase.from('trading_goals').update({ current_value: newVal, completed: newVal >= g.target_value }).eq('id', g.id);
    setGoals((prev) => prev.map((x) => x.id === g.id ? { ...x, current_value: newVal, completed: newVal >= g.target_value } : x));
  };

  const toggleGoal = async (g: TradingGoal) => {
    const completed = !g.completed;
    await supabase.from('trading_goals').update({ completed }).eq('id', g.id);
    setGoals((prev) => prev.map((x) => x.id === g.id ? { ...x, completed } : x));
  };

  const deleteGoal = async (g: TradingGoal) => {
    await supabase.from('trading_goals').delete().eq('id', g.id);
    setGoals((prev) => prev.filter((x) => x.id !== g.id));
  };

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.goal_type === filter);

  if (loading) return <div className="grid place-items-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Goals</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {GOAL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Add Goal</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set goals to track your progress and stay disciplined." action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Add Goal</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => {
            const progress = g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0;
            return (
              <Card key={g.id} className={cn('transition-all', g.completed && 'opacity-60')}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button onClick={() => toggleGoal(g)} className={cn('grid place-items-center w-5 h-5 rounded-full border-2 shrink-0 transition-colors', g.completed ? 'bg-success border-success' : 'border-border hover:border-primary')}>
                        {g.completed && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
                      </button>
                      <div className="min-w-0">
                        <div className={cn('text-sm font-medium truncate', g.completed && 'line-through')}>{g.title}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="capitalize">{g.goal_type.replace('_', ' ')}</span>
                          <span>·</span>
                          <span className="capitalize">{g.period || 'no period'}</span>
                          {(g as any).deadline && (<><span>·</span><span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {formatDate((g as any).deadline)}</span></>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold">{progress.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground">{g.current_value} / {g.target_value}</div>
                      </div>
                      <button onClick={() => deleteGoal(g)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${progress}%` }} />
                  </div>
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
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.goal_type} onValueChange={(v) => setForm({ ...form, goal_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    {GOAL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Target Value</Label><Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Period</Label>
                  <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addGoal}>Add Goal</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
