'use client';
import { useState, useMemo, useEffect } from 'react';
import { Layers, Plus, Search, Archive, ArchiveRestore, Star, Edit3, MoreVertical, Wallet, Check } from 'lucide-react';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState, LoadingState, ErrorState } from '@/components/feedback/state';
import { formatCurrency, formatDate } from '@/lib/format';
import { COMMON_TIMEZONES } from '@/components/timezone-provider';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/event-bus';
import type { TradingAccount, TradingAccountPlatform, TradingAccountType, TradingAccountStatus } from '@/lib/supabase';

const PLATFORMS: TradingAccountPlatform[] = ['MT4', 'MT5', 'cTrader', 'DXtrade', 'Match-Trader', 'TradingView', 'Manual'];
const ACCOUNT_TYPES: { value: TradingAccountType; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'demo', label: 'Demo' },
  { value: 'prop_funded', label: 'Prop Funded' },
  { value: 'evaluation', label: 'Evaluation' },
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
const STATUS_COLORS: Record<TradingAccountStatus, 'success' | 'secondary' | 'destructive'> = {
  active: 'success', archived: 'secondary', closed: 'destructive',
};
const TYPE_COLORS: Record<TradingAccountType, 'success' | 'warning' | 'secondary' | 'default'> = {
  live: 'success', demo: 'secondary', prop_funded: 'warning', evaluation: 'default',
};

type SortKey = 'name' | 'created' | 'balance';
type StatusFilter = 'all' | 'active' | 'archived';

