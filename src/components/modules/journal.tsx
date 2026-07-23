'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Trash2, Edit3, X, Filter } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState, LoadingState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';
import { logger } from '@/lib/logger';

const SESSIONS = ['asia', 'london', 'new_york', 'sydney', 'other'] as const;
const DIRECTIONS = ['long', 'short'] as const;

export function Journal({ trades, onMutated }: { trades: Trade[]; onMutated: () => void }) {
  const [search, setSearch] = useState('');
  const [filterDir, setFilterDir] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      const matchSearch = !search || t.instrument.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase()) || (t.strategy_tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchDir = filterDir === 'all' || t.direction === filterDir;
      return matchSearch && matchDir;
    });
  }, [trades, search, filterDir]);

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('trades').delete().eq('id', deleting.id);
    if (error) { logger.error('Journal', 'Delete failed', { error: error.message }); return; }
    emit('trade:deleted', { id: deleting.id }, 'journal');
    setDeleting(null);
    onMutated();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by instrument, notes, or tags..." className="pl-10" />
        </div>
        <Select value={filterDir} onValueChange={setFilterDir}>
          <SelectTrigger className="w-full sm:w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Direction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="long">Long</SelectItem>
            <SelectItem value="short">Short</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Trade</Button>
      </div>

      {/* Trade list */}
      {filtered.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No trades found" description={search ? "No trades match your search. Try different keywords." : "Add your first trade to start journaling."} action={!search && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Trade</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn('grid place-items-center w-10 h-10 rounded-lg shrink-0', t.direction === 'long' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                      {t.direction === 'long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{t.instrument}</span>
                        <Badge variant="outline" className="text-[10px]">{t.direction.toUpperCase()}</Badge>
                        {t.session && <Badge variant="secondary" className="text-[10px] capitalize">{t.session}</Badge>}
                        {t.status === 'open' && <Badge variant="warning" className="text-[10px]">OPEN</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(t.executed_at)}</div>
                      {(t.strategy_tags || []).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{(t.strategy_tags || []).map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={cn('text-sm font-bold tabular-nums', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(t.pnl))}</div>
                      {Number(t.rr) > 0 && <div className="text-[10px] text-muted-foreground">RR: {Number(t.rr).toFixed(2)}</div>}
                    </div>
                    <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(t)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {(showAdd || editing) && (
        <TradeDialog
          trade={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); onMutated(); }}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Dialog open onOpenChange={() => setDeleting(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete trade?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete this {deleting.instrument} trade? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TradeDialog({ trade, onClose, onSaved }: { trade: Trade | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({
    instrument: trade?.instrument || '',
    direction: trade?.direction || 'long',
    entry_price: trade?.entry_price?.toString() || '',
    exit_price: trade?.exit_price?.toString() || '',
    quantity: trade?.quantity?.toString() || '1',
    stop_loss: trade?.stop_loss?.toString() || '',
    take_profit: trade?.take_profit?.toString() || '',
    pnl: trade?.pnl?.toString() || '0',
    rr: trade?.rr?.toString() || '0',
    status: trade?.status || 'closed',
    session: trade?.session || 'london',
    strategy_tags: (trade?.strategy_tags || []).join(', '),
    notes: trade?.notes || '',
    confidence: trade?.confidence?.toString() || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const data = {
      instrument: form.instrument.toUpperCase(),
      direction: form.direction as 'long' | 'short',
      entry_price: parseFloat(form.entry_price),
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      quantity: parseFloat(form.quantity) || 1,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      pnl: parseFloat(form.pnl) || 0,
      rr: parseFloat(form.rr) || 0,
      status: form.status as 'open' | 'closed' | 'pending',
      session: form.session as 'asia' | 'london' | 'new_york' | 'sydney' | 'other',
      strategy_tags: form.strategy_tags.split(',').map((s) => s.trim()).filter(Boolean),
      notes: form.notes || null,
      confidence: form.confidence ? parseInt(form.confidence) : null,
    };
    try {
      if (trade) {
        const { error } = await supabase.from('trades').update(data).eq('id', trade.id);
        if (error) throw error;
        emit('trade:updated', { id: trade.id, ...data }, 'journal');
      } else {
        const { error } = await supabase.from('trades').insert(data);
        if (error) throw error;
        emit('trade:created', data, 'journal');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trade');
      logger.error('Journal', 'Save failed', { error: err });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle>{trade ? 'Edit Trade' : 'Add Trade'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Instrument</Label><Input value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} placeholder="EURUSD" /></div>
          <div className="space-y-2"><Label>Direction</Label><Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Entry Price</Label><Input type="number" step="any" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} placeholder="1.0850" /></div>
          <div className="space-y-2"><Label>Exit Price</Label><Input type="number" step="any" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} placeholder="1.0900" /></div>
          <div className="space-y-2"><Label>Quantity</Label><Input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="1" /></div>
          <div className="space-y-2"><Label>Stop Loss</Label><Input type="number" step="any" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} placeholder="1.0800" /></div>
          <div className="space-y-2"><Label>Take Profit</Label><Input type="number" step="any" value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: e.target.value })} placeholder="1.1000" /></div>
          <div className="space-y-2"><Label>P&L</Label><Input type="number" step="any" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} placeholder="500" /></div>
          <div className="space-y-2"><Label>R:R Ratio</Label><Input type="number" step="any" value={form.rr} onChange={(e) => setForm({ ...form, rr: e.target.value })} placeholder="2" /></div>
          <div className="space-y-2"><Label>Confidence (0-100)</Label><Input type="number" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} placeholder="75" /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Session</Label><Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2 space-y-2"><Label>Strategy Tags (comma-separated)</Label><Input value={form.strategy_tags} onChange={(e) => setForm({ ...form, strategy_tags: e.target.value })} placeholder="ICT, breakout, scalping" /></div>
          <div className="col-span-2 space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Trade rationale..." /></div>
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Save Trade'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
