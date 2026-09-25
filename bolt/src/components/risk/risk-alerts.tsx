'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, AlertTriangle, Info, AlertOctagon, Trash2 } from 'lucide-react';
import { supabase, type RiskAlert, type RiskRules } from '@/lib/supabase';
import { useWorkspace } from '@/components/workspace-provider';
import { generateRiskAlerts, type RiskAlertInput } from '@/lib/risk';
import type { Trade } from '@/lib/supabase';
import type { RiskMetrics } from '@/lib/risk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';

export function RiskAlertsPanel({ metrics, rules, trades }: { metrics: RiskMetrics; rules: RiskRules; trades: Trade[] }) {
  const { workspace } = useWorkspace();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    if (!workspace) return;
    const { data } = await supabase
      .from('risk_alerts')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setAlerts((data || []) as RiskAlert[]);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Generate current alerts from live data
  const liveAlerts = generateRiskAlerts(metrics, rules, trades);

  const acknowledge = async (id: string) => {
    await supabase.from('risk_alerts').update({ acknowledged: true }).eq('id', id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const dismissLive = (index: number) => {
    // Live alerts are ephemeral; just filter them visually
    // In a real implementation, these would be persisted
  };

  const clearAll = async () => {
    if (!workspace) return;
    await supabase.from('risk_alerts').delete().eq('workspace_id', workspace.id).eq('acknowledged', true);
    setAlerts((prev) => prev.filter((a) => !a.acknowledged));
  };

  const severityIcon = (severity: string) => {
    if (severity === 'critical') return AlertOctagon;
    if (severity === 'warning') return AlertTriangle;
    return Info;
  };

  const severityColor = (severity: string) => {
    if (severity === 'critical') return 'text-destructive bg-destructive/10 border-destructive/30';
    if (severity === 'warning') return 'text-warning bg-warning/10 border-warning/30';
    return 'text-primary bg-primary/10 border-primary/30';
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Risk Alerts</CardTitle>
          {alerts.filter((a) => !a.acknowledged).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {alerts.filter((a) => !a.acknowledged).length}
            </span>
          )}
        </div>
        {alerts.some((a) => a.acknowledged) && (
          <Button variant="ghost" size="sm" onClick={clearAll}><Trash2 className="w-3 h-3 mr-1" /> Clear dismissed</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Live alerts */}
        {liveAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase">Active Alerts</div>
            {liveAlerts.map((alert, i) => {
              const Icon = severityIcon(alert.severity);
              return (
                <div key={i} className={cn('flex items-start gap-3 rounded-lg border p-3', severityColor(alert.severity))}>
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{alert.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{alert.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* History */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase pt-2">Alert History</div>
            {alerts.slice(0, 10).map((alert) => {
              const Icon = severityIcon(alert.severity);
              return (
                <div key={alert.id} className={cn('flex items-start gap-3 rounded-lg border p-3 transition-opacity', severityColor(alert.severity), alert.acknowledged && 'opacity-50')}>
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{alert.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{alert.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{formatDateTime(alert.created_at)}</div>
                  </div>
                  {!alert.acknowledged && (
                    <button onClick={() => acknowledge(alert.id)} className="p-1 rounded hover:bg-secondary transition-colors shrink-0" title="Dismiss">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {liveAlerts.length === 0 && alerts.length === 0 && !loading && (
          <div className="grid place-items-center h-24 text-sm text-muted-foreground">
            No risk alerts. Your trading is within configured limits.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
