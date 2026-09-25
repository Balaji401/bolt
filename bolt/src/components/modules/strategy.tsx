'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Boxes, CheckSquare, GitBranch, Layers, Plus, Search, Settings2, Sparkles, Target, Upload } from 'lucide-react';
import type { ChecklistTemplate, Playbook, Strategy, StrategyAttachment, StrategyVersion, Trade, TradeSetup } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { StrategyDashboard } from '@/components/strategy/dashboard';
import { StrategyBuilder } from '@/components/strategy/builder';
import { SetupLibrary } from '@/components/strategy/setup-library';
import { PlaybookManager } from '@/components/strategy/playbook';
import { ChecklistManager } from '@/components/strategy/checklist-manager';
import { StrategyPerformance } from '@/components/strategy/performance';
import { VersionHistory } from '@/components/strategy/version-history';
import { StrategyAttachments } from '@/components/strategy/attachments';
import { StrategyAIPlaceholders } from '@/components/strategy/ai-placeholders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

type StrategyTab = 'dashboard' | 'builder' | 'setups' | 'playbooks' | 'checklists' | 'performance' | 'history' | 'attachments' | 'ai';
const TABS: { id: StrategyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Layers },
  { id: 'builder', label: 'Strategy Builder', icon: Target },
  { id: 'setups', label: 'Setup Library', icon: Boxes },
  { id: 'playbooks', label: 'Playbooks', icon: BookOpen },
  { id: 'checklists', label: 'Checklists', icon: CheckSquare },
  { id: 'performance', label: 'Performance', icon: GitBranch },
  { id: 'history', label: 'Version History', icon: GitBranch },
  { id: 'attachments', label: 'Attachments', icon: Upload },
  { id: 'ai', label: 'AI Preview', icon: Sparkles },
];

