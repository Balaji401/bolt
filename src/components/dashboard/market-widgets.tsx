'use client';
import { useMemo } from 'react';
import { CalendarClock, Clock3 } from 'lucide-react';
import { DashboardWidget } from '@/components/dashboard/widget';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getMarketSessions, getMarketEvents, type MarketSession, type MarketEvent } from '@/lib/market-context';

const IMPACT_CLASSES: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-destructive/15 text-destructive',
};

export function MarketSessionsWidget({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const sessions = useMemo<MarketSession[]>(() => getMarketSessions(), []);
  const openCount = sessions.filter((s) => s.status === 'Open').length;

  return (
    <DashboardWidget
      title="Market Sessions"
      description={openCount > 0 ? `${openCount} session${openCount > 1 ? 's' : ''} open now` : 'Markets closed'}
      icon={Clock3}
      action={
        <button
          onClick={() => onNavigate?.('market_context')}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-1 rounded"
          title="View market context"
        >
          Details
        </button>
      }
    >
      <div className="space-y-2">
        {sessions.map((session) => (
          <div key={session.name} className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  session.status === 'Open' ? 'bg-success animate-pulse' : session.status === 'Opening Soon' ? 'bg-warning' : 'bg-muted-foreground/30'
                )}
              />
              <span className="text-sm font-medium">{session.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-muted-foreground tabular-nums">{session.openTime}–{session.closeTime}</span>
              <Badge
                className={cn(
                  'text-[10px] uppercase',
                  session.status === 'Open' ? 'bg-success/15 text-success' : session.status === 'Opening Soon' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                )}
              >
                {session.status === 'Open' ? session.timeRemaining : session.status === 'Opening Soon' ? `in ${session.timeRemaining}` : 'Closed'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}

export function EconomicCalendarWidget({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const events = useMemo<MarketEvent[]>(() => getMarketEvents({ dateRange: 'this_week', sortBy: 'time' }).slice(0, 5), []);

  return (
    <DashboardWidget
      title="Economic Calendar"
      description={events.length > 0 ? `${events.length} upcoming events` : 'No events this week'}
      icon={CalendarClock}
      action={
        <button
          onClick={() => onNavigate?.('market_context')}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-1 rounded"
          title="View full calendar"
        >
          Details
        </button>
      }
    >
      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
              <div className="flex flex-col items-center shrink-0 w-10">
                <span className="text-[10px] text-muted-foreground uppercase">{new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="text-sm font-bold tabular-nums">{new Date(event.date + 'T00:00:00').getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{event.title}</span>
                  <Badge className={cn('text-[9px] uppercase shrink-0', IMPACT_CLASSES[event.impact])}>{event.impact}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {event.scheduledTime} · {event.currency} · {event.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid place-items-center h-[120px] text-xs text-muted-foreground">No events this week</div>
      )}
    </DashboardWidget>
  );
}
