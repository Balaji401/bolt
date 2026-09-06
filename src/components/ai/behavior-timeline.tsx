'use client';
import { Clock, AlertTriangle, AlertCircle, TrendingDown, TrendingUp, Brain, Trophy, ShieldX } from 'lucide-react';
import type { TimelineEvent } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  risk_change: TrendingUp,
  drawdown_change: TrendingDown,
  psychology_change: Brain,
  behavior_change: AlertTriangle,
  performance_change: TrendingUp,
  streak_change: TrendingDown,
  rule_violation: ShieldX,
  milestone: Trophy,
};

const SEVERITY_STYLES = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  success: 'bg-success/10 text-success border-success/20',
  info: 'bg-secondary text-muted-foreground border-border',
};

export function BehaviorTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No timeline events yet. Important changes in your trading behavior will appear here as you add more trades.</CardContent></Card>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">A timeline of important changes in your risk, drawdown, psychology, behavior, and performance. Click events to inspect underlying evidence.</p>
      </div>
      <div className="relative pl-6 space-y-3">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
        {events.map((e, i) => {
          const Icon = EVENT_ICONS[e.event_type] || AlertCircle;
          return (
            <div key={i} className="relative">
              <div className={cn('absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2', SEVERITY_STYLES[e.severity])} />
              <Card className="hover:border-primary/20 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', e.severity === 'critical' ? 'text-destructive' : e.severity === 'warning' ? 'text-warning' : e.severity === 'success' ? 'text-success' : 'text-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{e.title}</span>
                        <span className="text-[10px] text-muted-foreground">{e.event_date}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{e.description}</p>
                      {e.metric_value != null && e.previous_value != null && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Changed from {e.previous_value.toFixed(2)} to {e.metric_value.toFixed(2)}
                        </div>
                      )}
                      {e.evidence.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {e.evidence.slice(0, 3).map((ev, j) => (
                            <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground truncate max-w-[200px]">{ev.label}</span>
                          ))}
                          {e.evidence.length > 3 && <span className="text-[10px] text-muted-foreground">+{e.evidence.length - 3} more</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