export function Accounts() {
  const { accounts, activeAccount, loading, error, setActiveAccountId, createAccount, updateAccount, archiveAccount, restoreAccount, setDefaultAccount, refreshAccounts } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('created');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TradingAccount | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { refreshAccounts(); }, [refreshAccounts]);

  const filtered = useMemo(() => {
    let result = accounts;
    if (statusFilter === 'active') result = result.filter((a) => a.status === 'active');
    else if (statusFilter === 'archived') result = result.filter((a) => a.status === 'archived');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.account_name.toLowerCase().includes(q) ||
        (a.broker_name || '').toLowerCase().includes(q) ||
        a.platform.toLowerCase().includes(q) ||
        (a.account_number || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...result];
    if (sortBy === 'name') sorted.sort((a, b) => a.account_name.localeCompare(b.account_name));
    else if (sortBy === 'balance') sorted.sort((a, b) => Number(b.current_balance) - Number(a.current_balance));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [accounts, search, statusFilter, sortBy]);

  if (loading) return <LoadingState label="Loading your trading accounts..." />;
  if (error) return <ErrorState description={error} onRetry={refreshAccounts} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Trading Accounts</h2>
            <p className="text-sm text-muted-foreground">Manage your trading accounts across brokers, prop firms, and exchanges</p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Account</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="balance">Balance (High-Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={accounts.length === 0 ? "No trading accounts yet" : "No accounts match your filters"}
          description={accounts.length === 0 ? "Add your first trading account to get started — live, demo, prop firm, or evaluation." : "Try adjusting your search or filter."}
          action={accounts.length === 0 ? <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Account</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((acct) => (
            <AccountCard
              key={acct.id}
              account={acct}
              isActive={activeAccount?.id === acct.id}
              onSelect={() => acct.status === 'active' && setActiveAccountId(acct.id)}
              onEdit={() => setEditing(acct)}
              onArchive={() => archiveAccount(acct.id)}
              onRestore={() => restoreAccount(acct.id)}
              onSetDefault={() => setDefaultAccount(acct.id)}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AccountFormDialog
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            const result = await createAccount(data);
            if (!result.error) { setShowAdd(false); emit('account:connected', data, 'accounts'); }
            return result;
          }}
        />
      )}

      {editing && (
        <AccountFormDialog
          account={editing}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            const result = await updateAccount(editing.id, data);
            if (!result.error) setEditing(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function AccountCard({ account, isActive, onSelect, onEdit, onArchive, onRestore, onSetDefault, menuOpen, setMenuOpen }: {
  account: TradingAccount;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onSetDefault: () => void;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
}) {
  return (
    <Card className={cn('relative transition-all', isActive && 'border-primary ring-1 ring-primary/30', account.status !== 'active' && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <button onClick={onSelect} className="flex items-center gap-3 text-left flex-1 min-w-0 disabled:cursor-default" disabled={account.status !== 'active'}>
            <div className={cn('grid place-items-center w-10 h-10 rounded-lg shrink-0', isActive ? 'bg-primary/15' : 'bg-secondary/60')}>
              <Wallet className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                {account.account_name}
                {account.is_default && <Star className="w-3 h-3 text-warning fill-warning shrink-0" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">{account.platform}{account.broker_name ? ` · ${account.broker_name}` : ''}</div>
            </div>
          </button>
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(menuOpen === account.id ? null : account.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen === account.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                <div className="absolute right-0 top-full mt-1 w-44 glass-strong rounded-lg border border-border shadow-xl z-50 py-1 animate-fade-in">
                  <button onClick={() => { onEdit(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-left">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Account
                  </button>
                  {account.status === 'active' && !account.is_default && (
                    <button onClick={() => { onSetDefault(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-left">
                      <Star className="w-3.5 h-3.5" /> Set as Default
                    </button>
                  )}
                  {account.status === 'active' ? (
                    <button onClick={() => { onArchive(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-left text-warning">
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  ) : account.status === 'archived' ? (
                    <button onClick={() => { onRestore(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/60 transition-colors text-left text-success">
                      <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={TYPE_COLORS[account.account_type]} className="text-[10px] uppercase">{ACCOUNT_TYPES.find((t) => t.value === account.account_type)?.label}</Badge>
          <Badge variant={STATUS_COLORS[account.status]} className="text-[10px] uppercase">{account.status}</Badge>
          {isActive && <Badge variant="default" className="text-[10px] uppercase">Active</Badge>}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Balance</span>
            <div className="font-semibold tabular-nums">{formatCurrency(Number(account.current_balance), account.base_currency)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Initial</span>
            <div className="font-semibold tabular-nums">{formatCurrency(Number(account.initial_balance), account.base_currency)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Currency</span>
            <div className="font-semibold">{account.base_currency}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Created</span>
            <div className="font-semibold">{formatDate(account.created_at)}</div>
          </div>
        </div>

        {account.account_number && (
          <div className="mt-2 text-xs text-muted-foreground">Account #: {account.account_number}</div>
        )}
      </CardContent>
    </Card>
  );
}

type FormData = {
  account_name: string;
  broker_name: string;
  platform: TradingAccountPlatform;
  account_number: string;
  account_type: TradingAccountType;
  base_currency: string;
  timezone: string;
  initial_balance: number;
  notes: string;
  status: TradingAccountStatus;
};

function AccountFormDialog({ account, onClose, onSave }: {
  account?: TradingAccount;
  onClose: () => void;
  onSave: (data: Partial<TradingAccount>) => Promise<{ error: string | null }>;
}) {
  const [form, setForm] = useState<FormData>({
    account_name: account?.account_name || '',
    broker_name: account?.broker_name || '',
    platform: account?.platform || 'MT5',
    account_number: account?.account_number || '',
    account_type: account?.account_type || 'live',
    base_currency: account?.base_currency || 'USD',
    timezone: account?.timezone || 'auto',
    initial_balance: account ? Number(account.initial_balance) : 0,
    notes: account?.notes || '',
    status: account?.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!form.account_name.trim()) { setError('Account name is required.'); return; }
    setSaving(true);
    const result = await onSave({
      account_name: form.account_name.trim(),
      broker_name: form.broker_name.trim() || null,
      platform: form.platform,
      account_number: form.account_number.trim() || null,
      account_type: form.account_type,
      base_currency: form.base_currency,
      timezone: form.timezone,
      initial_balance: Number(form.initial_balance) || 0,
      notes: form.notes.trim() || null,
      status: form.status,
    });
    setSaving(false);
    if (result.error) setError(result.error);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Trading Account' : 'Add Trading Account'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acct_name">Account Name *</Label>
            <Input id="acct_name" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="My MT5 Live" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform *</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as TradingAccountPlatform })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v as TradingAccountType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Broker / Prop Firm</Label>
              <Input value={form.broker_name} onChange={(e) => setForm({ ...form, broker_name: e.target.value })} placeholder="IC Markets" />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="12345678" />
            </div>
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <Select value={form.base_currency} onValueChange={(v) => setForm({ ...form, base_currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">{COMMON_TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Balance</Label>
              <Input type="number" value={form.initial_balance} onChange={(e) => setForm({ ...form, initial_balance: Number(e.target.value) })} placeholder="10000" />
            </div>
            {account && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TradingAccountStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes about this account" />
          </div>
          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : account ? 'Save Changes' : 'Create Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
