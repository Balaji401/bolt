'use client';
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Trash2, Search, Filter } from 'lucide-react';
import type { Mistake } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { MISTAKE_CATEGORIES } from '@/lib/psychology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-success bg-success/10',
  medium: 'text-warning bg-warning/10',
  high: 'text-destructive bg-destructive/10',
  critical: 'text-destructive bg-destructive/20',
};

export function MistakeLibrary() {
  const { workspace } = useWorkspace();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterSev, setFilterSev] = useState('all');
  const [form, setForm] = useState({ name: '', category: 'Risk Management', description: '', severity: 'medium', solution: '' });

  const load = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase.from('mistakes').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });
    setMistakes((data || []) as Mistake[]);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const addMistake = async () => {
    if (!workspace || !form.name.trim()) return;
    await supabase.from('mistakes').insert({
      name: form.name, category: form.category, description: form.description || null,
      severity: form.severity as any, solution: form.solution || null,
      workspace_id: workspace.id, user_id: workspace.user_id,
    });
    setShowAdd(false);
    setForm({ name: '', category: 'Risk Management', description: '', severity: 'medium', solution: '' });
    load();
  };

  const deleteMistake = async (m: Mistake) => {
    await supabase.from('mistakes').delete().eq('id', m.id);
    setMistakes((prev) => prev.filter((x) => x.id !== m.id));
  };

  const incrementFreq = async (m: Mistake) => {
    await supabase.from('mistakes').update({ frequency: (m.frequency || 1) + 1 }).eq('id', m.id);
    setMistakes((prev) => prev.map((x) => x.id === m.id ? { ...x, frequency: (x.frequency || 1) + 1 } : x));
  };

  const filtered = mistakes.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || m.category === filterCat;
    const matchSev = filterSev === 'all' || m.severity === filterSev;
    return matchSearch && matchCat && matchSev;
  });

  if (loading) return <div className="grid place-items-center h-32"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Mistake Library</h3>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Add Mistake</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mistakes…" className="pl-9 h-8 text-xs" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {MISTAKE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSev} onValueChange={setFilterSev}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No mistakes found" description={mistakes.length === 0 ? "Build your mistake database to learn from past errors." : "No mistakes match your filters."} action={mistakes.length === 0 && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Add Mistake</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <Card key={m.id} className="hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', SEVERITY_COLORS[m.severity])}>{m.severity}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteMistake(m)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {m.description && <p className="text-xs text-muted-foreground mb-2">{m.description}</p>}
                {m.solution && <div className="text-xs"><span className="text-muted-foreground">Solution: </span>{m.solution}</div>}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                  <button onClick={() => incrementFreq(m)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                    Frequency: <span className="font-semibold text-foreground">{m.frequency || 1}</span> (click to +1)
                  </button>
                  {(m.related_trade_ids || []).length > 0 && <span className="text-[10px] text-muted-foreground">{m.related_trade_ids.length} linked trades</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <Dialog open onOpenChange={() => setShowAdd(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Mistake</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Mistake Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Moved stop loss…" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    {MISTAKE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened…" className="min-h-[60px]" /></div>
              <div className="space-y-2"><Label>Solution</Label><Textarea value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} placeholder="How to avoid it next time…" className="min-h-[60px]" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addMistake}>Add Mistake</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
