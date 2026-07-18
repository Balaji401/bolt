'use client';

import { useEffect, useState } from 'react';
import {
  Plug,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  Link2,
  Zap,
} from 'lucide-react';
import { supabase, type BrokerConnection } from '@/lib/supabase';
import { fmtCurrency, fmtDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const BROKERS = [
  { name: 'MetaTrader 4', logo: 'MT4', color: 'from-blue-500 to-blue-700' },
  { name: 'MetaTrader 5', logo: 'MT5', color: 'from-blue-600 to-indigo-700' },
  { name: 'cTrader', logo: 'cT', color: 'from-emerald-500 to-teal-700' },
  { name: 'DXtrade', logo: 'DX', color: 'from-orange-500 to-red-600' },
  { name: 'MatchTrader', logo: 'MT', color: 'from-purple-500 to-pink-600' },
  { name: 'TradingView', logo: 'TV', color: 'from-sky-500 to-blue-700' },
  { name: 'Interactive Brokers', logo: 'IB', color: 'from-red-500 to-rose-700' },
  { name: 'OANDA', logo: 'OA', color: 'from-amber-500 to-orange-700' },
  { name: 'Binance', logo: 'BN', color: 'from-yellow-400 to-amber-600' },
  { name: 'Bybit', logo: 'BB', color: 'from-orange-400 to-amber-600' },
];

const statusMeta: Record<BrokerConnection['status'], { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  connected: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/15', label: 'Connected' },
  syncing: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/15', label: 'Syncing' },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/15', label: 'Error' },
  disconnected: { icon: Power, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Disconnected' },
};

export function Brokers() {
  const [conns, setConns] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('broker_connections').select('*').order('created_at', { ascending: false });
    setConns((data || []) as BrokerConnection[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalEquity = conns.reduce((s, c) => s + Number(c.equity || 0), 0);
  const connectedCount = conns.filter((c) => c.status === 'connected').length;
  const syncingCount = conns.filter((c) => c.status === 'syncing').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden glass rounded-2xl p-6">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            <Plug className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Automatic Broker Synchronization</div>
            <h2 className="text-xl font-semibold">Connect your trading accounts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Trades sync automatically. Your journal, analytics, and reports update themselves — no manual work.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Connect Broker
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Total Equity" value={fmtCurrency(totalEquity)} icon={Zap} tone="primary" />
        <StatTile label="Connected" value={`${connectedCount} accounts`} icon={CheckCircle2} tone="success" />
        <StatTile label="Syncing" value={`${syncingCount} accounts`} icon={Loader2} tone="warning" />
        <StatTile label="Total Accounts" value={String(conns.length)} icon={Link2} tone="chart" />
      </div>

      {/* Connections */}
      {loading ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">Loading connections...</div>
      ) : conns.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Plug className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No brokers connected yet. Connect your first account to start auto-syncing trades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conns.map((c) => {
            const meta = statusMeta[c.status];
            const StatusIcon = meta.icon;
            const brokerMeta = BROKERS.find((b) => b.name === c.broker_name);
            return (
              <div key={c.id} className="glass rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className={cn('grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br text-white font-bold text-sm shrink-0', brokerMeta?.color || 'from-primary to-chart-4')}>
                    {brokerMeta?.logo || c.broker_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{c.broker_name}</h3>
                      <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded inline-flex items-center gap-1', meta.bg, meta.color)}>
                        <StatusIcon className={cn('w-3 h-3', c.status === 'syncing' && 'animate-spin')} />
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.account_type && <span className="capitalize">{c.account_type}</span>}
                      {c.account_id && <span> • {c.account_id}</span>}
                      {c.server && <span> • {c.server}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => syncNow(c.id, load)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary" title="Sync now">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleConnection(c, load)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title="Toggle">
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteConn(c.id, load)} className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive" title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Mini label="Balance" value={fmtCurrency(Number(c.balance))} />
                  <Mini label="Equity" value={fmtCurrency(Number(c.equity))} />
                  <Mini label="Leverage" value={c.leverage} />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{c.auto_sync ? 'Auto-sync enabled' : 'Auto-sync disabled'}</span>
                  <span>Last sync: {c.last_sync_at ? fmtDateTime(c.last_sync_at) : 'never'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available brokers */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-1">Supported Brokers</h3>
        <p className="text-xs text-muted-foreground mb-4">Roadmap integrations — connect any of these to enable automatic trade sync</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {BROKERS.map((b) => (
            <div key={b.name} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary/40 border border-border hover:border-primary/40 transition-colors">
              <div className={cn('grid place-items-center w-10 h-10 rounded-lg bg-gradient-to-br text-white font-bold text-xs', b.color)}>
                {b.logo}
              </div>
              <span className="text-xs font-medium text-center">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {showForm && <BrokerForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone: 'primary' | 'success' | 'warning' | 'chart' }) {
  const toneMap: Record<string, string> = { primary: 'text-primary', success: 'text-success', warning: 'text-warning', chart: 'text-chart-4' };
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className="grid place-items-center w-10 h-10 rounded-lg bg-secondary/60">
        <Icon className={cn('w-5 h-5', toneMap[tone])} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={cn('text-lg font-semibold', toneMap[tone])}>{value}</div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

async function syncNow(id: string, onDone: () => void) {
  await supabase.from('broker_connections').update({ status: 'syncing', last_sync_at: new Date().toISOString() }).eq('id', id);
  onDone();
  setTimeout(async () => {
    await supabase.from('broker_connections').update({ status: 'connected' }).eq('id', id);
    onDone();
  }, 2500);
}

async function toggleConnection(c: BrokerConnection, onDone: () => void) {
  const next = c.status === 'disconnected' ? 'connected' : 'disconnected';
  await supabase.from('broker_connections').update({ status: next }).eq('id', c.id);
  onDone();
}

async function deleteConn(id: string, onDone: () => void) {
  if (!confirm('Remove this broker connection?')) return;
  await supabase.from('broker_connections').delete().eq('id', id);
  onDone();
}

function BrokerForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    broker_name: 'MetaTrader 5',
    account_id: '',
    account_type: 'live' as 'live' | 'demo' | 'prop',
    login: '',
    server: '',
    auto_sync: true,
    currency: 'USD',
    leverage: '1:30',
    balance: '10000',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('broker_connections').insert({
      broker_name: form.broker_name,
      account_id: form.account_id || null,
      account_type: form.account_type,
      login: form.login || null,
      server: form.server || null,
      status: 'syncing',
      auto_sync: form.auto_sync,
      last_sync_at: new Date().toISOString(),
      balance: Number(form.balance) || 0,
      equity: Number(form.balance) || 0,
      currency: form.currency,
      leverage: form.leverage,
    });
    setTimeout(async () => {
      await supabase.from('broker_connections').update({ status: 'connected' }).eq('broker_name', form.broker_name);
      setSaving(false);
      onSaved();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Connect Broker</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Broker</span>
            <select value={form.broker_name} onChange={(e) => setForm({ ...form, broker_name: e.target.value })} className="input">
              {BROKERS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Account ID</span><input value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} placeholder="e.g. MT5-88421" className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Account Type</span>
              <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value as any })} className="input">
                <option value="live">Live</option>
                <option value="demo">Demo</option>
                <option value="prop">Prop Firm</option>
              </select>
            </label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Login</span><input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Server</span><input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })} placeholder="e.g. ICMarkets-Live" className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Balance ($)</span><input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="input" /></label>
            <label className="block"><span className="block text-xs font-medium text-muted-foreground mb-1.5">Leverage</span><input value={form.leverage} onChange={(e) => setForm({ ...form, leverage: e.target.value })} className="input" /></label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.auto_sync} onChange={(e) => setForm({ ...form, auto_sync: e.target.checked })} className="accent-primary w-4 h-4" />
            <span className="text-sm">Enable automatic trade synchronization</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</> : <><Link2 className="w-4 h-4" /> Connect</>}
          </button>
        </div>
      </div>
    </div>
  );
}
