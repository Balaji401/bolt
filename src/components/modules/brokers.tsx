'use client';
import { useState, useEffect } from 'react';
import { Plug, Plus, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import type { BrokerConnection, OpenPosition } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/feedback/state';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';

const BROKERS = ['MT4', 'MT5', 'cTrader', 'DXtrade', 'MatchTrader', 'Binance', 'Bybit', 'OANDA', 'IBKR'];

export function Brokers() {
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ broker_name: 'MT5', account_id: '', account_type: 'demo', login: '', server: '', currency: 'USD', leverage: '1:30' });

  useEffect(() => {
    Promise.all([
      supabase.from('broker_connections').select('*').order('created_at', { ascending: false }),
      supabase.from('open_positions').select('*').order('opened_at', { ascending: false }),
    ]).then(([c, p]) => {
      setConnections((c.data || []) as BrokerConnection[]);
      setPositions((p.data || []) as OpenPosition[]);
      setLoading(false);
    });
  }, []);

  const addConnection = async () => {
    const { error } = await supabase.from('broker_connections').insert({
      broker_name: form.broker_name, account_id: form.account_id || null, account_type: form.account_type as any,
      login: form.login || null, server: form.server || null,
      status: 'disconnected', auto_sync: true, balance: 0, equity: 0,
      currency: form.currency, leverage: form.leverage,
    });
    if (error) return;
    emit('account:connected', form, 'brokers');
    setShowAdd(false);
    const { data } = await supabase.from('broker_connections').select('*').order('created_at', { ascending: false });
    setConnections((data || []) as BrokerConnection[]);
  };

  const removeConnection = async (c: BrokerConnection) => {
    await supabase.from('broker_connections').delete().eq('id', c.id);
    emit('account:disconnected', { id: c.id }, 'brokers');
    setConnections((prev) => prev.filter((x) => x.id !== c.id));
  };

  const syncConnection = async (c: BrokerConnection) => {
    await supabase.from('broker_connections').update({ status: 'syncing' }).eq('id', c.id);
    setConnections((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'syncing' } : x));
    setTimeout(async () => {
      await supabase.from('broker_connections').update({ status: 'connected', last_sync_at: new Date().toISOString() }).eq('id', c.id);
      setConnections((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'connected', last_sync_at: new Date().toISOString() } : x));
      emit('account:synced', { brokerId: c.id, count: 0 }, 'brokers');
    }, 2000);
  };

  if (loading) return <div className="grid place-items-center h-64"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Plug className="w-5 h-5 text-primary" /><div><h2 className="text-lg font-semibold">Broker Connections</h2><p className="text-sm text-muted-foreground">Auto-sync trades from your trading accounts</p></div></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Connect Broker</Button>
      </div>

      {connections.length === 0 ? (
        <EmptyState icon={Plug} title="No brokers connected" description="Connect your trading account to auto-sync trades." action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Connect Broker</Button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {connections.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="grid place-items-center w-10 h-10 rounded-lg bg-secondary/60"><Plug className="w-5 h-5 text-muted-foreground" /></div>
                    <div><div className="text-sm font-semibold">{c.broker_name}</div><div className="text-xs text-muted-foreground">{c.account_id || c.login || 'No account ID'}</div></div>
                  </div>
                  <Badge variant={c.status === 'connected' ? 'success' : c.status === 'syncing' ? 'warning' : c.status === 'error' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">{c.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-muted-foreground">Balance:</span> <span className="font-semibold">{formatCurrency(Number(c.balance), c.currency)}</span></div>
                  <div><span className="text-muted-foreground">Equity:</span> <span className="font-semibold">{formatCurrency(Number(c.equity), c.currency)}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-semibold capitalize">{c.account_type || '—'}</span></div>
                  <div><span className="text-muted-foreground">Leverage:</span> <span className="font-semibold">{c.leverage}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => syncConnection(c)} disabled={c.status === 'syncing'}><RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', c.status === 'syncing' && 'animate-spin')} /> Sync</Button>
                  <Button variant="ghost" size="sm" onClick={() => removeConnection(c)}><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {positions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Open Positions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {positions.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3"><Badge variant={p.direction === 'long' ? 'success' : 'destructive'} className="text-[10px]">{p.direction.toUpperCase()}</Badge><span className="text-sm font-medium">{p.instrument}</span><span className="text-xs text-muted-foreground">{Number(p.volume)} lots @ {Number(p.entry_price)}</span></div>
                  <div className={cn('text-sm font-semibold tabular-nums', Number(p.floating_pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(p.floating_pnl))}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showAdd && (
        <Dialog open onOpenChange={() => setShowAdd(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect Broker</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Broker</Label><Select value={form.broker_name} onValueChange={(v) => setForm({ ...form, broker_name: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BROKERS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Account ID</Label><Input value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} placeholder="12345678" /></div>
                <div className="space-y-2"><Label>Account Type</Label><Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="live">Live</SelectItem><SelectItem value="demo">Demo</SelectItem><SelectItem value="prop">Prop</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Login</Label><Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="Login" /></div>
                <div className="space-y-2"><Label>Server</Label><Input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} placeholder="ICMarkets-Live" /></div>
                <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
                <div className="space-y-2"><Label>Leverage</Label><Input value={form.leverage} onChange={(e) => setForm({ ...form, leverage: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addConnection}>Connect</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
