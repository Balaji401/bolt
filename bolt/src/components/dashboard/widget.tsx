'use client';
import { type LucideIcon, RefreshCw, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/components/feedback/state';
import { cn } from '@/lib/utils';

export type WidgetState = 'idle' | 'loading' | 'empty' | 'error';

export function DashboardWidget({
  title, description, icon: Icon, state = 'idle', error, onRetry, onRefresh, refreshing, className, children, action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  state?: WidgetState;
  error?: string;
  onRetry?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="text-sm truncate">{title}</CardTitle>
            {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {action}
          {onRefresh && (
            <button onClick={onRefresh} disabled={refreshing} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Refresh">
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {state === 'loading' ? (
          <div className="flex items-center justify-center py-8"><Spinner /></div>
        ) : state === 'error' ? (
          <ErrorState title="Failed to load" description={error} onRetry={onRetry} className="py-8" />
        ) : state === 'empty' ? (
          <EmptyState title="No data yet" description="Data will appear here once available." className="py-8" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
