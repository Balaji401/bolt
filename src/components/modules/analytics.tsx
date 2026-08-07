'use client';
import { useMemo, useState, useRef } from 'react';
import { BarChart3, Download, Settings2, RotateCcw, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import type { Trade } from '@/lib/supabase';
import { computeMetrics, filterTrades, type FilterOptions } from '@/lib/analytics';
import { useDashboardPrefs, type WidgetId } from '@/lib/dashboard-prefs';
import { exportTradesCSV, exportMetricsCSV, exportTradesExcel, exportPDF } from '@/lib/export';
import { EmptyState } from '@/components/feedback/state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalyticsFilters } from '@/components/analytics/filters';
import { SummaryCards } from '@/components/analytics/summary-cards';
import { EquityCurve } from '@/components/analytics/equity-curve';
import { PerformanceCharts } from '@/components/analytics/performance-charts';
import { PerformanceBreakdown } from '@/components/analytics/breakdown';
import { RecentPerformance } from '@/components/analytics/recent-performance';
import { AiPlaceholders } from '@/components/analytics/ai-placeholders';
import { ComparisonTools } from '@/components/analytics/comparison-tools';

const WIDGET_LABELS: Record<WidgetId, string> = {
  summary: 'Summary Cards',
  equity: 'Equity Curve',
  dailyPnl: 'P&L Charts',
  winLoss: 'Win/Loss & Direction',
  profitDist: 'Profit Distribution',
  tradeFreq: 'Trade Frequency',
  sessionPerf: 'Session Performance',
  dayOfWeek: 'Day of Week',
  hourOfDay: 'Hour of Day',
  instrumentPerf: 'Instrument Performance',
  directionPerf: 'Direction Performance',
  recentPerf: 'Recent Performance',
  breakdown: 'Performance Breakdown',
  aiPlaceholders: 'AI Insights (Preview)',
  comparison: 'Comparison Tools (Preview)',
};

export function Analytics({ trades }: { trades: Trade[] }) {
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: null, dateTo: null, instrument: null, market: null,
    strategy: null, session: null, direction: null, setupType: null,
    tags: [], timeframe: null,
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { widgets, visibleWidgets, toggleWidget, reorderWidget, resetLayout } = useDashboardPrefs();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters]);
  const metrics = useMemo(() => computeMetrics(filteredTrades), [filteredTrades]);

  if (trades.length === 0) {
    return <EmptyState icon={BarChart3} title="No analytics yet" description="Add trades to see detailed performance analytics." />;
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv') {
      exportTradesCSV(filteredTrades);
      exportMetricsCSV(metrics, 'traderos-metrics');
    } else if (format === 'excel') {
      exportTradesExcel(filteredTrades);
    } else if (format === 'pdf' && dashboardRef.current) {
      exportPDF('TraderOS Performance Report', dashboardRef.current, 'traderos-report');
    }
    setShowExport(false);
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'summary': return <SummaryCards metrics={metrics} />;
      case 'recentPerf': return <RecentPerformance trades={filteredTrades} />;
      case 'equity': return <EquityCurve metrics={metrics} />;
      case 'dailyPnl': return <PerformanceCharts metrics={metrics} />;
      case 'breakdown': return <PerformanceBreakdown metrics={metrics} />;
      case 'aiPlaceholders': return <AiPlaceholders />;
      case 'comparison': return <ComparisonTools />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Performance Dashboard</h2>
          <p className="text-xs text-muted-foreground">{filteredTrades.length} trades analyzed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export
            </Button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-border bg-popover shadow-lg p-1 min-w-[140px]">
                <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary rounded-md transition-colors">Export as CSV</button>
                <button onClick={() => handleExport('excel')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary rounded-md transition-colors">Export as Excel</button>
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary rounded-md transition-colors">Export as PDF</button>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCustomize(!showCustomize)}>
            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Customize
          </Button>
        </div>
      </div>

      {/* Customize Panel */}
      {showCustomize && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Dashboard Layout</CardTitle>
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
