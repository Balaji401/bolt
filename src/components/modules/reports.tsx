'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileBarChart, Table, Shield, HeartPulse, Target, BookOpen, Wallet, Brain, Plus, History, LayoutTemplate, CalendarClock, Download, FileText, Eye, Copy, Trash2, ChevronUp, ChevronDown, X, Check, RefreshCw, Filter } from 'lucide-react';
import type { Trade, Strategy, PsychologyLog, TradingGoal, Habit, Mistake, RiskRules, DailyJournal, ReportTemplate, ReportHistoryRecord, ScheduledReport } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { computeMetrics } from '@/lib/analytics';
import {
  type ReportType, type ReportFilters, type ReportSection, type ReportData,
  DEFAULT_SECTIONS, SYSTEM_TEMPLATES,
  generatePerformanceReport, generateTradeReport, generateRiskReport,
  generatePsychologyReport, generateStrategyReport, generateJournalReport,
  generateAccountReport, exportReportCSV, exportReportExcel, generateReportHTML,
  filtersToFilterOptions,
} from '@/lib/reports';
import { exportTradesCSV, exportMetricsCSV } from '@/lib/export';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

type ReportTab = 'dashboard' | 'builder' | 'preview' | 'history' | 'templates' | 'scheduled';

const REPORT_TYPES: { type: ReportType; label: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }[] = [
  { type: 'performance', label: 'Performance Report', icon: FileBarChart, description: 'Win rate, P&L, profit factor, streaks, equity curve', color: 'text-primary' },
  { type: 'trade', label: 'Trade Report', icon: Table, description: 'Trade-by-trade breakdown with full details', color: 'text-primary' },
  { type: 'risk', label: 'Risk Report', icon: Shield, description: 'Risk per trade, drawdown, violations, consistency', color: 'text-warning' },
  { type: 'psychology', label: 'Psychology Report', icon: HeartPulse, description: 'Emotional patterns, discipline, FOMO, mistakes', color: 'text-destructive' },
  { type: 'strategy', label: 'Strategy Report', icon: Target, description: 'Per-strategy performance and comparison', color: 'text-primary' },
  { type: 'journal', label: 'Journal Report', icon: BookOpen, description: 'Journal completion, lessons, goals, habits', color: 'text-primary' },
  { type: 'account', label: 'Account Report', icon: Wallet, description: 'Account balance, P&L, performance per account', color: 'text-success' },
  { type: 'ai_review', label: 'AI Review Report', icon: Brain, description: 'AI summary, key insights, improvement areas', color: 'text-primary' },
];

const TABS: { id: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: FileBarChart },
  { id: 'builder', label: 'Builder', icon: Plus },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'history', label: 'History', icon: History },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'scheduled', label: 'Scheduled', icon: CalendarClock },
];

