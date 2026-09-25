'use client';
import { TrendingUp } from 'lucide-react';
import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';

export function BrandLogo({ size = 'md', showText = true, className }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean; className?: string }) {
  const dims = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-11 h-11' };
  const iconDims = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 blur-lg rounded-lg" />
        <div className={cn('relative grid place-items-center rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground', dims[size])}><TrendingUp className={iconDims[size]} /></div>
      </div>
      {showText && (<div className="flex flex-col leading-tight"><span className={cn('font-semibold tracking-tight text-foreground', textSizes[size])}>{brand.name}</span><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{brand.subtitle}</span></div>)}
    </div>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (<div className={cn('relative', className)}><div className="absolute inset-0 bg-primary/40 blur-lg rounded-lg" /><div className="relative grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-success text-primary-foreground"><TrendingUp className="w-5 h-5" /></div></div>);
}
