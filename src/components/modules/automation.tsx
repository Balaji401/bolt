'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Zap, Bell, Plus, Play, Pause, Trash2, RefreshCw, Eye, Clock,
  AlertTriangle, CheckCircle2, XCircle, Settings2, History, X,
  ChevronUp, ChevronDown, Filter, Mail, Smartphone, Monitor, BellOff,
  FileText, Brain, BookOpen, Target, CheckSquare, CalendarClock, LayoutTemplate,
} from 'lucide-react';
import type { Automation, AutomationExecution, NotificationRecord, NotificationPreference, AutomationTriggerType, AutomationActionType, AutomationCondition } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import {
  TRIGGERS, ACTIONS, CONDITION_FIELDS, CONDITION_OPERATORS,
  AUTOMATION_TEMPLATES, NOTIFICATION_CATEGORIES, PRIORITY_LEVELS,
  computeNextRun, executeAutomation, retryExecution,
  type AutomationTemplate,
} from '@/lib/automation';
import { formatDate, formatDateTime } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

type AutoTab = 'dashboard' | 'builder' | 'history' | 'templates' | 'notifications' | 'preferences';

const TABS: { id: AutoTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Zap },
  { id: 'builder', label: 'Builder', icon: Plus },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'history', label: 'History', icon: History },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Settings2 },
];

const TRIGGER_LABELS: Record<string, string> = Object.fromEntries(TRIGGERS.map((t) => [t.value, t.label]));
const ACTION_LABELS: Record<string, string> = Object.fromEntries(ACTIONS.map((a) => [a.value, a.label]));
const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  send_notification: Bell, create_reminder: Clock, generate_report: FileText,
  start_ai_review: Brain, add_journal_reminder: BookOpen, update_goal_status: Target, create_task: CheckSquare,
};

const PRIORITY_STYLES = {
  critical: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-warning/30 bg-warning/5 text-warning',
  info: 'border-primary/20 bg-primary/5 text-primary',
};

