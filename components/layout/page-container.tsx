'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({
  children,
  className,
  maxWidth = 'default',
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: 'default' | 'wide' | 'narrow';
}) {
  const max = maxWidth === 'wide' ? 'max-w-7xl' : maxWidth === 'narrow' ? 'max-w-3xl' : 'max-w-6xl';
  return <div className={cn('mx-auto w-full', max, className)}>{children}</div>;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
