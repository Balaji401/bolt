'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plug, Plus, RefreshCw, Trash2, TrendingUp, Upload, FileText, CheckCircle2, AlertCircle, Clock, ChevronRight, X, History, Loader2, Database, Shield, Zap, Eye, ArrowRight, RotateCcw } from 'lucide-react';
import type { BrokerConnection, OpenPosition, ImportJob, ImportError, Trade, TradingAccount } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { BROKER_LIST, BROKER_ADAPTERS } from '@/lib/brokers';
import { useWorkspace } from '@/components/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState, LoadingState, ErrorState } from '@/components/feedback/state';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { emit, on } from '@/lib/event-bus';
import { logger } from '@/lib/logger';
import { ImportWizard } from '@/components/brokers/import-wizard';

const BROKERS = ['MT4', 'MT5', 'cTrader', 'DXtrade', 'MatchTrader', 'Binance', 'Bybit', 'OANDA', 'IBKR'];

export function Brokers({ trades, onTradesUpdated }: { trades: Trade[]; onTradesUpdated: () => void }) {
  const { accounts } = useWorkspace();
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewingJob, setViewingJob] = useState<ImportJob | null>(null);
  const [jobErrors, setJobErrors] = useState<ImportError[]>([]);
  const [form, setForm] = useState({ broker_name: 'MT5', account_id: '', account_type: 'demo', login: '', server: '', currency: 'USD', leverage: '1:30' });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, p, j] = await Promise.all([
        supabase.from('broker_connections').select('*').order('created_at', { ascending: false }),
        supabase.from('open_positions').select('*').order('opened_at', { ascending: false }),
        supabase.from('import_jobs').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      setConnections((c.data || []) as BrokerConnection[]);
      setPositions((p.data || []) as OpenPosition[]);
      setImportJobs((j.data || []) as ImportJob[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load broker data');
      logger.error('Brokers', 'Load failed', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = on('trades:imported', () => { load(); onTradesUpdated(); });
    return unsub;
  }, [load, onTradesUpdated]);

  const addConnection = async () => {
    const { error: insErr } = await supabase.from('broker_connections').insert({
      broker_name: form.broker_name, account_id: form.account_id || null, account_type: form.account_type as string,
      login: form.login || null, server: form.server || null,
      status: 'disconnected', auto_sync: true, balance: 0, equity: 0,
      currency: form.currency, leverage: form.leverage,
    });
    if (insErr) { logger.error('Brokers', 'Add connection failed', { error: insErr.message }); return; }
    emit('account:connected', form, 'brokers');
    setShowAdd(false);
    load();
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

  const viewJobDetails = async (job: ImportJob) => {
    setViewingJob(job);
    const { data } = await supabase.from('import_errors').select('*').eq('import_job_id', job.id).order('row_number').limit(50);
    setJobErrors((data || []) as ImportError[]);
  };

  const retryImport = async (job: ImportJob) => {
    await supabase.from('import_jobs').update({ status: 'importing', progress: 0, error_message: null, started_at: new Date().toISOString() }).eq('id', job.id);
    load();
  };

  const deleteJob = async (job: ImportJob) => {
    await supabase.from('import_jobs').delete().eq('id', job.id);
    setViewingJob(null);
    load();
  };

  const importStats = useMemo(() => {
    const total = importJobs.length;
    const completed = importJobs.filter((j) => j.status === 'completed').length;
    const totalImported = importJobs.reduce((s, j) => s + j.imported_rows, 0);
    const totalFailed = importJobs.reduce((s, j) => s + j.failed_rows, 0);
    return { total, completed, totalImported, totalFailed };
  }, [importJobs]);

  if (loading) return <LoadingState label="Loading broker connections..." />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Broker Sync</h2>
            <p className="text-sm text-muted-foreground">Import and sync trades from your trading platforms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Connect Broker</Button>
          <Button onClick={() => setShowImport(true)}><Upload className="w-4 h-4 mr-2" /> Import Trades</Button>
        </div>
      </div>

      {/* Import Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Imports" value={importStats.total.toString()} icon={Database} />
        <StatCard label="Completed" value={importStats.completed.toString()} icon={CheckCircle2} accent="success" />
        <StatCard label="Trades Imported" value={importStats.totalImported.toString()} icon={TrendingUp} accent="primary" />
        <StatCard label="Failed Rows" value={importStats.totalFailed.toString()} icon={AlertCircle} accent={importStats.totalFailed > 0 ? 'destructive' : undefined} />
      </div>

      {/* Connected Accounts */}
      <Section title="Connected Accounts" icon={Plug}>
        {connections.length === 0 ? (
          <EmptyState icon={Plug} title="No brokers connected" description="Connect your trading account to enable auto-sync." action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Connect Broker</Button>} />
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
      </Section>

      {/* Available Brokers */}
      <Section title="Available Brokers" icon={Zap}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BROKER_LIST.map((b) => (
            <div key={b.id} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors text-center">
              <div className="grid place-items-center w-10 h-10 rounded-lg bg-secondary/60"><FileText className="w-5 h-5 text-muted-foreground" /></div>
              <div className="text-xs font-semibold">{b.label}</div>
              <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => setShowImport(true)}>Import</Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>Future API integrations (MetaAPI, Binance, Bybit, OANDA, IBKR) are architecturally ready but not yet activated.</span>
        </div>
      </Section>

      {/* Import History */}
      <Section title="Import History" icon={History}>
        {importJobs.length === 0 ? (
          <EmptyState icon={History} title="No imports yet" description="Import your first CSV file to see it here." action={<Button size="sm" onClick={() => setShowImport(true)}><Upload className="w-4 h-4 mr-2" /> Import Trades</Button>} />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/50 border-b border-border">
                <tr>
                  <Th label="Date" />
                  <Th label="Broker" />
                  <Th label="File" />
                  <Th label="Imported" numeric />
                  <Th label="Skipped" numeric />
                  <Th label="Failed" numeric />
                  <Th label="Status" />
                  <Th label="" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => viewJobDetails(job)}>
                    <Td><span className="text-xs text-muted-foreground">{formatDate(job.created_at)}</span></Td>
                    <Td><span className="font-medium text-xs">{job.broker_name}</span></Td>
                    <Td><span className="text-xs truncate max-w-[120px] block">{job.file_name || '—'}</span></Td>
                    <Td numeric><span className="text-success font-medium text-xs">{job.imported_rows}</span></Td>
                    <Td numeric><span className="text-warning text-xs">{job.skipped_rows}</span></Td>
                    <Td numeric><span className={cn('text-xs', job.failed_rows > 0 ? 'text-destructive font-medium' : 'text-muted-foreground')}>{job.failed_rows}</span></Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {job.status === 'importing' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        {job.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-success" />}
                        {job.status === 'failed' && <AlertCircle className="w-3 h-3 text-destructive" />}
                        {job.status === 'cancelled' && <X className="w-3 h-3 text-muted-foreground" />}
                        {job.status === 'pending' && <Clock className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-xs capitalize">{job.status}</span>
                      </div>
                    </Td>
                    <Td><ChevronRight className="w-4 h-4 text-muted-foreground" /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Open Positions (if any) */}
      {positions.length > 0 && (
        <Section title="Open Positions" icon={TrendingUp}>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {positions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant={p.direction === 'long' ? 'success' : 'destructive'} className="text-[10px]">{p.direction.toUpperCase()}</Badge>
                      <span className="text-sm font-medium">{p.instrument}</span>
                      <span className="text-xs text-muted-foreground">{Number(p.volume)} lots @ {Number(p.entry_price)}</span>
                    </div>
                    <div className={cn('text-sm font-semibold tabular-nums', Number(p.floating_pnl) >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(Number(p.floating_pnl))}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Supported Formats */}
      <Section title="Supported Formats" icon={FileText}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BROKER_LIST.map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{b.label}</span>
              </div>
              <div className="text-xs text-muted-foreground">{b.description}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">Formats: {b.fileTypes.join(', ')} · Max: {b.maxFileSize / 1024 / 1024}MB</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Add Connection Dialog */}
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

      {/* Import Wizard */}
      {showImport && (
        <ImportWizard trades={trades} accounts={accounts} onClose={() => setShowImport(false)} onImported={() => { load(); onTradesUpdated(); }} />
      )}

      {/* Import Job Details */}
      {viewingJob && (
        <Dialog open onOpenChange={() => setViewingJob(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Import Details</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DetailItem label="Date" value={formatDateTime(viewingJob.created_at)} />
                <DetailItem label="Broker" value={viewingJob.broker_name} />
                <DetailItem label="File" value={viewingJob.file_name || '—'} />
                <DetailItem label="Format" value={viewingJob.source_format.toUpperCase()} />
                <DetailItem label="Total Rows" value={viewingJob.total_rows.toString()} />
                <DetailItem label="Imported" value={viewingJob.imported_rows.toString()} accent="success" />
                <DetailItem label="Skipped" value={viewingJob.skipped_rows.toString()} accent="warning" />
                <DetailItem label="Failed" value={viewingJob.failed_rows.toString()} accent="destructive" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={viewingJob.status === 'completed' ? 'success' : viewingJob.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">{viewingJob.status}</Badge>
                {viewingJob.error_message && <span className="text-xs text-destructive">{viewingJob.error_message}</span>}
              </div>

              {jobErrors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Error Log ({jobErrors.length})</div>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin rounded-lg border border-border p-2 space-y-1">
                    {jobErrors.map((err) => (
                      <div key={err.id} className="text-xs flex items-start gap-2 py-1 border-b border-border last:border-0">
                        <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                        <div><span className="font-medium text-destructive">Row {err.row_number}:</span> <span className="text-muted-foreground">{err.error_message}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {viewingJob.status === 'failed' && <Button size="sm" variant="outline" onClick={() => retryImport(viewingJob)}><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry Import</Button>}
                <Button size="sm" variant="ghost" onClick={() => deleteJob(viewingJob)}><Trash2 className="w-3.5 h-3.5 mr-1.5 text-destructive" /> Delete Log</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /><h3 className="text-sm font-semibold">{title}</h3></div>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent?: 'success' | 'destructive' | 'primary' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className={cn('text-xl font-bold tabular-nums', accent === 'success' && 'text-success', accent === 'destructive' && 'text-destructive', accent === 'primary' && 'text-primary')}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
          </div>
          <Icon className="w-5 h-5 text-muted-foreground/40" />
        </div>
      </CardContent>
    </Card>
  );
}

function Th({ label, numeric }: { label: string; numeric?: boolean }) {
  return <th className={cn('px-3 py-2.5 text-xs font-medium text-muted-foreground', numeric ? 'text-right' : 'text-left')}>{label}</th>;
}

function Td({ children, numeric }: { children: React.ReactNode; numeric?: boolean }) {
  return <td className={cn('px-3 py-2.5', numeric && 'text-right tabular-nums')}>{children}</td>;
}

function DetailItem({ label, value, accent }: { label: string; value: string; accent?: 'success' | 'destructive' | 'warning' }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-medium truncate', accent === 'success' && 'text-success', accent === 'destructive' && 'text-destructive', accent === 'warning' && 'text-warning')}>{value}</div>
    </div>
  );
}
