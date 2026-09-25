'use client';
import { ChevronRight, Home } from 'lucide-react';
import { getModuleMeta, type ModuleKey } from '@/lib/module-registry';
import { cn } from '@/lib/utils';

export function Breadcrumbs({ active, className }: { active: ModuleKey; className?: string }) {
  const meta = getModuleMeta(active);
  if (!meta) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <Home className="w-3 h-3" />
      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
      <span className="text-muted-foreground">{meta.group}</span>
      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
      <span className="text-foreground font-medium">{meta.label}</span>
    </nav>
  );
}
