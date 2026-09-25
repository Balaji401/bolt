'use client';
import { AlertTriangle, AlertCircle, TrendingDown, Flame, Zap, Clock, ArrowUpRight, RotateCcw, ShieldX, CalendarOff, Repeat, Scale, Activity } from 'lucide-react';
import type { BehaviorPattern } from '@/lib/ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PATTERN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  revenge_trading: Flame,
  fomo: Zap,
  overtrading: Activity,
  early_exit: Clock,
  late_entry: ArrowUpRight,
  increasing_risk_after_loss: TrendingDown,
  breaking_rules: ShieldX,
  trading_outside_session: CalendarOff,
  trading_outside_strategy: CalendarOff,
  repeated_mistakes: Repeat,
  inconsistent_sizing: Scale,
  chasing_losses: RotateCcw,
};

const CONFIDENCE_STYLES = {
  high: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary text-muted-foreground border-border',
};

const SEVERITY_ICONS = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Activity,
};

export function BehaviorPatterns({ patterns }: { patterns: BehaviorPattern[] }) {
  if (patterns.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          No behavioral patterns detected yet. Continue trading and journaling — patterns emerge with more data (typically 10+ trades).
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <p className="text-xs text-muted-foreground">
          Patterns are detected from your historical trading data. Each pattern includes supporting evidence and a confidence level based on sample size.
        </p>
      </div>
      {patterns.map((p) => {
        const Icon = PATTERN_ICONS[p.pattern_type] || Activity;
        const SevIcon = SEVERITY_ICONS[p.severity] || AlertTriangle;
        return (
          <Card key={p.pattern_type} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg', p.severity === 'critical' ? 'bg-destructive/10' : p.severity === 'warning' ? 'bg-warning/10' : 'bg-secondary')}>
                  <Icon className={cn('w-4 h-4', p.severity === 'critical' ? 'text-destructive' : p.severity === 'warning' ? 'text-warning' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium">{p.title}</h4>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', CONFIDENCE_STYLES[p.confidence])}>
                      {p.confidence} confidence
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', p.severity === 'critical' ? 'border-destructive/20 text-destructive' : 'border-warning/20 text-warning')}>
                      {p.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{p.occurrence_count} occurrences</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  {p.evidence.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <SevIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                      {p.evidence.slice(0, 4).map((e, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground truncate max-w-[200px]">
                          {e.label}
                        </span>
                      ))}
                      {p.evidence.length > 4 && <span className="text-[10px] text-muted-foreground">+{p.evidence.length - 4} more</span>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
