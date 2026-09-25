'use client';
import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn('rounded-xl border border-border bg-secondary/30 animate-pulse', className)} />;
}

export function SkeletonKpiRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-28" />)}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 pb-2 border-b border-border" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {[...Array(cols)].map((_, i) => <SkeletonCard key={i} className="h-4" />)}
      </div>
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="grid gap-2 py-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {[...Array(cols)].map((_, c) => <SkeletonCard key={c} className="h-4" />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <SkeletonCard className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonCard className="h-3 w-3/4" />
            <SkeletonCard className="h-2.5 w-1/2" />
          </div>
          <SkeletonCard className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return <SkeletonCard className="w-full" />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonKpiRow />
      <SkeletonCard className="h-80" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}