export function Automation() {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<AutoTab>('dashboard');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    setLoading(true); setError(false);
    try {
      const [autoRes, execRes, notifRes, prefRes] = await Promise.all([
        supabase.from('automations').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
        supabase.from('automation_executions').select('*').eq('workspace_id', workspace.id).order('executed_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('notification_preferences').select('*').eq('workspace_id', workspace.id),
      ]);
      setAutomations((autoRes.data || []) as Automation[]);
      setExecutions((execRes.data || []) as AutomationExecution[]);
      setNotifications((notifRes.data || []) as NotificationRecord[]);
      setPreferences((prefRes.data || []) as NotificationPreference[]);
      setLoading(false);
    } catch {
      setError(true); setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { load(); }, [load]);

  const activeAutomations = automations.filter((a) => a.status === 'active');
  const pausedAutomations = automations.filter((a) => a.status === 'paused');
  const recentExecutions = executions.slice(0, 10);
  const failedExecutions = executions.filter((e) => e.status === 'failed');
  const unreadNotifications = notifications.filter((n) => !n.read && !n.archived);

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'paused' : 'active';
    await supabase.from('automations').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus as 'active' | 'paused' } : a));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleRunNow = async (automation: Automation) => {
    await executeAutomation(automation);
    await load();
  };

  const handleRetry = async (execution: AutomationExecution) => {
    const automation = automations.find((a) => a.id === execution.automation_id);
    if (automation) { await retryExecution(execution, automation); await load(); }
  };

  const handleMarkRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n));
  };

  const handleArchive = async (id: string) => {
    await supabase.from('notifications').update({ archived: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, archived: true } : n));
  };

  const handleDeleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    await supabase.from('notifications').update({ read: true, read_at: new Date().toISOString() }).in('id', unread.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSaveAutomation = async (data: Partial<Automation>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !workspace) return;
    if (editingAutomation) {
      await supabase.from('automations').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingAutomation.id);
    } else {
      const nextRun = computeNextRun(data.trigger_type as AutomationTriggerType, data.trigger_config || {}, workspace.default_timezone);
      await supabase.from('automations').insert({
        user_id: user.id, workspace_id: workspace.id,
        name: data.name || 'Untitled Automation',
        description: data.description || null,
        trigger_type: data.trigger_type || 'trade_closed',
        trigger_config: data.trigger_config || {},
        conditions: data.conditions || [],
        condition_logic: data.condition_logic || 'and',
        action_type: data.action_type || 'send_notification',
        action_config: data.action_config || {},
        schedule_config: data.schedule_config || {},
        status: 'active',
        next_run_at: nextRun,
      });
    }
    setEditingAutomation(null);
    setTab('dashboard');
    await load();
  };

  const handleUseTemplate = async (template: AutomationTemplate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !workspace) return;
    const nextRun = computeNextRun(template.trigger_type, template.trigger_config, workspace.default_timezone);
    await supabase.from('automations').insert({
      user_id: user.id, workspace_id: workspace.id,
      name: template.name, description: template.description,
      trigger_type: template.trigger_type, trigger_config: template.trigger_config,
      conditions: template.conditions, condition_logic: 'and',
      action_type: template.action_type, action_config: template.action_config,
      schedule_config: template.schedule_config, status: 'active',
      next_run_at: nextRun,
    });
    await load();
    setTab('dashboard');
  };

  const handleUpdatePreference = async (id: string, updates: Partial<NotificationPreference>) => {
    await supabase.from('notification_preferences').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    setPreferences((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  };

  const handleEnsurePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !workspace) return;
    for (const cat of NOTIFICATION_CATEGORIES) {
      const exists = preferences.find((p) => p.category === cat.value);
      if (!exists) {
        const { data } = await supabase.from('notification_preferences').insert({
          user_id: user.id, workspace_id: workspace.id, category: cat.value,
        }).select().single();
        if (data) setPreferences((prev) => [...prev, data as NotificationPreference]);
      }
    }
  };

  if (loading) return <LoadingState label="Loading automation…" />;
  if (error) return <ErrorState title="Could not load automation" description="Your automation data could not be loaded." onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Automation & Notifications</h2>
          <p className="text-sm text-muted-foreground">Create rules that trigger notifications and actions based on your trading events.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border pb-px">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors', tab === item.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
            <item.icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{item.label}</span>
            {item.id === 'notifications' && unreadNotifications.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive text-white text-[9px] font-bold">{unreadNotifications.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Zap} label="Active" value={activeAutomations.length} color="text-success" />
            <StatCard icon={Pause} label="Paused" value={pausedAutomations.length} color="text-muted-foreground" />
            <StatCard icon={CheckCircle2} label="Executions" value={executions.filter((e) => e.status === 'success').length} color="text-primary" />
            <StatCard icon={XCircle} label="Failed" value={failedExecutions.length} color="text-destructive" />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Your Automations</h3>
            <Button size="sm" onClick={() => { setEditingAutomation(null); setTab('builder'); }}><Plus className="w-3.5 h-3.5 mr-1.5" />New Automation</Button>
          </div>

          {automations.length === 0 ? (
            <EmptyState icon={Zap} title="No automations yet" description="Create your first automation or activate a template to get started." />
          ) : (
            <div className="space-y-2">
              {automations.map((a) => {
                const ActionIcon = ACTION_ICONS[a.action_type] || Bell;
                return (
                  <Card key={a.id} className="hover:border-primary/20 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn('p-2 rounded-lg shrink-0', a.status === 'active' ? 'bg-success/10' : 'bg-secondary')}>
                            <ActionIcon className={cn('w-4 h-4', a.status === 'active' ? 'text-success' : 'text-muted-foreground')} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{a.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {TRIGGER_LABELS[a.trigger_type] || a.trigger_type} → {ACTION_LABELS[a.action_type] || a.action_type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={cn('text-[9px]', a.status === 'active' ? 'text-success' : 'text-muted-foreground')}>{a.status}</Badge>
                          {a.last_run_at && <span className="text-[9px] text-muted-foreground hidden md:inline">Last: {formatDate(a.last_run_at)}</span>}
                          <button onClick={() => handleRunNow(a)} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Run now"><Play className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => handleToggleStatus(a.id, a.status)} className="p-1.5 rounded hover:bg-secondary transition-colors" title={a.status === 'active' ? 'Pause' : 'Resume'}>
                            {a.status === 'active' ? <Pause className="w-3.5 h-3.5 text-muted-foreground" /> : <Play className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                          <button onClick={() => { setEditingAutomation(a); setTab('builder'); }} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Edit"><Settings2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {recentExecutions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4 text-primary" />Recent Executions</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {recentExecutions.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    {e.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> : e.status === 'failed' ? <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="text-muted-foreground truncate flex-1">{TRIGGER_LABELS[e.trigger_type] || e.trigger_type}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(e.executed_at)}</span>
                    <Badge variant="outline" className="text-[9px]">{e.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'builder' && (
        <AutomationBuilder
          editing={editingAutomation}
          onSave={handleSaveAutomation}
          onCancel={() => { setEditingAutomation(null); setTab('dashboard'); }}
        />
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Activate a pre-built automation template. You can customize it after activation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AUTOMATION_TEMPLATES.map((t, i) => {
              const ActionIcon = ACTION_ICONS[t.action_type] || Bell;
              return (
                <Card key={i} className="hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0"><ActionIcon className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t.name}</div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-[9px]">{TRIGGER_LABELS[t.trigger_type] || t.trigger_type}</Badge>
                          <Badge variant="outline" className="text-[9px]">{ACTION_LABELS[t.action_type] || t.action_type}</Badge>
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => handleUseTemplate(t)}><Plus className="w-3 h-3 mr-1" />Activate</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <ExecutionHistory executions={executions} automations={automations} onRetry={handleRetry} />
      )}

      {tab === 'notifications' && (
        <NotificationCenter
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onArchive={handleArchive}
          onDelete={handleDeleteNotification}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {tab === 'preferences' && (
        <NotificationPreferences
          preferences={preferences}
          onUpdate={handleUpdatePreference}
          onEnsure={handleEnsurePreferences}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', color)} />
          <div>
            <div className="text-lg font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AutomationBuilder({ editing, onSave, onCancel }: { editing: Automation | null; onSave: (data: Partial<Automation>) => void; onCancel: () => void }) {
  const [name, setName] = useState(editing?.name || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(editing?.trigger_type || 'trade_closed');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(editing?.trigger_config || {});
  const [conditions, setConditions] = useState<AutomationCondition[]>(editing?.conditions || []);
  const [conditionLogic, setConditionLogic] = useState<'and' | 'or'>(editing?.condition_logic || 'and');
  const [actionType, setActionType] = useState<AutomationActionType>(editing?.action_type || 'send_notification');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>(editing?.action_config || {});
  const [scheduleConfig, setScheduleConfig] = useState<Record<string, unknown>>(editing?.schedule_config || {});

  const isSchedule = triggerType.startsWith('schedule_');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />{editing ? 'Edit Automation' : 'New Automation'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daily Loss Alert" className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this automation do?" className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">WHEN — Trigger</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TRIGGERS.map((t) => (
              <button key={t.value} onClick={() => setTriggerType(t.value)} className={cn('flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors', triggerType === t.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50')}>
                <span className="text-xs font-medium">{t.label}</span>
                <span className="text-[10px] text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
          {isSchedule && (
            <div className="space-y-2 p-3 rounded-lg bg-secondary/30">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Schedule Configuration</div>
              {triggerType === 'schedule_daily' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Time</label>
                  <input type="time" value={(scheduleConfig.time as string) || '08:00'} onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })} className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                </div>
              )}
              {triggerType === 'schedule_weekly' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Day</label>
                    <select value={(scheduleConfig.day as string) || 'monday'} onChange={(e) => setScheduleConfig({ ...scheduleConfig, day: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                      {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Time</label>
                    <input type="time" value={(scheduleConfig.time as string) || '08:00'} onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                  </div>
                </div>
              )}
              {triggerType === 'schedule_monthly' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Day of Month</label>
                  <input type="number" min={1} max={31} value={(scheduleConfig.day as number) || 1} onChange={(e) => setScheduleConfig({ ...scheduleConfig, day: Number(e.target.value) })} className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                </div>
              )}
              {triggerType === 'schedule_specific' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Date</label>
                    <input type="date" value={(scheduleConfig.date as string) || ''} onChange={(e) => setScheduleConfig({ ...scheduleConfig, date: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Time</label>
                    <input type="time" value={(scheduleConfig.time as string) || '08:00'} onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                  </div>
                </div>
              )}
            </div>
          )}
          {!isSchedule && (triggerType === 'drawdown_threshold' || triggerType === 'goal_deadline_approaching') && (
            <div className="p-3 rounded-lg bg-secondary/30">
              {triggerType === 'drawdown_threshold' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Drawdown Threshold (%)</label>
                  <input type="number" value={(triggerConfig.threshold as number) || 10} onChange={(e) => setTriggerConfig({ ...triggerConfig, threshold: Number(e.target.value) })} className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                </div>
              )}
              {triggerType === 'goal_deadline_approaching' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Days Before Deadline</label>
                  <input type="number" value={(triggerConfig.days_before as number) || 3} onChange={(e) => setTriggerConfig({ ...triggerConfig, days_before: Number(e.target.value) })} className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-primary" />CONDITIONS (optional)</CardTitle>
            <div className="flex items-center gap-1">
              <button onClick={() => setConditionLogic('and')} className={cn('px-2 py-0.5 text-[10px] rounded border', conditionLogic === 'and' ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>AND</button>
              <button onClick={() => setConditionLogic('or')} className={cn('px-2 py-0.5 text-[10px] rounded border', conditionLogic === 'or' ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>OR</button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {conditions.length === 0 && <p className="text-xs text-muted-foreground">No conditions — this automation will always trigger when the event fires.</p>}
          {conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={c.field} onChange={(e) => setConditions(conditions.map((cc, idx) => idx === i ? { ...cc, field: e.target.value } : cc))} className="px-2 py-1.5 text-xs rounded-lg border border-border bg-background">
                {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <select value={c.operator} onChange={(e) => setConditions(conditions.map((cc, idx) => idx === i ? { ...cc, operator: e.target.value } : cc))} className="px-2 py-1.5 text-xs rounded-lg border border-border bg-background">
                {CONDITION_OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input type="text" value={String(c.value)} onChange={(e) => setConditions(conditions.map((cc, idx) => idx === i ? { ...cc, value: e.target.value } : cc))} className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-border bg-background" />
              <button onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setConditions([...conditions, { field: 'instrument', operator: 'eq', value: '' }])}><Plus className="w-3 h-3 mr-1" />Add Condition</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">DO THIS — Action</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ACTIONS.map((a) => {
              const Icon = ACTION_ICONS[a.value] || Bell;
              return (
                <button key={a.value} onClick={() => setActionType(a.value)} className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors', actionType === a.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50')}>
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium">{a.label}</div>
                    <div className="text-[10px] text-muted-foreground">{a.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {actionType === 'send_notification' && (
            <div className="space-y-2 p-3 rounded-lg bg-secondary/30">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Priority</label>
                <select value={(actionConfig.priority as string) || 'info'} onChange={(e) => setActionConfig({ ...actionConfig, priority: e.target.value })} className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                  {PRIORITY_LEVELS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Category</label>
                <select value={(actionConfig.category as string) || 'system'} onChange={(e) => setActionConfig({ ...actionConfig, category: e.target.value })} className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background">
                  {NOTIFICATION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Custom Message (optional)</label>
                <input type="text" value={(actionConfig.message as string) || ''} onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })} placeholder="Leave blank to use automation name" className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={() => onSave({ name, description, trigger_type: triggerType, trigger_config: triggerConfig, conditions, condition_logic: conditionLogic, action_type: actionType, action_config: actionConfig, schedule_config: scheduleConfig })}>
          {editing ? 'Update' : 'Create'} Automation
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ExecutionHistory({ executions, automations, onRetry }: { executions: AutomationExecution[]; automations: Automation[]; onRetry: (e: AutomationExecution) => void }) {
  if (executions.length === 0) return <EmptyState icon={History} title="No executions yet" description="Automation execution history will appear here once automations run." />;
  return (
    <div className="space-y-2">
      {executions.map((e) => {
        const auto = automations.find((a) => a.id === e.automation_id);
        return (
          <Card key={e.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {e.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : e.status === 'failed' ? <XCircle className="w-4 h-4 text-destructive shrink-0" /> : e.status === 'skipped' ? <Clock className="w-4 h-4 text-muted-foreground shrink-0" /> : <RefreshCw className="w-4 h-4 text-primary shrink-0 animate-spin" />}
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{auto?.name || 'Unknown Automation'}</div>
                    <div className="text-[10px] text-muted-foreground">{TRIGGER_LABELS[e.trigger_type] || e.trigger_type} • {formatDateTime(e.executed_at)} • {e.duration_ms}ms</div>
                    {e.error && <div className="text-[10px] text-destructive truncate mt-0.5">{e.error}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className={cn('text-[9px]', e.status === 'success' ? 'text-success' : e.status === 'failed' ? 'text-destructive' : 'text-muted-foreground')}>{e.status}</Badge>
                  {e.status === 'failed' && <button onClick={() => onRetry(e)} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Retry"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function NotificationCenter({ notifications, onMarkRead, onArchive, onDelete, onMarkAllRead }: {
  notifications: NotificationRecord[];
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && (n.read || n.archived)) return false;
    if (filter === 'archived' && !n.archived) return false;
    if (filter === 'all' && n.archived) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {(['all', 'unread', 'archived'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('px-2.5 py-1 text-xs rounded-lg border transition-colors', filter === f ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground hover:bg-secondary/50')}>{f}</button>
          ))}
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background">
            <option value="all">All Categories</option>
            {NOTIFICATION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={onMarkAllRead}><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Mark All Read</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up. Notifications will appear here when automations trigger." />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className={cn('transition-colors', !n.read && 'border-primary/30')}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className={cn('w-1 self-stretch rounded-full shrink-0', n.priority === 'critical' ? 'bg-destructive' : n.priority === 'warning' ? 'bg-warning' : 'bg-primary/30')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-xs font-medium', !n.read && 'font-bold')}>{n.title}</span>
                      <Badge variant="outline" className={cn('text-[9px]', PRIORITY_STYLES[n.priority])}>{n.priority}</Badge>
                      <Badge variant="outline" className="text-[9px]">{n.category}</Badge>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {!n.read && <button onClick={() => onMarkRead(n.id)} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Mark read"><CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" /></button>}
                    <button onClick={() => onArchive(n.id)} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Archive"><Clock className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => onDelete(n.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
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

function NotificationPreferences({ preferences, onUpdate, onEnsure }: {
  preferences: NotificationPreference[];
  onUpdate: (id: string, updates: Partial<NotificationPreference>) => void;
  onEnsure: () => void;
}) {
  useEffect(() => { onEnsure(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">Configure which notifications you receive and through which channels. Push notifications are future-ready.</p>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-center p-3 font-medium text-muted-foreground"><Monitor className="w-3.5 h-3.5 mx-auto" /></th>
                <th className="text-center p-3 font-medium text-muted-foreground"><Mail className="w-3.5 h-3.5 mx-auto" /></th>
                <th className="text-center p-3 font-medium text-muted-foreground"><Smartphone className="w-3.5 h-3.5 mx-auto" /></th>
                <th className="text-left p-3 font-medium text-muted-foreground">Min Priority</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const pref = preferences.find((p) => p.category === cat.value);
                return (
                  <tr key={cat.value} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-3 font-medium">{cat.label}</td>
                    <td className="p-3 text-center">
                      <Toggle checked={pref?.in_app_enabled ?? true} onChange={(v) => pref && onUpdate(pref.id, { in_app_enabled: v })} />
                    </td>
                    <td className="p-3 text-center">
                      <Toggle checked={pref?.email_enabled ?? false} onChange={(v) => pref && onUpdate(pref.id, { email_enabled: v })} />
                    </td>
                    <td className="p-3 text-center">
                      <Toggle checked={pref?.push_enabled ?? false} onChange={(v) => pref && onUpdate(pref.id, { push_enabled: v })} />
                    </td>
                    <td className="p-3">
                      <select value={pref?.min_priority || 'info'} onChange={(e) => pref && onUpdate(pref.id, { min_priority: e.target.value as NotificationPreference['min_priority'] })} className="px-2 py-1 text-xs rounded border border-border bg-background">
                        {PRIORITY_LEVELS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={cn('relative w-9 h-5 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-secondary')}>
      <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform', checked ? 'left-4' : 'left-0.5')} />
    </button>
  );
}