export function StrategyManagement({ trades }: { trades: Trade[] }) {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<StrategyTab>('dashboard');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [attachments, setAttachments] = useState<StrategyAttachment[]>([]);
  const [versions, setVersions] = useState<StrategyVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true); setError(false);
    const [strategyResult, setupResult, playbookResult, checklistResult, attachmentResult] = await Promise.all([
      supabase.from('strategies').select('*').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
      supabase.from('trade_setups').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
      supabase.from('playbooks').select('*').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
      supabase.from('checklist_templates').select('*').eq('workspace_id', workspace.id).order('updated_at', { ascending: false }),
      supabase.from('strategy_attachments').select('*').order('created_at', { ascending: false }),
    ]);
    if (strategyResult.error || setupResult.error || playbookResult.error || checklistResult.error || attachmentResult.error) { setError(true); setLoading(false); return; }
    const loadedStrategies = (strategyResult.data || []) as Strategy[];
    setStrategies(loadedStrategies); setSetups((setupResult.data || []) as TradeSetup[]); setPlaybooks((playbookResult.data || []) as Playbook[]); setChecklists((checklistResult.data || []) as ChecklistTemplate[]); setAttachments((attachmentResult.data || []) as StrategyAttachment[]);
    setSelectedId((current) => current && loadedStrategies.some((strategy) => strategy.id === current) ? current : loadedStrategies[0]?.id || null);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { load(); }, [load]);
  const selected = strategies.find((strategy) => strategy.id === selectedId) || null;
  const categories = [...new Set(strategies.map((strategy) => strategy.category).filter(Boolean))];
  const filtered = useMemo(() => strategies.filter((strategy) => { const haystack = [strategy.name, strategy.category, strategy.market, strategy.instrument_type, strategy.timeframe, ...(strategy.tags || [])].join(' ').toLowerCase(); return (!search || haystack.includes(search.toLowerCase())) && (category === 'all' || strategy.category === category); }), [strategies, search, category]);

  const saveStrategy = async (data: Partial<Strategy>) => {
    if (!workspace) return;
    if (editing) {
      const nextVersion = (editing.version || 1) + 1;
      const { error: updateError } = await supabase.from('strategies').update({ ...data, version: nextVersion, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (updateError) return;
      await supabase.from('strategy_versions').insert({ strategy_id: editing.id, version_number: nextVersion, change_summary: 'Strategy details updated', snapshot: { ...editing, ...data, version: nextVersion } });
      setStrategies((previous) => previous.map((strategy) => strategy.id === editing.id ? { ...strategy, ...data, version: nextVersion, updated_at: new Date().toISOString() } as Strategy : strategy));
    } else {
      const { data: created, error: insertError } = await supabase.from('strategies').insert({ ...data, workspace_id: workspace.id }).select().maybeSingle();
      if (insertError || !created) return;
      const strategy = created as Strategy;
      await supabase.from('strategy_versions').insert({ strategy_id: strategy.id, version_number: 1, change_summary: 'Initial strategy created', snapshot: strategy });
      setStrategies((previous) => [strategy, ...previous]); setSelectedId(strategy.id);
    }
    setEditing(null); setTab('dashboard');
  };

  const saveSetup = async (data: Partial<TradeSetup>, id?: string) => {
    if (!workspace) return;
    if (id) { const { data: updated } = await supabase.from('trade_setups').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle(); if (updated) setSetups((previous) => previous.map((setup) => setup.id === id ? updated as TradeSetup : setup)); }
    else { const { data: created } = await supabase.from('trade_setups').insert({ ...data, workspace_id: workspace.id }).select().maybeSingle(); if (created) setSetups((previous) => [created as TradeSetup, ...previous]); }
  };
  const savePlaybook = async (data: Partial<Playbook>, id?: string) => { if (!workspace) return; if (id) { const { data: updated } = await supabase.from('playbooks').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle(); if (updated) setPlaybooks((previous) => previous.map((item) => item.id === id ? updated as Playbook : item)); } else { const { data: created } = await supabase.from('playbooks').insert({ ...data, workspace_id: workspace.id }).select().maybeSingle(); if (created) setPlaybooks((previous) => [created as Playbook, ...previous]); } };
  const saveChecklist = async (data: Partial<ChecklistTemplate>, id?: string) => { if (!workspace) return; if (id) { const { data: updated } = await supabase.from('checklist_templates').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle(); if (updated) setChecklists((previous) => previous.map((item) => item.id === id ? updated as ChecklistTemplate : item)); } else { const { data: created } = await supabase.from('checklist_templates').insert({ ...data, workspace_id: workspace.id }).select().maybeSingle(); if (created) setChecklists((previous) => [created as ChecklistTemplate, ...previous]); } };
  const addAttachment = async (data: Partial<StrategyAttachment>) => { if (!selected || !workspace) return; const { data: created } = await supabase.from('strategy_attachments').insert({ ...data, strategy_id: selected.id }).select().maybeSingle(); if (created) setAttachments((previous) => [created as StrategyAttachment, ...previous]); };
  const deleteRow = async (table: string, id: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => { await supabase.from(table).delete().eq('id', id); setter((previous) => previous.filter((item) => item.id !== id)); };
  const loadVersions = async () => { if (!selected) return; const { data } = await supabase.from('strategy_versions').select('*').eq('strategy_id', selected.id).order('version_number', { ascending: false }); setVersions((data || []) as StrategyVersion[]); };
  useEffect(() => { if (tab === 'history') loadVersions(); }, [tab, selectedId]);

  if (loading) return <LoadingState label="Loading strategy workspace…" />;
  if (error) return <ErrorState title="Could not load strategies" description="Your strategy workspace could not be loaded." onRetry={load} />;

  return <div className="space-y-5"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold">Strategy Management</h2></div><p className="text-sm text-muted-foreground mt-1">Your trading operating manual: strategies, setups, playbooks, and rules.</p></div><Button onClick={() => { setEditing(null); setTab('builder'); }}><Plus className="w-4 h-4 mr-1.5" />New Strategy</Button></div><div className="flex flex-col md:flex-row gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search strategies, setups, markets, tags…" className="pl-9" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="flex flex-wrap gap-1.5 border-b border-border pb-px">{TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors', tab === item.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50')}><item.icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{item.label}</span></button>)}</div>{filtered.length > 0 && <div className="flex flex-wrap gap-2">{filtered.map((strategy) => <button key={strategy.id} onClick={() => setSelectedId(strategy.id)} className={cn('rounded-lg border px-3 py-2 text-left transition-colors', selected?.id === strategy.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}><div className="flex items-center gap-2"><span className="text-xs font-medium">{strategy.name}</span><Badge variant="outline" className="text-[9px]">{strategy.status}</Badge></div><span className="text-[10px] text-muted-foreground">{strategy.category}{strategy.timeframe ? ` · ${strategy.timeframe}` : ''}</span></button>)}</div>}{strategies.length === 0 && tab !== 'builder' ? <EmptyState icon={Target} title="Build your first strategy" description="Document the rules and conditions that create your trading edge." action={<Button onClick={() => setTab('builder')}>Create Strategy</Button>} /> : <>{tab === 'dashboard' && <StrategyDashboard strategies={strategies} setupCount={setups.length} playbookCount={playbooks.length} trades={trades} />}{tab === 'builder' && <StrategyBuilder strategy={editing} onSave={saveStrategy} onCancel={() => setTab('dashboard')} />}{tab === 'setups' && <SetupLibrary strategy={selected} setups={setups} onSave={saveSetup} onDelete={(id) => deleteRow('trade_setups', id, setSetups)} />}{tab === 'playbooks' && <PlaybookManager strategies={strategies} playbooks={playbooks} onSave={savePlaybook} onDelete={(id) => deleteRow('playbooks', id, setPlaybooks)} />}{tab === 'checklists' && <ChecklistManager templates={checklists} onSave={saveChecklist} onDelete={(id) => deleteRow('checklist_templates', id, setChecklists)} />}{tab === 'performance' && <StrategyPerformance strategy={selected} trades={trades} />}{tab === 'history' && <VersionHistory versions={versions} onView={(version) => window.alert(JSON.stringify(version.snapshot, null, 2))} />}{tab === 'attachments' && <StrategyAttachments strategy={selected} attachments={attachments} onAdd={addAttachment} onDelete={(id) => deleteRow('strategy_attachments', id, setAttachments)} />}{tab === 'ai' && <StrategyAIPlaceholders />}</>}</div>;
}
