'use client';

import { type LucideIcon } from 'lucide-react';
import { getModuleMeta } from '@/lib/module-registry';

export function ComingSoon({ moduleKey }: { moduleKey: string }) {
  const meta = getModuleMeta(moduleKey as any);
  const Icon = meta?.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      {Icon && (
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-2xl" />
          <div className="relative grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-4/20 border border-primary/30">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </div>
      )}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-4">
        Coming Soon
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">{meta?.meta.title || 'Module'}</h2>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
        {meta?.meta.subtitle || 'This module is under active development and will be available soon.'}
        We&apos;re building something powerful here. Stay tuned — this module will integrate seamlessly with your existing TraderOS workspace.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          In Development
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-border">
          Part of the TraderOS Intelligence Suite
        </span>
      </div>
    </div>
  );
}
