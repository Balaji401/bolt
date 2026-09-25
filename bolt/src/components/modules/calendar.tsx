'use client';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

type Event = { id: string; time: string; currency: string; impact: 'high' | 'medium' | 'low'; title: string; forecast: string; previous: string };

const SAMPLE_EVENTS: Event[] = [
  { id: '1', time: '08:30', currency: 'USD', impact: 'high', title: 'Non-Farm Payrolls', forecast: '180K', previous: '175K' },
  { id: '2', time: '10:00', currency: 'USD', impact: 'medium', title: 'ISM Manufacturing PMI', forecast: '48.5', previous: '48.7' },
  { id: '3', time: '12:30', currency: 'EUR', impact: 'low', title: 'ECB President Speech', forecast: '—', previous: '—' },
  { id: '4', time: '14:00', currency: 'GBP', impact: 'high', title: 'BoE Interest Rate Decision', forecast: '5.00%', previous: '5.00%' },
  { id: '5', time: '23:50', currency: 'JPY', impact: 'medium', title: 'Tankan Manufacturing Index', forecast: '12', previous: '13' },
];

export function EconomicCalendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /><div><h2 className="text-lg font-semibold">Economic Calendar</h2><p className="text-sm text-muted-foreground">Market-moving events at a glance</p></div></div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Today's Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SAMPLE_EVENTS.map((e) => (
              <div key={e.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                <div className="text-xs font-mono text-muted-foreground w-12">{e.time}</div>
                <Badge variant="outline" className="text-xs">{e.currency}</Badge>
                <div className={cn('w-2 h-2 rounded-full shrink-0', e.impact === 'high' ? 'bg-destructive' : e.impact === 'medium' ? 'bg-warning' : 'bg-muted-foreground')} />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{e.title}</div><div className="text-xs text-muted-foreground">Forecast: {e.forecast} · Previous: {e.previous}</div></div>
                <Badge variant={e.impact === 'high' ? 'destructive' : e.impact === 'medium' ? 'warning' : 'secondary'} className="text-[10px] uppercase">{e.impact}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
