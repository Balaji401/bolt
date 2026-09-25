'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { logger } from '@/lib/logger';

export type WidgetId =
  | 'summary' | 'equity' | 'dailyPnl' | 'winLoss' | 'profitDist' | 'tradeFreq'
  | 'sessionPerf' | 'dayOfWeek' | 'hourOfDay' | 'instrumentPerf' | 'directionPerf'
  | 'recentPerf' | 'breakdown' | 'aiPlaceholders' | 'comparison';

export type WidgetConfig = {
  id: WidgetId;
  visible: boolean;
  order: number;
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'summary', visible: true, order: 0 },
  { id: 'recentPerf', visible: true, order: 1 },
  { id: 'equity', visible: true, order: 2 },
  { id: 'dailyPnl', visible: true, order: 3 },
  { id: 'winLoss', visible: true, order: 4 },
  { id: 'profitDist', visible: true, order: 5 },
  { id: 'tradeFreq', visible: true, order: 6 },
  { id: 'sessionPerf', visible: true, order: 7 },
  { id: 'dayOfWeek', visible: true, order: 8 },
  { id: 'hourOfDay', visible: true, order: 9 },
  { id: 'instrumentPerf', visible: true, order: 10 },
  { id: 'directionPerf', visible: true, order: 11 },
  { id: 'breakdown', visible: true, order: 12 },
  { id: 'aiPlaceholders', visible: true, order: 13 },
  { id: 'comparison', visible: true, order: 14 },
];

const STORAGE_KEY = 'traderos-dashboard-widgets';

function sortWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  return [...widgets].sort((a, b) => a.order - b.order);
}

export function useDashboardPrefs() {
  const { workspace } = useWorkspace();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [loading, setLoading] = useState(true);

  const storageKey = workspace ? `${STORAGE_KEY}-${workspace.id}` : STORAGE_KEY;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetConfig[];
        const merged = DEFAULT_WIDGETS.map((dw) => {
          const found = parsed.find((p) => p.id === dw.id);
          return found || dw;
        });
        setWidgets(sortWidgets(merged));
      } else {
        setWidgets(sortWidgets(DEFAULT_WIDGETS));
      }
    } catch {
      setWidgets(sortWidgets(DEFAULT_WIDGETS));
    }
    setLoading(false);
  }, [storageKey]);

  const toggleWidget = useCallback((id: WidgetId) => {
    setWidgets((prev) => {
      const updated = prev.map((w) => w.id === id ? { ...w, visible: !w.visible } : w);
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [storageKey]);

  const reorderWidget = useCallback((id: WidgetId, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const sorted = sortWidgets(prev);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const updated = sorted.map((w, i) => {
        if (i === idx) return { ...w, order: sorted[swapIdx].order };
        if (i === swapIdx) return { ...w, order: sorted[idx].order };
        return w;
      });
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [storageKey]);

  const resetLayout = useCallback(() => {
    setWidgets(sortWidgets(DEFAULT_WIDGETS));
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  const visibleWidgets = sortWidgets(widgets).filter((w) => w.visible);

  return { widgets: sortWidgets(widgets), visibleWidgets, toggleWidget, reorderWidget, resetLayout, loading };
}
