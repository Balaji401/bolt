'use client';
import { Shield, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import type { PsychologyMetrics } from '@/lib/psychology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function DisciplineTracker({ metrics }: { metrics: PsychologyMetrics }) {
  const items = [
    { label: 'Rules Followed', value: metrics.rulesFollowed, icon: CheckCircle2, positive: true },
    { label: 'Rules Broken', value: metrics.rulesBroken, icon: XCircle, positive: false },
    { label: 'Late Entries', value: metrics.lateEntries, icon: Clock, positive: false },
    { label: 'Early Exits', value: metrics.earlyExits, icon: Clock, positive: false },
    { label: 'Risk Violations', value: metrics.riskViolations, icon: AlertCircle, positive: false },
    { label: 'Overtrading Days', value: metrics.overtradingCount, icon: TrendingUp, positive: false },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Discipline Tracker</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase">{item.label}</span>
                <item.icon className={cn('w-3.5 h-3.5', item.positive ? 'text-success' : item.value > 0 ? 'text-destructive' : 'text-muted-foreground')} />
              </div>
              <div className={cn('text-xl font-bold tabular-nums', item.positive ? 'text-success' : item.value > 0 ? 'text-destructive' : '')}>{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
