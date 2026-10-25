'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Plus, X, Loader2 } from 'lucide-react';
import { supabase, type DailyChecklist, type ChecklistItem } from '@/lib/supabase';
import { DashboardWidget } from '@/components/dashboard/widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const DEFAULT_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'risk-defined', label: 'Risk per trade defined' },
  { id: 'trading-plan', label: 'Trading plan reviewed' },
  { id: 'no-revenge', label: 'No revenge trading' },
  { id: 'journal-complete', label: 'Journal entries complete' },
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function makeItems(overrides?: ChecklistItem[]): ChecklistItem[] {
  const base: ChecklistItem[] = DEFAULT_ITEMS.map((d) => ({ ...d, checked: false }));
  if (!overrides || overrides.length === 0) return base;
  const byId = new Map(overrides.map((o) => [o.id, o]));
  const merged = base.map((b) => byId.get(b.id) ?? b);
  const extra = overrides.filter((o) => !byId.has(o.id) && !DEFAULT_ITEMS.some((d) => d.id === o.id));
  return [...merged, ...extra];
}

export function DailyChecklistWidget() {
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>(makeItems());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    setError(false);
    const today = todayStr();
    const { data, error: qErr } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('checklist_date', today)
      .maybeSingle();

    if (qErr) {
      logger.error('Checklist', 'Load failed', { error: qErr.message });
      setError(true);
      setLoading(false);
      return;
    }

    if (data) {
      setChecklist(data as DailyChecklist);
      setItems(makeItems((data as DailyChecklist).items as ChecklistItem[]));
    } else {
      setChecklist(null);
      setItems(makeItems());
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (nextItems: ChecklistItem[]) => {
    setSaving(true);
    const today = todayStr();
    if (checklist) {
      const { data, error: uErr } = await supabase
        .from('daily_checklists')
        .update({ items: nextItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
        .select('*')
        .maybeSingle();
      if (uErr) {
        logger.error('Checklist', 'Update failed', { error: uErr.message });
      } else if (data) {
        setChecklist(data as DailyChecklist);
      }
    } else {
      const { data, error: iErr } = await supabase
        .from('daily_checklists')
        .insert({ checklist_date: today, items: nextItems })
        .select('*')
        .maybeSingle();
      if (iErr) {
        logger.error('Checklist', 'Insert failed', { error: iErr.message });
      } else if (data) {
        setChecklist(data as DailyChecklist);
      }
    }
    setSaving(false);
  }, [checklist]);

  const toggle = (id: string) => {
    const next = items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it));
    setItems(next);
    persist(next);
  };

  const removeItem = (id: string) => {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    persist(next);
  };

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    const item: ChecklistItem = { id: `custom-${Date.now()}`, label, checked: false };
    const next = [...items, item];
    setItems(next);
    setNewLabel('');
    setAdding(false);
    persist(next);
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const allDone = totalCount > 0 && checkedCount === totalCount;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <DashboardWidget title="Daily Checklist" description="Pre-trade discipline" icon={CheckCircle2}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget title="Daily Checklist" description="Pre-trade discipline" icon={CheckCircle2}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Couldn't load your checklist.</p>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget
      title="Daily Checklist"
      description={allDone ? 'All done — great discipline today' : `${checkedCount} of ${totalCount} completed`}
      icon={CheckCircle2}
      action={
        <button
          onClick={() => setAdding(true)}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Add item"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', allDone ? 'bg-success' : 'bg-primary')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2.5 py-1.5 cursor-pointer rounded-md hover:bg-secondary/40 transition-colors px-1"
              onClick={() => toggle(item.id)}
            >
              {item.checked ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-success transition-transform" />
              ) : (
                <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-sm flex-1 transition-all',
                  item.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                )}
              >
                {item.label}
              </span>
              {item.id.startsWith('custom-') && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new item */}
        {adding && (
          <div className="flex items-center gap-2 pt-1">
            <Input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') { setAdding(false); setNewLabel(''); } }}
              placeholder="New checklist item…"
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={addItem} disabled={!newLabel.trim()}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewLabel(''); }}>Cancel</Button>
          </div>
        )}

        {saving && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}
