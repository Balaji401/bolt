'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Trash2, Edit3, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, Copy, Archive, X, ArrowUpDown } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/feedback/state';
import { TradeForm } from '@/components/journal/trade-form';
import { TradeDetail } from '@/components/journal/trade-detail';
import { cn } from '@/lib/utils';
import { emit, on } from '@/lib/event-bus';
import { logger } from '@/lib/logger';

const SESSIONS = ['asia', 'london', 'new_york', 'sydney', 'other'] as const;
const DIRECTIONS = ['long', 'short'] as const;
const STATUSES = ['open', 'closed', 'pending'] as const;
const RESULTS = ['win', 'loss', 'breakeven'] as const;
const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];
const PAGE_SIZE = 10;

type SortKey = 'executed_at' | 'instrument' | 'direction' | 'entry_price' | 'pnl' | 'rr' | 'quantity' | 'status';
type SortDir = 'asc' | 'desc';

export function Journal({ trades, onMutated }: { trades: Trade[]; onMutated: () => void }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('executed_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [viewing, setViewing] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState<Trade | null>(null);
  const [archiving, setArchiving] = useState<Trade | null>(null);

  const activeTrades = useMemo(() => trades.filter((t) => !t.archived), [trades]);

  const instruments = useMemo(() => Array.from(new Set(activeTrades.map((t) => t.instrument))).sort(), [activeTrades]);
  const strategies = useMemo(() => Array.from(new Set(activeTrades.flatMap((t) => t.strategy_tags || []))).sort(), [activeTrades]);

  const filtered = useMemo(() => {
    return activeTrades.filter((t) => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        t.instrument.toLowerCase().includes(s) ||
        (t.notes || '').toLowerCase().includes(s) ||
        t.id.toLowerCase().includes(s) ||
        (t.strategy_tags || []).some((tag) => tag.toLowerCase().includes(s)) ||
        (t.setup_type || '').toLowerCase().includes(s);
      const match = (key: string, val: string) => !filters[key] || filters[key] === 'all' || String(t[key as keyof Trade] || '') === filters[key];
      const matchResult = !filters.result || filters.result === 'all' ||
        (filters.result === 'win' && Number(t.pnl) > 0) ||
        (filters.result === 'loss' && Number(t.pnl) < 0) ||
        (filters.result === 'breakeven' && Number(t.pnl) === 0);
      const matchTag = !filters.tag || filters.tag === 'all' || (t.strategy_tags || []).includes(filters.tag);
      return matchSearch && match('direction', filters.direction || '') && match('status', filters.status || '') && match('session', filters.session || '') && match('timeframe', filters.timeframe || '') && match('instrument', filters.instrument || '') && matchResult && matchTag;
    });
  }, [activeTrades, search, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number = a[sortKey] as string | number;
      let bv: string | number = b[sortKey] as string | number;
      if (typeof av === 'number' || typeof bv === 'number') { av = Number(av) || 0; bv = Number(bv) || 0; }
      else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    const closed = activeTrades.filter((t) => t.status === 'closed');
    const wins = closed.filter((t) => Number(t.pnl) > 0);
    const losses = closed.filter((t) => Number(t.pnl) < 0);
    const breakeven = closed.filter((t) => Number(t.pnl) === 0);
    const netPnl = closed.reduce((s, t) => s + Number(t.pnl), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const avgRr = closed.length > 0 ? closed.reduce((s, t) => s + Number(t.rr || 0), 0) / closed.length : 0;
    const totalLots = activeTrades.reduce((s, t) => s + Number(t.quantity), 0);
    return { total: activeTrades.length, wins: wins.length, losses: losses.length, breakeven: breakeven.length, netPnl, winRate, avgRr, totalLots };
  }, [activeTrades]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const setFilter = (key: string, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setPage(0);
  };

  const clearFilters = () => { setFilters({}); setSearch(''); setPage(0); };
  const hasFilters = search || Object.values(filters).some((v) => v && v !== 'all');

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('trades').delete().eq('id', deleting.id);
    if (error) { logger.error('Journal', 'Delete failed', { error: error.message }); return; }
    emit('trade:deleted', { id: deleting.id }, 'journal');
    setDeleting(null); onMutated();
  };

  const handleArchive = async () => {
    if (!archiving) return;
    const { error } = await supabase.from('trades').update({ archived: true }).eq('id', archiving.id);
    if (error) { logger.error('Journal', 'Archive failed', { error: error.message }); return; }
    emit('trade:archived', { id: archiving.id }, 'journal');
    setArchiving(null); onMutated();
  };

  const handleDuplicate = async (trade: Trade) => {
    const { id, created_at, ...rest } = trade;
    const { error } = await supabase.from('trades').insert({ ...rest, instrument: `${trade.instrument} (copy)`, pnl: 0, status: 'pending', executed_at: new Date().toISOString(), closed_at: null });
    if (error) { logger.error('Journal', 'Duplicate failed', { error: error.message }); return; }
    emit('trade:created', { id: 'duplicate' }, 'journal');
    onMutated();
  };

  const closeForm = () => { setShowAdd(false); setEditing(null); };
  const onSaved = () => { closeForm(); onMutated(); };

  useEffect(() => {
    const unsub = on('journal:add-trade', () => setShowAdd(true));
    return unsub;
  }, []);

  return (
    <div className="journal-shell space-y-5">
      <div className="rounded-2xl border border-border bg-card/40 p-4 sm:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">Trading journal</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">Review executions, decisions, and behavior.</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-2.5 py-1">{stats.total} trades</span>
            <span className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-2.5 py-1">{stats.wins} wins</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Trades', value: stats.total.toString(), tone: 'neutral' },
              { label: 'Net P&L', value: formatCurrency(stats.netPnl), tone: stats.netPnl >= 0 ? 'success' : 'destructive' },
              { label: 'Win rate', value: `${stats.winRate.toFixed(1)}%`, tone: 'neutral' },
              { label: 'Avg R', value: `${stats.avgRr >= 0 ? '+' : ''}${stats.avgRr.toFixed(2)}R`, tone: stats.avgRr >= 0 ? 'success' : 'destructive' },
            ].map((metric) => (
              <div key={metric.label} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</span>
                <span className={cn('text-sm font-semibold tabular-nums',
                  metric.tone === 'success' && 'text-success',
                  metric.tone === 'destructive' && 'text-destructive',
                  metric.tone === 'neutral' && 'text-foreground'
                )}>{metric.value}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {hasFilters ? `${filtered.length} trade${filtered.length === 1 ? '' : 's'} in view` : 'All active trades in this workspace'}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search instrument, notes, tags, ID..." className="pl-10 h-10 rounded-xl" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-10 rounded-xl"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
            {hasFilters && <Button variant="ghost" onClick={clearFilters} className="h-10 rounded-xl"><X className="w-4 h-4 mr-2" /> Clear</Button>}
            <Button onClick={() => setShowAdd(true)} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Add Trade</Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3 rounded-xl border border-border bg-card/40">
          <FilterSelect label="Direction" value={filters.direction || 'all'} onChange={(v) => setFilter('direction', v)} options={[{ value: 'all', label: 'All' }, ...DIRECTIONS.map((d) => ({ value: d, label: d }))]} />
          <FilterSelect label="Status" value={filters.status || 'all'} onChange={(v) => setFilter('status', v)} options={[{ value: 'all', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
          <FilterSelect label="Session" value={filters.session || 'all'} onChange={(v) => setFilter('session', v)} options={[{ value: 'all', label: 'All' }, ...SESSIONS.map((s) => ({ value: s, label: s.replace('_', ' ') }))]} />
          <FilterSelect label="Timeframe" value={filters.timeframe || 'all'} onChange={(v) => setFilter('timeframe', v)} options={[{ value: 'all', label: 'All' }, ...TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))]} />
          <FilterSelect label="Instrument" value={filters.instrument || 'all'} onChange={(v) => setFilter('instrument', v)} options={[{ value: 'all', label: 'All' }, ...instruments.map((i) => ({ value: i, label: i }))]} />
          <FilterSelect label="Result" value={filters.result || 'all'} onChange={(v) => setFilter('result', v)} options={[{ value: 'all', label: 'All' }, ...RESULTS.map((r) => ({ value: r, label: r }))]} />
          {strategies.length > 0 && <FilterSelect label="Tag" value={filters.tag || 'all'} onChange={(v) => setFilter('tag', v)} options={[{ value: 'all', label: 'All' }, ...strategies.map((s) => ({ value: s, label: s }))]} />}
        </div>
      )}

      {/* Trade Table */}
      {sorted.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No trades found" description={hasFilters ? "No trades match your filters. Try clearing them." : "Add your first trade to start journaling."} action={!hasFilters && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Trade</Button>} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-card/50 border-b border-border">
                  <tr>
                    <Th label="Date" sortKey="executed_at" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <Th label="Instrument" sortKey="instrument" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <Th label="Dir" sortKey="direction" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <Th label="Entry" sortKey="entry_price" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} numeric />
                    <Th label="Exit" numeric />
                    <Th label="SL" numeric />
                    <Th label="TP" numeric />
                    <Th label="Lots" sortKey="quantity" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} numeric />
                    <Th label="R:R" sortKey="rr" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} numeric />
                    <Th label="P&L" sortKey="pnl" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} numeric />
                    <Th label="Status" sortKey="status" sortKey_={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <Th label="Session" />
                    <Th label="" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((t) => (
                    <tr key={t.id} className={cn('transition-colors cursor-pointer', viewing?.id === t.id ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/30')} onClick={() => setViewing(t)}>
                      <Td><span className="text-xs text-muted-foreground">{formatDate(t.executed_at)}</span></Td>
                      <Td><span className="font-semibold">{t.instrument}</span></Td>
                      <Td><Badge variant="outline" className={cn('text-[10px]', t.direction === 'long' ? 'text-success' : 'text-destructive')}>{t.direction === 'long' ? 'LONG' : 'SHORT'}</Badge></Td>
                      <Td numeric>{Number(t.entry_price).toFixed(2)}</Td>
                      <Td numeric>{t.exit_price ? Number(t.exit_price).toFixed(2) : '—'}</Td>
                      <Td numeric>{t.stop_loss ? Number(t.stop_loss).toFixed(2) : '—'}</Td>
                      <Td numeric>{t.take_profit ? Number(t.take_profit).toFixed(2) : '—'}</Td>
                      <Td numeric>{Number(t.quantity).toFixed(2)}</Td>
                      <Td numeric>{Number(t.rr).toFixed(2)}</Td>
                      <Td numeric><span className={cn('font-bold tabular-nums', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(t.pnl))}</span></Td>
                      <Td><Badge variant={t.status === 'open' ? 'warning' : t.status === 'pending' ? 'secondary' : 'outline'} className="text-[10px] capitalize">{t.status}</Badge></Td>
                      <Td><span className="text-xs capitalize">{t.session ? t.session.replace('_', ' ') : '—'}</span></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setViewing(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDuplicate(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setArchiving(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Archive className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleting(t)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {paged.map((t) => (
              <Card key={t.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setViewing(t)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn('grid place-items-center w-10 h-10 rounded-lg shrink-0', t.direction === 'long' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                        {t.direction === 'long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{t.instrument}</span>
                          <Badge variant="outline" className="text-[10px]">{t.direction.toUpperCase()}</Badge>
                          {t.status === 'open' && <Badge variant="warning" className="text-[10px]">OPEN</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(t.executed_at)}</div>
                        {(t.strategy_tags || []).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{(t.strategy_tags || []).slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className={cn('text-sm font-bold tabular-nums', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(t.pnl))}</div>
                      <div className="text-[10px] text-muted-foreground">RR: {Number(t.rr).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setViewing(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDuplicate(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setArchiving(t)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Archive className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(t)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{sorted.length} trades · Page {currentPage + 1} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" disabled={currentPage >= totalPages - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      {(showAdd || editing) && <TradeForm trade={editing} onClose={closeForm} onSaved={onSaved} />}

      {/* Detail View */}
      {viewing && (
        <TradeDetail
          trade={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onDuplicate={() => { handleDuplicate(viewing); setViewing(null); }}
          onArchive={() => { setArchiving(viewing); setViewing(null); }}
          onDelete={() => { setDeleting(viewing); setViewing(null); }}
        />
      )}

      {/* Delete Confirmation */}
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

      {/* Archive Confirmation */}
      {archiving && (
        <Dialog open onOpenChange={() => setArchiving(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Archive trade?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Archiving hides this {archiving.instrument} trade from your active list without deleting it. You can restore it later.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiving(null)}>Cancel</Button>
              <Button onClick={handleArchive}><Archive className="w-4 h-4 mr-2" /> Archive</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon: Icon }: { label: string; value: string; sub?: string; accent?: 'success' | 'destructive'; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className={cn('text-xl font-bold tabular-nums', accent === 'success' && 'text-success', accent === 'destructive' && 'text-destructive')}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
            {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
          </div>
          {Icon && <Icon className="w-5 h-5 text-muted-foreground/40" />}
        </div>
      </CardContent>
    </Card>
  );
}

function Th({ label, sortKey, sortKey_, sortDir, onSort, numeric }: { label: string; sortKey?: SortKey; sortKey_?: SortKey; sortDir?: SortDir; onSort?: (k: SortKey) => void; numeric?: boolean }) {
  const sortable = sortKey && onSort;
  return (
    <th className={cn('px-3 py-2.5 text-xs font-medium text-muted-foreground', numeric ? 'text-right' : 'text-left')}>
      {sortable ? (
        <button onClick={() => onSort!(sortKey!)} className={cn('inline-flex items-center gap-1 hover:text-foreground transition-colors', numeric && 'flex-row-reverse')}>
          {label}
          {sortKey_ === sortKey && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          {sortKey_ !== sortKey && <ArrowUpDown className="w-3 h-3 opacity-30" />}
        </button>
      ) : label}
    </th>
  );
}

function Td({ children, numeric }: { children: React.ReactNode; numeric?: boolean }) {
  return <td className={cn('px-3 py-2.5', numeric ? 'text-right tabular-nums' : '')}>{children}</td>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs capitalize">{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
