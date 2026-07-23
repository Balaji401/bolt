'use client';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      {Icon && (<div className="grid place-items-center w-14 h-14 rounded-2xl bg-secondary/60 border border-border mb-4"><Icon className="w-6 h-6 text-muted-foreground" /></div>)}
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description = 'An unexpected error occurred. Please try again.', onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/30 mb-4">
        <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      {onRetry && (<button onClick={onRetry} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">Try again</button>)}
    </div>
  );
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (<div className={cn('flex items-center justify-center gap-3 py-16 text-muted-foreground', className)}><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm">{label}</span></div>);
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 animate-pulse', className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="h-28 rounded-xl bg-secondary/40 border border-border" />))}</div>
      <div className="h-72 rounded-xl bg-secondary/40 border border-border" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => (<div key={i} className="h-48 rounded-xl bg-secondary/40 border border-border" />))}</div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin', className)} />;
}
