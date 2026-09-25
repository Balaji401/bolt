'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Shield, Settings2, Calculator, BarChart3, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import type { Trade, RiskRules } from '@/lib/supabase';
import { computeMetrics } from '@/lib/analytics';
import { computeRiskMetrics, getDefaultRules } from '@/lib/risk';
import { useWorkspace } from '@/components/workspace-provider';
import { supabase } from '@/lib/supabase';
import { AnalyticsFilters } from '@/components/analytics/filters';
import { filterTrades, type FilterOptions } from '@/lib/analytics';
import { EmptyState } from '@/components/feedback/state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RiskDashboard } from '@/components/risk/risk-dashboard';
import { RiskRulesEditor } from '@/components/risk/risk-rules';
import { RiskCalculator } from '@/components/risk/risk-calculator';
import { DrawdownAnalysis } from '@/components/risk/drawdown-analysis';
import { AdvancedStatistics } from '@/components/risk/advanced-statistics';
import { TradingBehavior } from '@/components/risk/trading-behavior';
import { RiskAlertsPanel } from '@/components/risk/risk-alerts';
import { RiskAiPlaceholders } from '@/components/risk/risk-ai-placeholders';

type WidgetId = 'dashboard' | 'calculator' | 'rules' | 'drawdown' | 'advanced' | 'behavior' | 'alerts' | 'ai';

const WIDGET_LABELS: Record<WidgetId, string> = {
  dashboard: 'Risk Dashboard',
  calculator: 'Risk Calculator',
  rules: 'Risk Rules',
  drawdown: 'Drawdown Analysis',
  advanced: 'Advanced Statistics',
  behavior: 'Trading Behavior',
  alerts: 'Risk Alerts',
  ai: 'AI Risk (Preview)',
};

const DEFAULT_WIDGETS: { id: WidgetId; visible: boolean; order: number }[] = [
  { id: 'dashboard', visible: true, order: 0 },
  { id: 'alerts', visible: true, order: 1 },
  { id: 'calculator', visible: true, order: 2 },
  { id: 'drawdown', visible: true, order: 3 },
  { id: 'advanced', visible: true, order: 4 },
  { id: 'behavior', visible: true, order: 5 },
  { id: 'rules', visible: true, order: 6 },
  { id: 'ai', visible: true, order: 7 },
];

const STORAGE_KEY = 'traderos-risk-widgets';

export function RiskManagement({ trades }: { trades: Trade[] }) {
  const { workspace, activeAccount } = useWorkspace();
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: null, dateTo: null, instrument: null, market: null,
    strategy: null, session: null, direction: null, setupType: null,
    tags: [], timeframe: null,
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [rules, setRules] = useState<RiskRules>(getDefaultRules());
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);

  // Load risk rules
  const loadRules = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase
      .from('risk_rules')
      .select('*')
      .eq('workspace_id', workspace.id)
      .maybeSingle();
    if (data) setRules(data as RiskRules);
    else setRules({ ...getDefaultRules(), workspace_id: workspace.id, user_id: workspace.user_id });
  }, [workspace]);

  useEffect(() => { loadRules(); }, [loadRules]);

  // Load widget preferences
  useEffect(() => {
    const key = workspace ? `${STORAGE_KEY}-${workspace.id}` : STORAGE_KEY;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = DEFAULT_WIDGETS.map((dw) => parsed.find((p: any) => p.id === dw.id) || dw);
        setWidgets(merged.sort((a, b) => a.order - b.order));
      }
    } catch {}
  }, [workspace]);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);
  const metrics = useMemo(() => computeMetrics(filteredTrades), [filteredTrades]);
  const accountBalance = activeAccount ? Number(activeAccount.current_balance) : 10000;
  const riskMetrics = useMemo(() => computeRiskMetrics(filteredTrades, accountBalance, rules, metrics), [filteredTrades, accountBalance, rules, metrics]);

  const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  const toggleWidget = (id: WidgetId) => {
    const updated = widgets.map((w) => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    const key = workspace ? `${STORAGE_KEY}-${workspace.id}` : STORAGE_KEY;
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  };

  const reorderWidget = (id: WidgetId, direction: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const updated = sorted.map((w, i) => {
      if (i === idx) return { ...w, order: sorted[swapIdx].order };
      if (i === swapIdx) return { ...w, order: sorted[idx].order };
      return w;
    });
    setWidgets(updated);
    const key = workspace ? `${STORAGE_KEY}-${workspace.id}` : STORAGE_KEY;
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    const key = workspace ? `${STORAGE_KEY}-${workspace.id}` : STORAGE_KEY;
    try { localStorage.removeItem(key); } catch {}
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'dashboard': return <RiskDashboard metrics={riskMetrics} rules={rules} accountBalance={accountBalance} />;
      case 'alerts': return <RiskAlertsPanel metrics={riskMetrics} rules={rules} trades={filteredTrades} />;
      case 'calculator': return <RiskCalculator />;
      case 'drawdown': return <DrawdownAnalysis metrics={riskMetrics} />;
      case 'advanced': return <AdvancedStatistics metrics={riskMetrics} />;
      case 'behavior': return <TradingBehavior metrics={riskMetrics} />;
      case 'rules': return <RiskRulesEditor onSaved={(r) => setRules(r)} />;
      case 'ai': return <RiskAiPlaceholders />;
    }
  };

  if (!activeAccount && trades.length === 0) {
    return <EmptyState icon={Shield} title="Risk Management" description="Connect a trading account to start tracking account risk and drawdown." />;
  }

  if (activeAccount && filteredTrades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Account connected</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">Risk analytics will appear after your first trade.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Start logging trades to build your account risk profile, drawdown history, and risk consistency view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Risk Management</h2>
          <p className="text-xs text-muted-foreground">{filteredTrades.length} trades · Account: {activeAccount?.account_name || 'Default'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCustomize(!showCustomize)}>
          <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Customize
        </Button>
      </div>

      {/* Customize Panel */}
      {showCustomize && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Widget Layout</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetLayout}><RotateCcw className="w-3 h-3 mr-1" /> Reset</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {widgets.map((w, i) => (
                <div key={w.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <button onClick={() => toggleWidget(w.id)} className="shrink-0">
                      {w.visible ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <span className={cn('text-xs font-medium truncate', !w.visible && 'text-muted-foreground line-through')}>{WIDGET_LABELS[w.id]}</span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => reorderWidget(w.id, 'up')} disabled={i === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => reorderWidget(w.id, 'down')} disabled={i === widgets.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <AnalyticsFilters trades={trades} filters={filters} onChange={setFilters} />

      {/* Widgets */}
      {filteredTrades.length === 0 ? (
        <EmptyState icon={BarChart3} title="No trades match your filters" description="Try adjusting or clearing your filters to see more data." />
      ) : (
        <div className="space-y-6">
          {visibleWidgets.map((w) => (
            <div key={w.id}>{renderWidget(w.id)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