export function Reports({ trades }: { trades: Trade[] }) {
  const { workspace, activeAccount } = useWorkspace();
  const [tab, setTab] = useState<ReportTab>('dashboard');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [psychologyLogs, setPsychologyLogs] = useState<PsychologyLog[]>([]);
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [riskRules, setRiskRules] = useState<RiskRules | null>(null);
  const [dailyJournals, setDailyJournals] = useState<DailyJournal[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [history, setHistory] = useState<ReportHistoryRecord[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedType, setSelectedType] = useState<ReportType>('performance');
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: null, dateTo: null, accountId: null, instrument: null,
    strategy: null, session: null, timeframe: null, direction: null,
    setupType: null, tags: [],
  });
  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS['performance']);
  const [includeAI, setIncludeAI] = useState(false);
  const [reportName, setReportName] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true); setError(false);
    try {
      const [stratRes, psychRes, goalRes, habitRes, mistakeRes, riskRes, journalRes, tmplRes, histRes, schedRes] = await Promise.all([
        supabase.from('strategies').select('*').eq('workspace_id', workspace.id),
        supabase.from('psychology_logs').select('*').order('log_date', { ascending: false }).limit(60),
        supabase.from('trading_goals').select('*').order('created_at', { ascending: false }),
        supabase.from('habits').select('*').eq('workspace_id', workspace.id),
        supabase.from('mistakes').select('*').eq('workspace_id', workspace.id),
        supabase.from('risk_rules').select('*').eq('workspace_id', workspace.id).eq('account_id', activeAccount?.id || '__no_active_account__').maybeSingle(),
        supabase.from('daily_journals').select('*').order('journal_date', { ascending: false }).limit(30),
        supabase.from('report_templates').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
        supabase.from('report_history').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('scheduled_reports').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
      ]);
      setStrategies((stratRes.data || []) as Strategy[]);
      setPsychologyLogs((psychRes.data || []) as PsychologyLog[]);
      setGoals((goalRes.data || []) as TradingGoal[]);
      setHabits((habitRes.data || []) as Habit[]);
      setMistakes((mistakeRes.data || []) as Mistake[]);
      setRiskRules(riskRes.data as RiskRules | null);
      setDailyJournals((journalRes.data || []) as DailyJournal[]);
      setTemplates((tmplRes.data || []) as ReportTemplate[]);
      setHistory((histRes.data || []) as ReportHistoryRecord[]);
      setScheduled((schedRes.data || []) as ScheduledReport[]);
      setLoading(false);
    } catch {
      setError(true); setLoading(false);
    }
  }, [workspace, activeAccount?.id]);

  useEffect(() => { load(); }, [load]);

  const reportData = useMemo<ReportData | null>(() => {
    if (trades.length === 0) return null;
    try {
      switch (selectedType) {
        case 'performance': return { type: 'performance', data: generatePerformanceReport(trades, filters) };
        case 'trade': return { type: 'trade', data: generateTradeReport(trades, filters) };
        case 'risk': return { type: 'risk', data: generateRiskReport(trades, filters, Number(activeAccount?.current_balance || 0), riskRules) };
        case 'psychology': return { type: 'psychology', data: generatePsychologyReport(psychologyLogs, mistakes) };
        case 'strategy': return { type: 'strategy', data: generateStrategyReport(trades, strategies, filters) };
        case 'journal': return { type: 'journal', data: generateJournalReport(trades, mistakes, goals, habits, dailyJournals, filters) };
        case 'account': return { type: 'account', data: generateAccountReport(trades, activeAccount?.account_name || 'Default', Number(activeAccount?.initial_balance || 0), Number(activeAccount?.current_balance || 0), filters) };
        default: return null;
      }
    } catch { return null; }
  }, [trades, filters, selectedType, psychologyLogs, mistakes, strategies, goals, habits, dailyJournals, riskRules, activeAccount]);

  const handleSelectType = (type: ReportType) => {
    setSelectedType(type);
    setSections(DEFAULT_SECTIONS[type]);
    setTab('builder');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !workspace) { setGenerating(false); return; }
      const name = reportName || `${REPORT_TYPES.find((r) => r.type === selectedType)?.label || 'Report'} — ${formatDate(new Date())}`;
      const metrics = computeMetrics(trades);
      await supabase.from('report_history').insert({
        user_id: user.id,
        workspace_id: workspace.id,
        name,
        report_type: selectedType,
        period_start: filters.dateFrom,
        period_end: filters.dateTo,
        account_id: filters.accountId,
        status: 'generated',
        filters: filters as unknown as Record<string, unknown>,
        sections: sections.filter((s) => s.enabled).map((s) => s.id),
        metrics: { totalTrades: metrics.totalTrades, totalPnl: metrics.totalPnl, winRate: metrics.winRate } as unknown as Record<string, unknown>,
        include_ai_summary: includeAI,
      });
      await load();
      setTab('history');
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportData) return;
    const name = reportName || `${selectedType}-report`;
    if (format === 'csv') {
      const csv = exportReportCSV(selectedType, reportData);
      downloadFile(csv, `${name}.csv`, 'text/csv');
    } else if (format === 'excel') {
      const html = exportReportExcel(selectedType, reportData);
      downloadFile(html, `${name}.xls`, 'application/vnd.ms-excel');
    } else if (format === 'pdf') {
      const enabledSections = sections.filter((s) => s.enabled).map((s) => s.id);
      const html = generateReportHTML(name, selectedType, reportData, enabledSections, includeAI);
      const win = window.open('', '_blank', 'width=900,height=700');
      if (win) { win.document.write(html); win.document.close(); }
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await supabase.from('report_history').delete().eq('id', id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleDuplicateHistory = async (item: ReportHistoryRecord) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !workspace) return;
    await supabase.from('report_history').insert({
      user_id: user.id,
      workspace_id: workspace.id,
      name: `${item.name} (Copy)`,
      report_type: item.report_type,
      period_start: item.period_start,
      period_end: item.period_end,
      account_id: item.account_id,
      status: 'generated',
      filters: item.filters,
      sections: item.sections,
      metrics: item.metrics,
      include_ai_summary: item.include_ai_summary,
    });
    await load();
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('report_templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !workspace) return;
    const name = reportName || `Custom ${selectedType} Template`;
    await supabase.from('report_templates').insert({
      user_id: user.id,
      workspace_id: workspace.id,
      name,
      report_type: selectedType,
      filters: filters as unknown as Record<string, unknown>,
      sections: sections.filter((s) => s.enabled).map((s) => s.id),
      is_custom: true,
    });
    await load();
    setTab('templates');
  };

  const handleToggleScheduled = async (id: string, active: boolean) => {
    await supabase.from('scheduled_reports').update({ active }).eq('id', id);
    setScheduled((prev) => prev.map((s) => s.id === id ? { ...s, active } : s));
  };

  const handleDeleteScheduled = async (id: string) => {
    await supabase.from('scheduled_reports').delete().eq('id', id);
    setScheduled((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreateScheduled = async (templateId: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !workspace) return;
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const next = new Date();
    if (frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    await supabase.from('scheduled_reports').insert({
      user_id: user.id,
      workspace_id: workspace.id,
      template_id: templateId,
      name: `${template.name} — ${frequency}`,
      frequency,
      delivery_preference: 'view',
      active: true,
      next_generation_at: next.toISOString(),
    });
    await load();
  };

  if (loading) return <LoadingState label="Loading reports…" />;
  if (error) return <ErrorState title="Could not load reports" description="Your reports data could not be loaded." onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <FileBarChart className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Reports & Performance Reviews</h2>
          <p className="text-sm text-muted-foreground">Generate, filter, export, and schedule professional trading reports.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border pb-px">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors', tab === item.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
            <item.icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-5">
          {trades.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No trading data yet" description="Add trades to your journal to generate reports." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {REPORT_TYPES.map((r) => (
                  <Card key={r.type} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleSelectType(r.type)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <r.icon className={cn('w-5 h-5', r.color)} />
                        <span className="text-sm font-medium">{r.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{r.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {history.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4 text-primary" />Recently Generated Reports</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {history.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{h.name}</div>
                            <div className="text-[10px] text-muted-foreground">{formatDate(h.created_at)} • {h.report_type}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px]">{h.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'builder' && (
        <ReportBuilder
          trades={trades}
          selectedType={selectedType}
          setSelectedType={(t) => { setSelectedType(t); setSections(DEFAULT_SECTIONS[t]); }}
          filters={filters}
          setFilters={setFilters}
          sections={sections}
          setSections={setSections}
          includeAI={includeAI}
          setIncludeAI={setIncludeAI}
          reportName={reportName}
          setReportName={setReportName}
          onPreview={() => setTab('preview')}
          onGenerate={handleGenerate}
          onSaveTemplate={handleSaveTemplate}
          generating={generating}
        />
      )}

      {tab === 'preview' && reportData && (
        <ReportPreview
          reportData={reportData}
          selectedType={selectedType}
          sections={sections}
          setSections={setSections}
          reportName={reportName || `${selectedType} report`}
          onExport={handleExport}
          onGenerate={handleGenerate}
          generating={generating}
          includeAI={includeAI}
        />
      )}

      {tab === 'preview' && !reportData && (
        <EmptyState icon={Eye} title="Nothing to preview" description="Build a report first to see a preview." />
      )}

      {tab === 'history' && (
        <ReportHistoryList
          history={history}
          onView={(h) => { setSelectedType(h.report_type as ReportType); setReportName(h.name); setTab('preview'); }}
          onDuplicate={handleDuplicateHistory}
          onDelete={handleDeleteHistory}
        />
      )}

      {tab === 'templates' && (
        <TemplateManager
          templates={templates}
          systemTemplates={SYSTEM_TEMPLATES}
          onDelete={handleDeleteTemplate}
          onUse={(t) => { setSelectedType(t.report_type); setSections(DEFAULT_SECTIONS[t.report_type]); setTab('builder'); }}
        />
      )}

      {tab === 'scheduled' && (
        <ScheduledReports
          scheduled={scheduled}
          templates={templates}
          onToggle={handleToggleScheduled}
          onDelete={handleDeleteScheduled}
          onCreate={handleCreateScheduled}
        />
      )}
    </div>
  );
}

function ReportBuilder({ trades, selectedType, setSelectedType, filters, setFilters, sections, setSections, includeAI, setIncludeAI, reportName, setReportName, onPreview, onGenerate, onSaveTemplate, generating }: {
  trades: Trade[];
  selectedType: ReportType;
  setSelectedType: (t: ReportType) => void;
  filters: ReportFilters;
  setFilters: (f: ReportFilters) => void;
  sections: ReportSection[];
  setSections: (s: ReportSection[]) => void;
  includeAI: boolean;
  setIncludeAI: (v: boolean) => void;
  reportName: string;
  setReportName: (v: string) => void;
  onPreview: () => void;
  onGenerate: () => void;
  onSaveTemplate: () => void;
  generating: boolean;
}) {
  const instruments = useMemo(() => [...new Set(trades.map((t) => t.instrument))].sort(), [trades]);
  const sessions = ['asia', 'london', 'new_york', 'sydney', 'other'];
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'];
  const directions = ['long', 'short'];

  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const tmp = sorted[idx].order;
    sorted[idx].order = sorted[newIdx].order;
    sorted[newIdx].order = tmp;
    setSections(sorted);
  };

  const toggleSection = (id: string) => {
    setSections(sections.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Report Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Report Name</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. Weekly Performance Review"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Report Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {REPORT_TYPES.map((r) => (
                <button
                  key={r.type}
                  onClick={() => setSelectedType(r.type)}
                  className={cn('flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors', selectedType === r.type ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary/50')}
                >
                  <r.icon className="w-3.5 h-3.5" />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-primary" />Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Date From</label>
              <input type="date" value={filters.dateFrom || ''} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Date To</label>
              <input type="date" value={filters.dateTo || ''} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Instrument</label>
              <select value={filters.instrument || ''} onChange={(e) => setFilters({ ...filters, instrument: e.target.value || null })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                <option value="">All</option>
                {instruments.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Session</label>
              <select value={filters.session || ''} onChange={(e) => setFilters({ ...filters, session: e.target.value || null })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                <option value="">All</option>
                {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Timeframe</label>
              <select value={filters.timeframe || ''} onChange={(e) => setFilters({ ...filters, timeframe: e.target.value || null })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                <option value="">All</option>
                {timeframes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Direction</label>
              <select value={filters.direction || ''} onChange={(e) => setFilters({ ...filters, direction: e.target.value || null })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                <option value="">All</option>
                {directions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-primary" />Sections</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {[...sections].sort((a, b) => a.order - b.order).map((s, i, arr) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                <button onClick={() => toggleSection(s.id)} className="shrink-0">
                  {s.enabled ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground" />}
                </button>
                <span className={cn('text-xs font-medium flex-1', !s.enabled && 'text-muted-foreground line-through')}>{s.label}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => moveSection(i, 'up')} disabled={i === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveSection(i, 'down')} disabled={i === arr.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeAI} onChange={(e) => setIncludeAI(e.target.checked)} className="w-4 h-4 rounded border-border" />
            <span className="text-xs font-medium">Include AI Summary (optional)</span>
            <span className="text-[10px] text-muted-foreground">— adds AI-generated insights and improvement areas</span>
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={onPreview} disabled={generating}><Eye className="w-3.5 h-3.5 mr-1.5" />Preview</Button>
        <Button onClick={onGenerate} disabled={generating} variant="default">{generating ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</> : <><FileText className="w-3.5 h-3.5 mr-1.5" />Generate Report</>}</Button>
        <Button onClick={onSaveTemplate} variant="outline"><LayoutTemplate className="w-3.5 h-3.5 mr-1.5" />Save as Template</Button>
      </div>
    </div>
  );
}

function ReportPreview({ reportData, selectedType, sections, setSections, reportName, onExport, onGenerate, generating, includeAI }: {
  reportData: ReportData;
  selectedType: ReportType;
  sections: ReportSection[];
  setSections: (s: ReportSection[]) => void;
  reportName: string;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  onGenerate: () => void;
  generating: boolean;
  includeAI: boolean;
}) {
  const [showExport, setShowExport] = useState(false);
  const enabledSections = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold">{reportName}</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)}><Download className="w-3.5 h-3.5 mr-1.5" />Export</Button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-border bg-popover shadow-lg p-1 min-w-[140px]">
                <button onClick={() => { onExport('csv'); setShowExport(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary rounded-md transition-colors">Export as CSV</button>
                <button onClick={() => { onExport('excel'); setShowExport(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary rounded-md transition-colors">Export as Excel</button>
                <button onClick={() => { onExport('pdf'); setShowExport(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary rounded-md transition-colors">Export as PDF</button>
              </div>
            )}
          </div>
          <Button onClick={onGenerate} disabled={generating} size="sm">{generating ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Generating…</> : <><FileText className="w-3 h-3 mr-1" />Generate & Save</>}</Button>
        </div>
      </div>

      <div className="space-y-4">
        {enabledSections.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <ReportSectionContent sectionId={s.id} reportData={reportData} />
            </CardContent>
          </Card>
        ))}

        {includeAI && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />AI Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground italic">AI summary is generated on demand from your trading data. Enable AI review during generation to include AI insights in your report.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReportSectionContent({ sectionId, reportData }: { sectionId: string; reportData: ReportData }) {
  const summary = (data: { summary: { label: string; value: string }[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {data.summary.map((s) => (
        <div key={s.label} className="p-2 rounded-lg bg-secondary/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
          <div className="text-sm font-bold">{s.value}</div>
        </div>
      ))}
    </div>
  );

  if (reportData.type === 'performance') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'equity') {
      const eq = reportData.data.equityCurve;
      return <p className="text-xs text-muted-foreground">{eq.length} data points. Final equity: {formatCurrency(eq[eq.length - 1]?.cumulative || 0)}</p>;
    }
    if (sectionId === 'streaks') return (
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Max Win Streak</div><div className="text-sm font-bold text-success">{reportData.data.metrics.maxWinStreak}</div></div>
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Max Loss Streak</div><div className="text-sm font-bold text-destructive">{reportData.data.metrics.maxLossStreak}</div></div>
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Current Streak</div><div className="text-sm font-bold">{reportData.data.metrics.currentStreak}</div></div>
      </div>
    );
    if (sectionId === 'breakdown') {
      const sessions = Object.entries(reportData.data.metrics.bySession);
      const instruments = Object.entries(reportData.data.metrics.byInstrument);
      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">By Session</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
              {sessions.map(([k, v]) => (
                <div key={k} className="p-1.5 rounded-lg bg-secondary/50"><div className="text-[10px]">{k}</div><div className={cn('text-xs font-bold', v.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(v.pnl)}</div><div className="text-[9px] text-muted-foreground">{v.trades}t</div></div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">By Instrument (Top 5)</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
              {instruments.slice(0, 5).map(([k, v]) => (
                <div key={k} className="p-1.5 rounded-lg bg-secondary/50"><div className="text-[10px] truncate">{k}</div><div className={cn('text-xs font-bold', v.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(v.pnl)}</div></div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  if (reportData.type === 'trade') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'table') return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border">
            <th className="text-left py-1.5 px-2">Date</th><th className="text-left py-1.5 px-2">Instrument</th><th className="text-left py-1.5 px-2">Dir</th><th className="text-right py-1.5 px-2">Entry</th><th className="text-right py-1.5 px-2">Exit</th><th className="text-right py-1.5 px-2">PnL</th><th className="text-right py-1.5 px-2">RR</th><th className="text-left py-1.5 px-2">Status</th><th className="text-left py-1.5 px-2">Session</th>
          </tr></thead>
          <tbody>
            {reportData.data.trades.slice(0, 30).map((t) => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-1 px-2">{formatDate(t.executed_at)}</td>
                <td className="py-1 px-2 font-medium">{t.instrument}</td>
                <td className="py-1 px-2">{t.direction}</td>
                <td className="py-1 px-2 text-right">{t.entry_price}</td>
                <td className="py-1 px-2 text-right">{t.exit_price ?? '—'}</td>
                <td className={cn('py-1 px-2 text-right font-medium', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>{t.pnl}</td>
                <td className="py-1 px-2 text-right">{Number(t.rr).toFixed(2)}</td>
                <td className="py-1 px-2">{t.status}</td>
                <td className="py-1 px-2">{t.session || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportData.data.trades.length > 30 && <p className="text-[10px] text-muted-foreground mt-2">Showing 30 of {reportData.data.trades.length} trades. Export to see all.</p>}
      </div>
    );
    if (sectionId === 'statistics') return summary(reportData.data);
  }

  if (reportData.type === 'risk') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'violations') return (
      <div className="space-y-1.5">
        {reportData.data.violations.length === 0 ? <p className="text-xs text-muted-foreground">No violations detected.</p> :
          reportData.data.violations.map((v, i) => (
            <div key={i} className={cn('p-2 rounded-lg border text-xs', v.severity === 'critical' ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-warning/20 bg-warning/5 text-warning')}>
              <span className="font-medium">{v.title}</span> — {v.message}
            </div>
          ))}
      </div>
    );
    if (sectionId === 'distribution') return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {reportData.data.riskMetrics.riskDistribution.map((b) => (
          <div key={b.bucket} className="p-2 rounded-lg bg-secondary/50 text-center"><div className="text-[10px] text-muted-foreground">{b.bucket}</div><div className="text-sm font-bold">{b.count}</div></div>
        ))}
      </div>
    );
    if (sectionId === 'consistency') return (
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Risk Consistency</div><div className="text-sm font-bold">{reportData.data.riskMetrics.riskConsistency.toFixed(1)}%</div></div>
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Avg Risk %</div><div className="text-sm font-bold">{reportData.data.riskMetrics.avgRiskPct.toFixed(2)}%</div></div>
      </div>
    );
  }

  if (reportData.type === 'psychology') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'patterns') return (
      <ul className="space-y-1">{reportData.data.patterns.length === 0 ? <li className="text-xs text-muted-foreground">No significant patterns detected.</li> : reportData.data.patterns.map((p, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-warning">!</span>{p}</li>)}</ul>
    );
    if (sectionId === 'trends') return <p className="text-xs text-muted-foreground">{reportData.data.trends.length} psychology log entries tracked over time.</p>;
    if (sectionId === 'mistakes') return (
      <ul className="space-y-1">{reportData.data.mistakes.slice(0, 10).map((m, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-destructive">-</span>{m.name} ({m.frequency}x)</li>)}</ul>
    );
  }

  if (reportData.type === 'strategy') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'comparison') return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border"><th className="text-left py-1.5 px-2">Strategy</th><th className="text-right py-1.5 px-2">Trades</th><th className="text-right py-1.5 px-2">P&L</th><th className="text-right py-1.5 px-2">WR</th><th className="text-right py-1.5 px-2">RR</th><th className="text-right py-1.5 px-2">PF</th></tr></thead>
          <tbody>
            {reportData.data.perStrategy.map((s) => (
              <tr key={s.name} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-1 px-2 font-medium">{s.name}</td>
                <td className="py-1 px-2 text-right">{s.trades}</td>
                <td className={cn('py-1 px-2 text-right font-medium', s.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(s.pnl)}</td>
                <td className="py-1 px-2 text-right">{s.winRate.toFixed(0)}%</td>
                <td className="py-1 px-2 text-right">{s.avgRr.toFixed(2)}</td>
                <td className="py-1 px-2 text-right">{isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '∞'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reportData.type === 'journal') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'lessons') return (
      <ul className="space-y-1">{reportData.data.lessons.slice(0, 10).map((l, i) => <li key={i} className="text-xs text-muted-foreground"><strong className="text-foreground">{l.trade.instrument}</strong> ({formatDate(l.trade.executed_at)}): {l.lesson}</li>)}</ul>
    );
    if (sectionId === 'goals') return (
      <ul className="space-y-1">{reportData.data.goals.map((g, i) => <li key={i} className="text-xs text-muted-foreground">{g.title} — {g.completed ? 'Completed' : `${g.current_value}/${g.target_value} (${((g.current_value / g.target_value) * 100).toFixed(0)}%)`}</li>)}</ul>
    );
    if (sectionId === 'habits') return (
      <ul className="space-y-1">{reportData.data.habits.map((h, i) => <li key={i} className="text-xs text-muted-foreground">{h.name} — {h.active ? 'Active' : 'Inactive'}</li>)}</ul>
    );
  }

  if (reportData.type === 'account') {
    if (sectionId === 'summary') return summary(reportData.data);
    if (sectionId === 'performance') return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Win Rate</div><div className="text-sm font-bold">{reportData.data.metrics.winRate.toFixed(1)}%</div></div>
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Profit Factor</div><div className="text-sm font-bold">{reportData.data.metrics.profitFactor.toFixed(2)}</div></div>
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Avg RR</div><div className="text-sm font-bold">{reportData.data.metrics.avgRr.toFixed(2)}</div></div>
        <div className="p-2 rounded-lg bg-secondary/50"><div className="text-[10px] text-muted-foreground">Expectancy</div><div className="text-sm font-bold">{formatCurrency(reportData.data.metrics.expectancy)}</div></div>
      </div>
    );
  }

  return null;
}

function ReportHistoryList({ history, onView, onDuplicate, onDelete }: {
  history: ReportHistoryRecord[];
  onView: (h: ReportHistoryRecord) => void;
  onDuplicate: (h: ReportHistoryRecord) => void;
  onDelete: (id: string) => void;
}) {
  if (history.length === 0) return <EmptyState icon={History} title="No reports generated yet" description="Build and generate reports to see them here." />;
  return (
    <div className="space-y-2">
      {history.map((h) => (
        <Card key={h.id}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{h.name}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDate(h.created_at)} • {h.report_type.replace(/_/g, ' ')} {h.period_start && h.period_end ? `• ${formatDate(h.period_start)} → ${formatDate(h.period_end)}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="outline" className="text-[9px]">{h.status}</Badge>
                {h.include_ai_summary && <Badge variant="outline" className="text-[9px] text-primary">AI</Badge>}
                <button onClick={() => onView(h)} className="p-1.5 rounded hover:bg-secondary transition-colors" title="View"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => onDuplicate(h)} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => onDelete(h.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplateManager({ templates, systemTemplates, onDelete, onUse }: {
  templates: ReportTemplate[];
  systemTemplates: { name: string; report_type: ReportType; description: string; sections: string[] }[];
  onDelete: (id: string) => void;
  onUse: (t: { report_type: ReportType; sections: string[] }) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">System Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {systemTemplates.map((t, i) => (
            <Card key={i} className="hover:border-primary/20 transition-colors cursor-pointer" onClick={() => onUse({ report_type: t.report_type, sections: t.sections })}>
              <CardContent className="p-3">
                <div className="text-xs font-medium">{t.name}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {t.sections.map((s) => <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s}</span>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {templates.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Custom Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {templates.map((t) => (
              <Card key={t.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{t.name}</div>
                      <p className="text-[10px] text-muted-foreground">{t.report_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => onUse({ report_type: t.report_type, sections: t.sections })} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Use"><Plus className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => onDelete(t.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduledReports({ scheduled, templates, onToggle, onDelete, onCreate }: {
  scheduled: ScheduledReport[];
  templates: ReportTemplate[];
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onCreate: (templateId: string, frequency: 'daily' | 'weekly' | 'monthly') => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Schedule reports to be generated automatically on a recurring basis.</p>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)}><Plus className="w-3.5 h-3.5 mr-1.5" />New Schedule</Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Template</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                <option value="">Select a template…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frequency</label>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                  <button key={f} onClick={() => setSelectedFrequency(f)} className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', selectedFrequency === f ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary/50')}>{f}</button>
                ))}
              </div>
            </div>
            <Button size="sm" disabled={!selectedTemplate} onClick={() => { onCreate(selectedTemplate, selectedFrequency); setShowCreate(false); setSelectedTemplate(''); }}>
              <CalendarClock className="w-3.5 h-3.5 mr-1.5" />Create Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {scheduled.length === 0 && !showCreate ? (
        <EmptyState icon={CalendarClock} title="No scheduled reports" description="Create a schedule to automatically generate reports on a recurring basis." />
      ) : (
        <div className="space-y-2">
          {scheduled.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarClock className={cn('w-4 h-4 shrink-0', s.active ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{s.frequency} {s.active ? '• Active' : '• Paused'} {s.next_generation_at ? `• Next: ${formatDate(s.next_generation_at)}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onToggle(s.id, !s.active)} className={cn('p-1.5 rounded transition-colors', s.active ? 'hover:bg-warning/10 text-warning' : 'hover:bg-success/10 text-success')} title={s.active ? 'Pause' : 'Activate'}>
                      {s.active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => onDelete(s.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
